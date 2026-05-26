# 插件开发文档

TiphiaPress 插件是编译期 Rust 插件。插件不是运行时动态库，也不是脚本扩展，而是普通 Rust crate，和主程序一起编译。这种方式牺牲了一部分“在线安装”的灵活性，但换来了类型安全、依赖可控、部署简单和更低的运行时安全风险。

## 插件仓库结构

典型后端插件结构：

```text
plugins/tiphia-plugin-example/
  Cargo.toml
  README.md
  src/lib.rs
```

`Cargo.toml` 至少依赖核心库：

```toml
[package]
name = "tiphia-plugin-example"
version = "0.1.0"
edition = "2024"

[dependencies]
tiphia-core = { path = "../../crates/tiphia-core" }
axum = "0.8"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

插件可以有自己的模块、依赖、测试和数据库迁移。只要主程序依赖该插件 crate 并调用注册函数，它就会进入插件注册表。

## 注册入口

插件应提供一个公开注册函数：

```rust
use tiphia_core::{AppResult, plugins::PluginRegistryBuilder};

pub fn register(builder: &mut PluginRegistryBuilder) -> AppResult<()> {
    builder.register(ExamplePlugin);
    Ok(())
}
```

主程序中注册：

```rust
fn register_compiled_plugins(builder: &mut PluginRegistryBuilder) -> AppResult<()> {
    tiphia_plugin_example::register(builder)?;
    Ok(())
}
```

## Plugin trait 完整说明

插件实现 `tiphia_core::plugins::Plugin`：

```rust
#[async_trait]
pub trait Plugin: Send + Sync {
    fn manifest(&self) -> &'static PluginManifest;

    async fn install(&self, _db: &DatabaseConnection) -> AppResult<()> { Ok(()) }

    fn migrations(&self) -> Vec<SharedMigration> { Vec::new() }

    fn hooks(&self) -> HookMap { HookMap::default() }

    fn admin_menu(&self) -> Vec<AdminMenuItem> { Vec::new() }

    fn config_schema(&self) -> Option<PluginConfigSchema> { None }

    async fn activate(&self) -> AppResult<()> { Ok(()) }

    async fn handle(&self, _hook: Hook, _context: &mut HookContext) -> AppResult<()> { Ok(()) }

    fn route_prefix(&self) -> Option<&'static str> { None }

    fn route_router(&self) -> Option<Router<AppState>> { None }

    fn routes(&self, router: Router<AppState>) -> Router<AppState> { router }
}
```

### manifest

必须实现。返回插件元信息：

```rust
static MANIFEST: PluginManifest = PluginManifest {
    name: "tiphia-example",
    version: "0.1.0",
    description: "Example plugin.",
    author: "TiphiaPress",
};

fn manifest(&self) -> &'static PluginManifest {
    &MANIFEST
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `&'static str` | 插件唯一名称。会用于配置 key、状态 key、前后端插件匹配。 |
| `version` | `&'static str` | 插件版本。 |
| `description` | `&'static str` | 后台插件页展示说明。 |
| `author` | `&'static str` | 作者。 |

### install

签名：

```rust
async fn install(&self, db: &DatabaseConnection) -> AppResult<()>;
```

调用时机：插件注册表构建期间，插件迁移执行后，`activate` 之前。

用途：

- 初始化默认配置。
- 写入 option。
- 准备插件运行所需数据。

建议使用 `ensure_plugin_config` 避免覆盖用户已有配置：

```rust
async fn install(&self, db: &DatabaseConnection) -> AppResult<()> {
    ensure_plugin_config(db, self.manifest().name, serde_json::json!({
        "enabled": false
    })).await
}
```

### migrations

签名：

```rust
fn migrations(&self) -> Vec<SharedMigration>;
```

调用时机：插件安装阶段，在 `install` 前执行。

用途：创建插件自有表、索引或数据结构。迁移 ID 必须全局唯一，推荐格式：

```text
plugin:<plugin-name>:0001:<description>
```

例如：

```text
plugin:tiphia-audit:0001:create-audit-events
```

### hooks

签名：

```rust
fn hooks(&self) -> HookMap;
```

返回值：`BTreeMap<Hook, i32>`，值是优先级，数值越小越早执行。

示例：

```rust
fn hooks(&self) -> HookMap {
    HookMap::from([
        (Hook::BeforeCommentCreate, 20),
        (Hook::AfterCommentCreate, 100),
    ])
}
```


## 命名空间扩展输入 extensions

