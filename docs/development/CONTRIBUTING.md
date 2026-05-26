# 协作与提交规范

这页约定 TiphiaPress 相关仓库的分支、提交、合并和开发规范。目标是让后端、前端、主题、插件和文档在多个仓库中保持一致节奏。

## 分支模型

| 分支 | 用途 | 规则 |
| --- | --- | --- |
| `dev` | 日常开发分支 | 新功能、重构、文档补充、插件集成都先提交到 `dev`。 |
| `main` | 稳定发布分支 | 只接收经过验证的稳定版本，从 `dev` 合并而来。 |
| `feature/*` | 可选功能分支 | 较大功能可从 `dev` 拉出，完成后合并回 `dev`。 |
| `fix/*` | 可选修复分支 | 较集中 bug 修复可从 `dev` 拉出。紧急生产修复可从 `main` 拉出后回合 `dev`。 |

基本原则：

- 开发中的代码提交到 `dev`。
- 稳定版本从 `dev` 合并到 `main`。
- 不直接把未验证的大改提交到 `main`。
- 发布前在 `dev` 完成构建、测试、文档和迁移验证。

## 提交信息格式

推荐使用类似 Conventional Commits 的格式：

```text
<type>(<scope>): <summary>
```

示例：

```text
feat(plugin): add comment mail push templates
fix(feed): generate post links with frontend routes
docs(deploy): split nginx and cors guide
refactor(frontend): auto register themes and plugins
test(core): cover feed permalink rendering
```

常用 `type`：

| type | 场景 |
| --- | --- |
| `feat` | 新功能。 |
| `fix` | Bug 修复。 |
| `docs` | 文档修改。 |
| `refactor` | 不改变行为的重构。 |
| `style` | 样式、格式、CSS 调整。 |
| `test` | 测试补充或修复。 |
| `perf` | 性能优化。 |
| `build` | 构建脚本、依赖、Docker。 |
| `ci` | CI/CD 配置。 |
| `chore` | 杂项维护。 |

常用 `scope`：

| scope | 说明 |
| --- | --- |
| `core` | 后端核心。 |
| `api` | REST API 或 OpenAPI。 |
| `auth` | 认证授权。 |
| `plugin` | 插件系统或通用插件改动。 |
| `theme` | 主题系统。 |
| `frontend` | 前端骨架。 |
| `admin` | 后台管理。 |
| `blog` | 博客前台数据容器。 |
| `docs` | 文档站。 |
| `deploy` | Docker、Nginx、部署配置。 |
| `migration` | 数据迁移或 Typecho 导入。 |

## 合并到 main 前检查

合并 `dev` 到 `main` 前至少完成：

- 后端：`cargo fmt`、`cargo check`、关键路径 `cargo test`。
- 前端：`yarn build`。
- 文档：`node --check site.js`，确认导航文件存在。
- Docker：重要版本构建镜像并做一次启动 smoke test。
- 迁移：涉及表结构或 Options 契约时，确认迁移可重复执行。
- 插件：确认默认禁用、启用后配置完整才生效。

## 后端开发规范

- 路由层只做参数提取、权限检查和响应转换。
- 业务逻辑放在 `services/`。
- 数据模型放在 `entities/`。
- 迁移放在 `migration/`，新增字段要考虑已有数据默认值。
- 新增 Options key 必须写入开发文档。
- 新插件需求优先补 Hook，不要在核心业务中写插件名判断。
- 公开接口不能泄露草稿、待审核、定时未到的内容。

## 前端开发规范

- 博客骨架只负责获取数据和路由，不写死主题 UI。
- 主题负责前台渲染，插件通过 Hook 插入内容。
- 后台管理不是主题的一部分。
- 新插件放在 `src/plugins/<plugin-name>/index.tsx`，会被自动注册。
- 新主题放在 `src/themes/<theme-name>/index.tsx`，默认导出 `BlogTheme` 对象，会被自动注册。
- 后台文案需要进入 i18n 字典；插件可以通过 i18n Hook 注入语言包。

## 主题开发规范

- 主题目录应自包含：组件、样式、配置面板、favicon、README 都放在主题目录内。
- 主题入口默认导出 `BlogTheme` 对象。
- 主题不要直接调用后端管理 API；数据由骨架传入。
- 默认主题应尽量放置完整 HookSlot，第三方主题可按需求选择。
- 外站链接应提供风险提示，白名单链接除外。

## 插件开发规范

- 后端插件默认禁用。
- 后端插件配置不完整时不要半生效。
- 前端插件目录自包含，不要求用户改业务组件。
- 插件配置 UI 不应负责启用/禁用插件，启用状态由插件列表管理。
- 需要持久化时优先使用插件自己的 Options key 或插件自有表。
- 邮件、Webhook、外部 API 等失败时要写日志，并明确是否阻断主流程。

## 文档规范

- 新功能必须同步更新 `tiphia-docs`。
- 部署、配置、API、Hook、插件/主题开发都要分别记录。
- 文档尽量按任务拆分，不把所有内容堆进一篇大文档。
- 示例配置不要使用真实密钥、真实密码或私人域名。
- 路由和 Options key 这类契约要写清楚，避免前后端和迁移工具不一致。

## Release 节奏

推荐流程：

1. 功能开发进入 `dev`。
2. 在 `dev` 完成测试、构建和文档。
3. 标记候选版本，做 Docker 和部署 smoke test。
4. 合并 `dev` 到 `main`。
5. 在 `main` 打 tag。
6. 发布镜像、前端静态包和文档。