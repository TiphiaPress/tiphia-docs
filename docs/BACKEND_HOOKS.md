# 后端 Hook 文档

后端 Hook 是 TiphiaPress 插件介入核心业务流程的机制。它不是事件广播那么简单，因为 Before Hook 可以修改输入，也可以停止核心流程。因此后端 Hook 应被视为正式扩展 API。

## 调度规则

1. 核心服务创建 `HookContext`。
2. 插件注册表筛选已启用插件。
3. 只选择声明了当前 Hook 的插件。
4. 按优先级从小到大执行。
5. 如果插件返回错误，调度中断，核心操作失败。
6. 如果插件调用 `context.stop(reason)`，后续插件不再执行，核心操作在检查时失败。

优先级示例：

```rust
HookMap::from([
    (Hook::BeforeCommentCreate, 20),
    (Hook::AfterCommentCreate, 100),
])
```

建议：安全校验类插件使用较小优先级，例如 10-30；审计日志类插件使用较大优先级，例如 90-200。

## HookContext 数据流

Before Hook 常见数据流：

```text
CreateCommentInput -> HookContext.subject -> plugin modifies subject -> core reads subject -> write database
```

After Hook 常见数据流：

```text
Saved Model -> HookContext.subject -> plugin reads subject -> audit / notification / sync
```


## 扩展输入与 metadata

插件扩展数据分为两层：

- `subject.extensions`：来自请求体，属于插件自己的输入，例如验证码结果、SEO 字段、自定义字段。
- `HookContext.meta`：核心流程附带的上下文，例如 `post_id`、`author_id`、`can_publish`。

插件读取扩展输入：

```rust
let Some(input) = context.subject_as::<CreatePostInput>()? else { return Ok(()); };
let payload = plugin_extension(&input.extensions, "tiphia-example");
```

插件读取 metadata：

```rust
let post_id = context.meta_as::<i32>("post_id")?;
```

这套模式的目标是让插件开发者只关注插件自身，不需要修改文章、评论、用户等业务结构。

## AppBooting

应用启动中。适合检查插件配置、准备内存状态。

注意：此时不要假设所有外部服务都可用。启动阶段失败会影响整个应用启动。

## AppBooted

应用启动完成。适合记录启动事件、输出插件状态、启动轻量后台任务。

## RequestReceived

请求进入时触发。适合全局审计或统计，但应非常轻量，避免影响所有请求。

## BeforePostList / AfterPostList

文章列表前后。

- Before subject：`ListPostQuery`
- After subject：文章响应列表

用途：追加过滤条件、审计列表查询、同步访问统计。

## BeforePostCreate / AfterPostCreate

文章创建前后。

- Before subject：`CreatePostInput`
- After subject：已保存文章模型

用途：内容校验、敏感词检查、自动摘要、发布通知。

Before Hook 可以修改 `CreatePostInput`：

```rust
let Some(mut input) = context.subject_as::<CreatePostInput>()? else { return Ok(()); };
input.title = input.title.trim().to_owned();
context.replace_subject(input)?;
```

## BeforePostUpdate / AfterPostUpdate

文章更新前后。

- Before subject：`UpdatePostInput`
- After subject：已更新文章模型

用途：记录修订、同步搜索索引、限制状态流转。

## BeforePostDelete / AfterPostDelete

文章删除前后。

用途：清理插件自有数据、删除索引、写审计记录。

## BeforePageList / AfterPageList

页面列表前后。语义和文章列表一致，但目标内容类型是 page。

## BeforePageCreate / AfterPageCreate

页面创建前后。语义和文章创建一致。

## BeforeCommentCreate

评论创建前。

- subject：`CreateCommentInput`

用途：验证码验证、垃圾评论检测、敏感词过滤、URL 规范化。

如果要拒绝评论：

```rust
context.stop("comment rejected by plugin");
```

如果要修改评论内容：

```rust
let Some(mut input) = context.subject_as::<CreateCommentInput>()? else { return Ok(()); };
input.content = input.content.trim().to_owned();
context.replace_subject(input)?;
```

## AfterCommentCreate

评论创建后。

- subject：评论模型

用途：邮件通知、Webhook、审计日志、评论计数同步。

## BeforeCommentModerate / AfterCommentModerate

评论状态变更前后。

用途：记录审核行为、同步垃圾评论系统、通知评论作者。

## BeforeAuthLogin / AfterAuthLogin

登录前后。

用途：验证码、登录风控、IP 限制、登录审计。