为了避免“每写一个插件就修改核心业务结构”，核心请求对象提供了通用 `extensions` 字段。插件作者应把自己的前端输入放在以插件名命名的对象下，后端插件只读取自己的命名空间。

目前支持 `extensions` 的输入包括：

| 输入结构 | 常见 Hook | 用途示例 |
| --- | --- | --- |
| `LoginInput` | `BeforeAuthLogin` | MFA、验证码、登录风控。 |
| `RegisterInput` | `BeforeAuthRegister` | 注册验证码、邀请码、邮箱域名限制。 |
| `CreateCommentInput` | `BeforeCommentCreate` | 评论验证码、反垃圾、匿名访客扩展字段。 |
| `CreatePostInput` | `BeforePostCreate` / `BeforePageCreate` | SEO 字段、自定义字段、同步外部平台。 |
| `UpdatePostInput` | `BeforePostUpdate` | SEO 字段更新、自定义字段更新、搜索索引控制。 |
| `ChangePostStatusInput` | 状态变更流程 | 发布同步、定时发布扩展。 |
| `BulkPostActionInput` | 批量内容操作 | 批量同步、批量清理插件数据。 |
| `CreateTermInput` / `UpdateTermInput` | 分类标签创建/更新 | 分类图标、导航扩展、外部映射 ID。 |
| `SyncPostTermsInput` | `BeforePostTermsSync` | 专题同步、分类关系扩展。 |

请求示例：

```json
{
  "title": "一篇文章",
  "markdown": "正文",
  "extensions": {
    "tiphia-seo": {
      "canonical_url": "https://example.com/post",
      "robots": "index,follow"
    },
    "tiphia-webhook": {
      "notify": true
    }
  }
}
```

插件读取示例：

```rust
use tiphia_core::{
    plugins::{Hook, HookContext},
    services::{auth::plugin_extension, posts::CreatePostInput},
    AppResult,
};

async fn handle(&self, hook: Hook, context: &mut HookContext) -> AppResult<()> {
    if hook != Hook::BeforePostCreate {
        return Ok(());
    }

    let Some(input) = context.subject_as::<CreatePostInput>()? else {
        return Ok(());
    };

    if let Some(payload) = plugin_extension(&input.extensions, self.manifest().name) {
        // 只处理本插件的 payload
    }

    Ok(())
}
```

兼容说明：旧版 GeeTest 曾使用顶层 `captcha` 字段。该字段暂时保留，但新插件应优先使用 `extensions[plugin-name]`。

## HookContext metadata

`subject` 表示核心业务输入或输出；`meta` 表示请求体之外的上下文，例如当前文章 ID、作者 ID、权限信息。插件不要为了拿这些上下文去反查或要求核心 DTO 添加字段，而应读取 metadata。

读取示例：

```rust
let post_id = context.meta_as::<i32>("post_id")?;
let can_publish = context.meta_as::<bool>("can_publish")?.unwrap_or(false);
```

当前 metadata 约定：

| Hook | metadata |
| --- | --- |
| `BeforePostCreate` | `author_id`、`can_publish`、`post_type` |
| `BeforePostUpdate` | `post_id`、`can_publish` |
| `AfterPostUpdate` | `post_id` |
| `BeforeTermUpdate` | `term_id` |
| `AfterTermUpdate` | `term_id` |
| `BeforePostTermsSync` | `post_id`、`extensions` |
| `AfterPostTermsSync` | `post_id`、`extensions` |

设计建议：

- 插件自己的表单字段放 `extensions[plugin-name]`。
- 当前用户、文章 ID、权限、来源等执行上下文放 metadata。
- Before Hook 可以修改 subject；After Hook 通常只做副作用。
- 插件需要持久化时使用插件自有表或 options key，不要污染核心表结构。

### admin_menu

签名：

```rust
fn admin_menu(&self) -> Vec<AdminMenuItem>;
```

用于向后台提供插件菜单元数据。结构：

```rust
pub struct AdminMenuItem {
    pub label: &'static str,
    pub path: &'static str,
    pub icon: Option<&'static str>,
    pub order: i32,
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `label` | 菜单显示名。 |
| `path` | 前端路由或插件管理路径。 |
| `icon` | 可选图标名，由前端解释。 |
| `order` | 排序，数值越小越靠前。 |

### config_schema

签名：

```rust
fn config_schema(&self) -> Option<PluginConfigSchema>;
```

用于描述插件配置字段，后台可以自动生成配置表单。结构：

```rust
pub struct PluginConfigSchema {
    pub fields: Vec<PluginConfigField>,
}

