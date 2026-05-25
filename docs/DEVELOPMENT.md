# 开发文档

TiphiaPress 拆分为后端、前端、主题和文档多个仓库。日常开发通常需要同时启动后端和前端。

## 仓库结构

推荐目录：

```text
TiphiaPress/
  tiphia/                  后端核心仓库
  tiphia-frontend/         前端骨架和后台管理
  tiphia-default-themes/   默认主题仓库
  tiphia-docs/             GitHub Pages 文档仓库
```

## 后端开发

进入后端仓库：

```bash
cd tiphia
cp tiphia.example.toml tiphia.toml
cp .env.example .env
cargo run
```

常用命令：

```bash
cargo check --locked
cargo test --workspace --locked
cargo clippy --workspace --all-targets --locked -- -D warnings
```

后端默认提供：

- `/health`
- `/openapi.json`
- `/api/v1/*`
- `/feed.xml`
- `/atom.xml`
- `/sitemap.xml`
- `/robots.txt`

## 前端开发

进入前端仓库：

```bash
cd tiphia-frontend
yarn install
yarn dev
```

前端默认地址：

```text
http://127.0.0.1:5173
```

后台地址：

```text
http://127.0.0.1:5173/admin
```

如果后端地址不是默认值，设置：

```bash
VITE_TIPHIA_API_BASE=http://127.0.0.1:3000
```

## 主题开发

默认主题源码可以从 `tiphia-default-themes` 复制或以 Git submodule 的方式放到：

```text
tiphia-frontend/src/themes/default
```

主题代码只负责渲染前台 UI。主题配置从后端 settings API 读取，前端骨架会把配置传给主题组件。

## 文档开发

`tiphia-docs` 是静态站，不需要构建。直接编辑 `docs/*.md`，然后打开 `index.html` 或使用静态服务器预览：

```bash
python -m http.server 8080
```

## 代码风格建议

- 后端保持服务、路由、实体、迁移、插件边界清晰。
- 前端骨架负责路由、数据加载、Hook 体系和主题装配。
- 主题只负责视觉和布局，不要耦合后台管理逻辑。
- 插件前端和后端可以协作，但不要假设一定同时存在。
- 文档要描述约定，而不是隐藏在代码里的口头规则。

## 前端骨架、主题与插件协作约定

TiphiaPress 的公开前台不采用“主题自己到处请求 API”的模式，而是采用骨架驱动：

1. `src/blog` 根据路由加载站点设置、文章、页面、评论、分类标签和公开插件数据。
2. `src/framework/plugin-hooks` 根据后端插件启用状态过滤前端插件。
3. 当前主题从骨架接收标准化 props，例如文章列表、页面内容、评论树、主题配置和 action callbacks。
4. 主题决定布局和插槽位置，插件通过 `FrontendHookSlot` 插入内容。

开发新页面时，应先判断它属于哪一层：

- 数据获取、路由、权限、SEO、提交动作：放在骨架。
- 公开博客视觉结构：放在主题。
- 可开关扩展能力：放在插件。
- 后台管理和配置表单：放在 admin 或插件配置面板。

如果一个功能需要后端持久化，应优先设计后端插件路由或核心 API，再让前端插件调用它。不要把持久化数据写死在主题配置里。

## 后台权限与接口可见性

后台页面的前端可见性由 `src/admin/lib/permissions.ts` 管理。新增后台页面时必须同步：

1. 增加 `AdminSection`。
2. 在权限矩阵中给 `root`、`admin`、`editor` 等角色配置可见性。
3. 在 `src/admin/App.tsx` 使用 `RequirePermission` 包裹路由。
4. Dashboard 或其它汇总页如果会读取相关接口，必须先判断 `canAccessAdminSection`，无权限时不要启用对应 query。

前端隐藏页面只是体验优化。后端仍必须继续做权限校验，不能依赖前端隐藏按钮来保证安全。

## Option 表契约

`options` 表用于保存系统级、插件级和主题级的轻量配置。它不是随意 key-value 垃圾桶；新增 key 前必须先写清楚用途、值结构、读写入口和迁移策略。

当前核心约定：

| Key | Value 结构 | 用途 |
| --- | --- | --- |
| `site:settings` | `SiteSettings` JSON | 站点标题、描述、头像、Gravatar 镜像、公开注册、SEO、主题配置等。 |
| `plugin:{plugin_name}:state` | `{ "enabled": boolean }` | 插件启用状态。后台插件页读写。 |
| `plugin:{plugin_name}:config` | 插件自定义 JSON | 插件配置。结构由插件 schema 和 README 说明。 |
| `post:view:{post_id}` | `{ "count": number }` | 文章阅读次数统计。公开文章详情访问时累加，热门文章和默认主题热门组件会读取它。 |

### 文章阅读次数

文章阅读次数没有放在 `posts` 表字段中，而是使用 `options` 表的 `post:view:{post_id}` 保存。这是为了避免核心文章模型频繁变动，也方便插件或迁移工具独立维护统计值。

开发者必须注意：

- 所有核心代码、主题组件和迁移工具都应使用同一套 key：`post:view:{post_id}`。
- Typecho 迁移工具迁移浏览量时也应写入该 key，值为 `{ "count": 原浏览量 }`。
- 不要再新增 `views:{id}`、`post_views:{id}` 等平行 key，否则热门文章和统计组件会读不到。
- 如果未来要把阅读次数迁移到独立表或 Redis，需要提供一次性迁移和兼容读取，而不能直接删除旧 key。

### 插件配置

插件配置使用 `plugin:{plugin_name}:config`，插件启用状态使用 `plugin:{plugin_name}:state`。插件作者应在 README 中写清楚：

- 配置 JSON 的完整示例。
- 每个字段的类型、默认值和是否必填。
- 插件公开 API 的路径和返回结构。
- 插件后端 hook 和前端 hook 的协作方式。

### 主题配置

主题配置嵌套在 `site:settings.theme` 中，而不是单独拆成多个 option key。这样后台设置保存、主题列表和公开博客读取可以保持一致。

结构示例：

```json
{
  "active": "default",
  "configs": {
    "default": {
      "accent": "#2563eb"
    }
  },
  "config": {
    "accent": "#2563eb"
  }
}
```

`active` 为空时表示没有启用任何主题配置。