Before Hook 可以读取登录输入中的 `captcha` 字段。GeeTest 插件就是在这里验证登录验证码。

## BeforeAuthRegister / AfterAuthRegister

公开注册前后。

用途：验证码、邮箱域名限制、注册审计、欢迎通知。

## BeforeAuthBootstrap / AfterAuthBootstrap

初始化 root 用户前后。

用途：初始化安全校验、初始化审计日志。

## BeforeSettingsRead / AfterSettingsRead

站点设置读取前后。

用途：动态追加插件设置、审计读取行为。一般不建议频繁做重操作，因为前端会经常读取 settings。

## BeforeSettingsUpdate / AfterSettingsUpdate

站点设置更新前后。

用途：校验站点配置、同步缓存、触发主题配置变更事件。

## BeforeTermCreate / AfterTermCreate

分类标签创建前后。

- Before subject：`CreateTermInput`
- After subject：term 模型

用途：分类标签名称检查、外部导航同步。

## BeforeTermUpdate / AfterTermUpdate

分类标签更新前后。

- Before subject：`UpdateTermInput`
- After subject：term 模型

用途：同步搜索索引、同步导航、记录分类改名。

## BeforeTermDelete / AfterTermDelete

分类标签删除前后。

用途：清理插件数据、禁止删除特定分类。

## BeforePostTermsSync / AfterPostTermsSync

文章与分类标签关系同步前后。

- subject：`SyncPostTermsInput` 或同步后的 term 列表，具体以后端服务调用为准。

用途：同步专题、更新聚合页、刷新缓存。

## BeforeRender / AfterRender

内容渲染前后。

- Before subject：`RenderInput`
- After subject：渲染结果

用途：扩展 Markdown、处理短代码、插入目录、清洗 HTML 后审计。

注意：渲染链路安全敏感。插件不要把未经清洗的用户 HTML 直接写回结果。

## 前端语义 Hook 枚举

后端枚举中包含：

- `FrontendHead`
- `FrontendHeader`
- `FrontendFooter`
- `FrontendAuthForm`
- `FrontendCommentForm`
- `FrontendPostContent`
- `AdminMenu`

这些名称用于表达插件能力与元数据，不等同于 React 前端 Hook。React 前端 Hook 请看“前端 Hook 文档”。

## 编写 Hook 的建议

- Before Hook 要明确自己是否会修改 subject。
- After Hook 通常只做副作用，不应再修改核心数据。
- 对外部服务调用必须有超时和失败策略。
- 审计、通知、统计类插件不要阻断核心发布流程，除非这是设计目标。
- 安全、验证码、反垃圾插件可以调用 `stop` 阻断流程。
- Hook 逻辑应有单元测试。
## 业务解耦建议

后端 Hook 的目标是让插件作者不用修改核心业务代码。遇到以下需求时，应优先考虑 Hook 或扩展上下文：

| 需求 | 推荐扩展点 |
| --- | --- |
| 登录前增加二次验证 | `BeforeAuthIssueToken` 或认证扩展 context |
| 登录成功后记录审计日志 | `AfterAuthLogin` |
| 评论提交前做验证码/敏感词/频率控制 | `BeforeCommentCreate` |
| 评论入库后通知外部服务 | `AfterCommentCreate` |
| 文章保存前补充 slug/SEO 信息 | `BeforePostSave` |
| 文章发布后生成索引或通知搜索服务 | `AfterPostPublish` |
| 渲染 HTML 后追加处理 | `AfterPostRender` |

设计 Hook 时需要注意：

- Hook 名称应描述业务时机，而不是某个插件名。
- Context 里可以带 `extensions: serde_json::Value`，让前端插件传递验证码、二次验证 token 等扩展数据。
- Hook 返回错误时必须使用核心 `AppError`，不要 panic。
- Hook 执行顺序由 priority 控制，安全类插件通常应较早执行。
- 默认插件应禁用，启用状态由后台插件管理。未启用插件不应影响核心流程。

## 与前端 Hook 的关系

后端 Hook 解决“业务流程扩展”，前端 Hook 解决“页面插入 UI”。例如验证码插件需要两边配合：

1. 前端插件在 `admin.auth.captcha` 或 `blog.comment.captcha` 插入验证码组件。
2. 前端提交登录、注册或评论时，把验证码结果放到 `extensions`。
3. 后端插件在认证或评论 Hook 中读取 `extensions` 并验证。
4. 验证失败时返回结构化错误，前端表单展示提示。

这样新增验证码、二次认证或风控插件时，不需要再硬编码到登录页或评论页中。