pub struct PluginConfigField {
    pub key: &'static str,
    pub label: &'static str,
    pub field_type: PluginConfigFieldType,
    pub required: bool,
    pub default: Option<Value>,
    pub help: Option<&'static str>,
}

pub enum PluginConfigFieldType {
    Text,
    Textarea,
    Number,
    Boolean,
    Json,
}
```

示例：

```rust
fn config_schema(&self) -> Option<PluginConfigSchema> {
    Some(PluginConfigSchema {
        fields: vec![
            PluginConfigField {
                key: "verify_login",
                label: "Verify login",
                field_type: PluginConfigFieldType::Boolean,
                required: false,
                default: Some(json!(false)),
                help: Some("Require captcha before login."),
            },
        ],
    })
}
```

字段类型建议：

| 类型 | 适合内容 |
| --- | --- |
| `Text` | 短字符串、URL、ID、密钥。 |
| `Textarea` | 长文本、自定义 HTML、说明。 |
| `Number` | 数量、超时、排序。 |
| `Boolean` | 开关。 |
| `Json` | 复杂结构，如友情链接数组、规则列表。 |

### activate

签名：

```rust
async fn activate(&self) -> AppResult<()>;
```

调用时机：插件安装完成后，应用启动阶段。

用途：

- 预热纯内存状态。
- 检查必要环境。
- 记录启动日志。

注意：不要在这里执行长时间阻塞任务。如果需要后台任务，应确保可控、可取消，并注意多实例部署影响。

### handle

签名：

```rust
async fn handle(&self, hook: Hook, context: &mut HookContext) -> AppResult<()>;
```

调用时机：当核心业务 dispatch 对应 Hook 时。

用途：

- 校验输入。
- 修改 subject。
- 写审计日志。
- 调用外部服务。
- 停止核心流程。

示例：

```rust
async fn handle(&self, hook: Hook, context: &mut HookContext) -> AppResult<()> {
    match hook {
        Hook::BeforeCommentCreate => {
            let Some(mut input) = context.subject_as::<CreateCommentInput>()? else {
                return Ok(());
            };
            input.content = input.content.trim().to_owned();
            context.replace_subject(input)?;
        }
        Hook::AfterCommentCreate => {
            let db = context.database()?;
            // write audit record
        }
        _ => {}
    }
    Ok(())
}
```

### route_prefix 与 route_router

这是一种推荐的插件路由挂载方式。

```rust
fn route_prefix(&self) -> Option<&'static str> {
    Some("/api/v1")
}

fn route_router(&self) -> Option<Router<AppState>> {
    Some(Router::new().route("/links", get(list_links)))
}
```

通过这种方式挂载的路由会经过插件启用状态中间件。插件未启用时返回 404。

### routes

签名：

```rust
fn routes(&self, router: Router<AppState>) -> Router<AppState>;
```

这是更底层的路由修改方式，可以直接对主 Router 做修改。适合极少数需要完全自定义挂载行为的插件。一般优先使用 `route_prefix` + `route_router`。

## HookContext API

`HookContext` 是 Hook 执行时的上下文。

结构字段：

```rust
pub struct HookContext {
    pub subject: Option<Value>,
    pub meta: BTreeMap<String, Value>,
    pub stopped: bool,
    pub stop_reason: Option<String>,
}
```

### with_subject

```rust
pub fn with_subject<T>(subject: T) -> AppResult<Self>
where
    T: Serialize;
```

由核心业务创建上下文时使用。插件通常不需要主动调用，除非插件内部再次分发自定义流程。

### database

```rust
pub fn database(&self) -> AppResult<&DatabaseConnection>;
```

获取数据库连接。调度器会在执行 Hook 前自动注入数据库。

### subject_as

```rust
pub fn subject_as<T>(&self) -> AppResult<Option<T>>
where
    T: for<'de> Deserialize<'de>;
```

读取 subject，但不移除。

### take_subject

```rust
pub fn take_subject<T>(&mut self) -> AppResult<Option<T>>
where
    T: for<'de> Deserialize<'de>;
```

读取并移除 subject。核心服务经常在 Before Hook 后用它读取被插件修改后的输入。

### replace_subject

```rust
pub fn replace_subject<T>(&mut self, subject: T) -> AppResult<()>
where
    T: Serialize;
```

替换 subject。适合修改输入内容，例如修剪评论、规范化文章内容。

### insert_meta

```rust
pub fn insert_meta<T>(&mut self, key: impl Into<String>, value: T) -> AppResult<()>
where
    T: Serialize;
```

写入附加信息。适合在多个插件之间传递轻量信息。

### stop

```rust
pub fn stop(&mut self, reason: impl Into<String>);
```

停止流程。后续插件不会继续执行，核心服务调用 `ensure_not_stopped` 时会返回插件错误。

### ensure_not_stopped

```rust
pub fn ensure_not_stopped(&self) -> AppResult<()>;
```

核心服务使用它检查流程是否被插件中断。插件一般不需要主动调用。

## 后端 Hook 列表

### 应用生命周期

- `AppBooting`
- `AppBooted`
- `RequestReceived`

### 文章生命周期

- `BeforePostList`
- `AfterPostList`
- `BeforePostCreate`
- `AfterPostCreate`
- `BeforePostUpdate`
- `AfterPostUpdate`
- `BeforePostDelete`
- `AfterPostDelete`

### 页面生命周期

- `BeforePageList`
- `AfterPageList`
- `BeforePageCreate`
- `AfterPageCreate`

当前页面更新和删除复用内容服务能力，文档应以后端实际 Hook 枚举为准。

### 评论生命周期

- `BeforeCommentCreate`
- `AfterCommentCreate`
- `BeforeCommentModerate`
- `AfterCommentModerate`

### 认证生命周期

- `BeforeAuthLogin`
- `AfterAuthLogin`
- `BeforeAuthRegister`
- `AfterAuthRegister`
- `BeforeAuthBootstrap`
- `AfterAuthBootstrap`

### 设置生命周期

- `BeforeSettingsRead`
- `AfterSettingsRead`
- `BeforeSettingsUpdate`
- `AfterSettingsUpdate`

### 分类标签生命周期

- `BeforeTermCreate`
- `AfterTermCreate`
- `BeforeTermUpdate`
- `AfterTermUpdate`
- `BeforeTermDelete`
- `AfterTermDelete`
- `BeforePostTermsSync`
- `AfterPostTermsSync`

### 渲染生命周期

- `BeforeRender`
- `AfterRender`

### 前端语义 Hook

后端枚举中也保留了一些前端语义 Hook 名称：

- `FrontendHead`
- `FrontendHeader`
- `FrontendFooter`
- `FrontendAuthForm`
- `FrontendCommentForm`
- `FrontendPostContent`
- `AdminMenu`

这些名称主要用于表达插件能力边界。实际 React 插槽由前端 Hook 系统负责。

## 配置读取与默认值

推荐使用：

```rust
load_plugin_config(db, plugin_name, default_config).await
```

或带 normalize 的版本：

```rust
load_plugin_config_with(db, plugin_name, default_config, normalize).await
```

配置会从 options 表读取，并与默认配置合并。这样新增配置字段时，旧配置不会因为缺字段而反序列化失败。

## 插件状态

插件状态 key：

```text
plugin:<plugin-name>:state
```

默认状态：

```json
{ "enabled": false }
```

插件默认禁用。启用后才会参与 Hook 调度；使用 `route_prefix` + `route_router` 挂载的插件路由也只有启用后才可访问。

## 完整最小插件示例

```rust
use async_trait::async_trait;
use axum::{Json, Router, routing::get};
use serde_json::json;
use tiphia_core::{
    AppResult,
    app::AppState,
    plugins::{
        Hook, HookContext, HookMap, Plugin, PluginConfigField, PluginConfigFieldType,
        PluginConfigSchema, PluginManifest, PluginRegistryBuilder, ensure_plugin_config,
    },
};

pub fn register(builder: &mut PluginRegistryBuilder) -> AppResult<()> {
    builder.register(ExamplePlugin);
    Ok(())
}

pub struct ExamplePlugin;

static MANIFEST: PluginManifest = PluginManifest {
    name: "tiphia-example",
    version: "0.1.0",
    description: "Example plugin.",
    author: "TiphiaPress",
};

#[async_trait]
impl Plugin for ExamplePlugin {
    fn manifest(&self) -> &'static PluginManifest {
        &MANIFEST
    }

    async fn install(&self, db: &sea_orm::DatabaseConnection) -> AppResult<()> {
        ensure_plugin_config(db, MANIFEST.name, json!({ "message": "hello" })).await
    }

    fn hooks(&self) -> HookMap {
        HookMap::from([(Hook::AppBooted, 100)])
    }

    fn config_schema(&self) -> Option<PluginConfigSchema> {
        Some(PluginConfigSchema {
            fields: vec![PluginConfigField {
                key: "message",
                label: "Message",
                field_type: PluginConfigFieldType::Text,
                required: false,
                default: Some(json!("hello")),
                help: Some("Message returned by the plugin endpoint."),
            }],
        })
    }

    async fn handle(&self, hook: Hook, _context: &mut HookContext) -> AppResult<()> {
        tracing::info!(?hook, "example plugin handled hook");
        Ok(())
    }

    fn route_prefix(&self) -> Option<&'static str> {
        Some("/api/v1")
    }

    fn route_router(&self) -> Option<Router<AppState>> {
        Some(Router::new().route("/example", get(example)))
    }
}

async fn example() -> Json<serde_json::Value> {
    Json(json!({ "ok": true }))
}
```

## 前端插件配套

如果插件需要后台配置页或博客前台渲染内容，应在 `tiphia-frontend/src/plugins/<plugin-name>/` 中提供前端插件：

```tsx
registerFrontendPlugin({
  name: "tiphia-example",
  hooks: [
    {
      hook: "blog.footer.before",
      order: 50,
      render: () => <span>Example</span>,
    },
  ],
});
```

前端插件名应与后端插件 manifest name 一致。这样前端可以根据后端插件启用状态决定是否渲染。

## 安全与质量要求

专业插件至少应满足：

- 配置为空时安全降级。
- 外部请求有超时。
- 不在 Hook 中执行不可控阻塞任务。
- 自定义路由校验输入。
- 不返回敏感配置，例如密钥。
- 写单元测试覆盖配置解析和关键 Hook。
- README 说明配置字段、API、Hook 和安全注意事项。
## 前后端插件交付约定

一个完整插件通常包含两部分：

```text
后端插件仓库或目录：
  plugins/tiphia-plugin-example/
    Cargo.toml
    README.md
    src/lib.rs

前端插件目录：
  tiphia-frontend/src/plugins/tiphia-example/
    index.tsx
    ExampleConfigPanel.tsx
    styles.css
    README.md
```

后端插件负责：

- manifest、安装、迁移、配置 schema。
- 后端 Hook，例如文章发布前、评论创建前、登录后验证等。
- 插件公开 API 或后台 API，例如 `/api/v1/example/status`。
- 持久化配置和数据。

前端插件负责：

- 注册 `registerFrontendPlugin`。
- 声明 `backendNames`，让前端能根据后端启用状态过滤插件。
- 提供后台配置面板。
- 注册前台/后台 hook UI。
- 通过统一 API client 调用后端插件路由。

插件作者不应要求用户修改核心业务代码。需要核心流程扩展时，应优先检查是否已有后端 Hook；没有就向核心新增通用 Hook，而不是在某个插件里硬改登录、评论或文章服务。

## 插件配置与默认禁用

插件默认状态应为禁用。安装插件时可以写入默认配置，但不应自动开启高风险行为。

推荐：

```rust
ensure_plugin_config(db, self.manifest().name, serde_json::json!({
    "enabled": false,
    "verify_login": false
})).await
```

插件配置要求：

- README 必须提供完整 JSON 示例。
- 后台配置 Panel 必须能从空配置安全初始化。
- 后端路由读取配置时要做类型兜底，不能因为用户保存了非法 JSON 就 panic。
- 如果配置为空但插件被启用，例如 GeeTest 未填写 `captcha_id`，插件应当视为“不生效”，而不是阻断登录或评论。

## 插件 API 与前端调用

插件 API 应遵守核心 REST 风格：

```text
GET    /api/v1/<plugin>/status
GET    /api/v1/<plugin>/config-public
POST   /api/v1/<plugin>/setup
PUT    /api/v1/<plugin>/config
DELETE /api/v1/<plugin>/items/{id}
```

公开接口和后台接口要分清楚：

- 公开博客可访问的接口不要返回密钥、secret、内部配置。
- 后台配置接口必须鉴权，并按角色校验权限。
- 需要登录态的插件接口应复用核心认证 extractor，不要自己解析 JWT。
- 前端插件调用接口时必须使用统一 API base，不要硬编码域名。

## Hook 设计原则

新增 Hook 时优先考虑“通用上下文”，不要为某个具体插件定制过窄接口。

好例子：

```rust
Hook::BeforeAuthIssueToken
Hook::AfterAuthLogin
Hook::BeforeCommentCreate
Hook::AfterPostRender
```

不好的例子：

```rust
Hook::BeforeGoogleAuthenticatorLoginOnly
Hook::AfterLinksPluginSave
```

Hook context 应提供：

- 当前用户或匿名身份。
- 输入数据的可变引用或扩展字段。
- 请求来源信息，例如 IP、User-Agent。
- 可选插件扩展字段 `extensions`，用于验证码、二次验证等扩展。

如果插件需要阻断流程，应返回结构化错误，前端才能展示友好的提示。