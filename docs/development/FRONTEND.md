# 前端架构与开发范式

TiphiaPress 前端是一个“骨架 + 主题 + 插件”的组合系统。后台管理属于骨架的一部分；公开博客页面则尽量只由骨架获取数据、维护路由和状态，再把数据交给当前主题渲染。

## 目录结构

```text
tiphia-frontend/
  src/admin/                 后台管理页面、后台 API client、后台权限与表单
  src/blog/                  公开博客骨架：路由、数据获取、SEO、评论提交等非视觉逻辑
  src/framework/             Hook、i18n、插件注册、通用运行时能力
  src/plugins/<plugin>/      前端插件：hook 注册、配置面板、运行时代码和样式
  src/themes/<theme>/        主题：前台页面布局、视图组件、主题样式和主题 README
```

约束：主题和插件的文件应放在各自目录中，不依赖 `public` 目录分散资产。主题作者需要的 CSS、图片、运行时代码都应在 `src/themes/<theme>/` 内；插件作者需要的配置面板、运行时代码和样式都应在 `src/plugins/<plugin>/` 内。

## 职责边界

前端骨架负责：

- 读取后端 REST API：站点设置、文章、页面、分类、标签、评论、插件状态、主题配置。
- 管理公开博客路由：列表、文章详情、自定义页面、时间线、分类标签页、注册页、外站跳转提示等。
- 管理后台路由、登录态、角色可见性、表单提交、Toast、确认框。
- 维护插件系统、HookSlot、i18n 注册、head 副作用。
- 把标准化数据作为 props/context 交给主题。

主题负责：

- 公开博客的所有视觉呈现：布局、卡片、评论树、页脚、导航、表格、图片、代码块容器等。
- 决定在哪里放置 `FrontendHookSlot`。
- 读取骨架传入的主题配置，并把它转成 CSS 变量、布局参数或显示策略。
- 只在主题确实拥有某个扩展数据时才自己请求额外接口。核心文章、评论、分类、设置等数据应优先使用骨架传入的数据。

插件负责：

- 注册前端 hook、head effect、i18n 语言包、后台配置面板。
- 在需要持久化时调用对应后端插件路由，例如 `/api/v1/links`、`/api/v1/filing`。
- 不直接修改主题源码；主题是否渲染某个 hook 由主题作者决定。

## 渲染链路

典型的博客页面链路如下：

```text
后端 REST API
  -> src/blog 页面容器获取数据
  -> src/framework 过滤已启用插件并注册 hook/i18n/head
  -> src/themes 当前主题接收数据和配置
  -> 主题渲染视图并在合适位置调用 FrontendHookSlot
  -> 插件在 hook 中渲染补充 UI 或执行 head 副作用
```

组合关系可以理解为：

```text
主题 <- 前端骨架 <- 前端插件逻辑 <- 后端插件
```

这句话的含义是：主题负责最终 UI；骨架负责把数据和运行时能力交给主题；前端插件通过骨架注册逻辑；后端插件提供持久化、配置 schema、事件 hook 和公开 API。

## 主题数据输入

主题不应假设自己能直接访问后台状态。公开主题通常会收到这些数据：

- `settings`：站点设置，包含标题、描述、头像、Gravatar 镜像、公开注册开关、主题配置等。
- `themeConfig`：当前启用主题配置的解析结果。
- `posts` / `post` / `page`：文章、文章详情或自定义页面。
- `terms`：分类和标签。
- `comments`：已审核评论树，主题可以控制嵌套展示方式。
- `widgets`：热门文章、最新评论、归档、标签云等由骨架整理好的数据。
- `actions`：评论提交、搜索、分页跳转等动作入口。

主题可以把配置字段映射为 CSS 变量，例如默认主题会把强调色映射为按钮、链接、焦点态等统一颜色。

## 前端插件开发

插件目录示例：

```text
src/plugins/tiphia-links/
  index.tsx               注册插件、hook、i18n、后台配置面板
  LinksConfigPanel.tsx    后台配置 UI
  FriendLinks.tsx         前台 hook 组件
  styles.css              插件样式
```

注册示例：

```tsx
import { registerFrontendPlugin } from "../../framework/plugin-hooks";
import { LinksConfigPanel } from "./LinksConfigPanel";

registerFrontendPlugin({
  name: "tiphia-links",
  backendNames: ["tiphia-plugin-links"],
  adminConfigPanel: LinksConfigPanel,
  hooks: [
    {
      hook: "blog.custom-page.links",
      order: 20,
      render: (context) => <FriendLinks page={context.page} />,
    },
  ],
});
```

`backendNames` 用于兼容后端插件名和前端插件目录名不一致的情况。骨架会根据后端插件启用状态决定前端插件是否参与渲染。

## 后台权限显示

后台页面的可见性由 `src/admin/lib/permissions.ts` 统一控制。侧边栏、直接访问路由和 Dashboard 查询都应使用同一套权限判断。前端隐藏无权限页面只是用户体验优化，真正的权限仍必须由后端校验。

默认约定：

- `root` / `admin`：可访问全部后台页面。
- `editor`：可访问总览、文章、页面、评论、分类标签。
- `author`：默认不能进入管理后台。

新增后台页面时必须同步：

1. 在 `AdminSection` 增加 section。
2. 在权限矩阵中指定哪些角色可见。
3. 在路由中使用 `RequirePermission` 包裹。
4. 如果 Dashboard 需要读取相关接口，必须先判断权限再启用 query。

## i18n

核心语言包在 `src/framework/i18n.tsx`。插件可以通过 `registerFrontendPlugin({ i18n })` 增加语言或覆盖文案。主题和插件新增用户可见文案时，应优先使用 i18n key，不要硬编码中文或英文。

## 构建

```bash
yarn install
yarn dev
yarn build
```

后台地址通常是 `/admin`，公开博客地址是 `/`。后端地址通过 `VITE_TIPHIA_API_BASE` 配置。
## 主题配置 Panel

主题可以像插件一样提供后台配置面板。前端 registry 中的主题对象可以包含 `ConfigPanel`：

```ts
const themes: Record<string, BlogTheme> = {
  default: {
    name: "default",
    ConfigPanel: DefaultThemeConfigPanel,
    Layout: DefaultThemeLayout,
    views,
  },
};
```

后台主题页会合并后端主题列表和前端 `registeredThemes()`，所以只要主题在前端注册，就会出现在后台主题页面，并显示“配置”入口。

配置页行为：

- 优先渲染主题自己的 `ConfigPanel`。
- 如果主题没有前端 Panel，则回退到后端主题 schema 自动表单。
- “启用 / 停用 / 删除配置”由后台统一处理。
- 未配置主题也可以直接启用，后台会写入空配置，避免第一次使用被阻断。

## 后台管理 UI 约定

后台管理属于骨架，不属于主题。它应保持稳定、清晰、适合长时间操作：

- 使用 `src/admin/styles.css` 统一定义导航、顶栏、卡片、表格、表单、按钮、Toast 和 ConfirmBox。
- 页面内容最大宽度应适配宽屏，避免在 2K/4K 屏幕上只有窄窄一列。
- 表格应优先保证可扫描性：清晰表头、行 hover、稳定操作列。
- 插件卡片和主题卡片描述过长时必须省略，按钮位置应固定在卡片底部。
- 无权限接口对应的页面和入口不应展示，但后端仍必须做权限校验。

后台样式不是主题的一部分。主题作者不应修改后台 CSS；插件配置面板可以使用后台已有类名，例如 `plugin-config-panel`、`config-grid`、`editable-row`、`field`、`form-actions`。
## API Base 与部署环境

前端所有后台、博客和插件公共请求都应通过统一 API base resolver。不要在页面、主题或插件里手写 `http://127.0.0.1:3000`。

解析优先级：

1. `window.__TIPHIA_API_BASE__`：运行时覆盖，适合同一份 `dist/` 多环境部署。
2. `import.meta.env.VITE_TIPHIA_API_BASE`：构建时注入，适合 CI/CD 和 `.env.production`。
3. 空字符串：同源请求，例如 `/api/v1/posts`。

推荐写法：

```ts
import { requestPublic } from "../../framework/public-api";

export function listLinks() {
  return requestPublic("/api/v1/links");
}
```

不要写：

```ts
fetch("http://127.0.0.1:3000/api/v1/links");
```

开发环境可以在 `.env.local` 中写本地 API：

```bash
VITE_TIPHIA_API_BASE=http://127.0.0.1:3000
```

生产环境推荐 `.env.production` 留空，并由 Nginx 反代 `/api/`：

```bash
VITE_TIPHIA_API_BASE=
```

如果前端插件需要调用自己的后端插件路由，也必须复用统一请求方法。这样插件在同源反代、独立 API 域名、运行时覆盖三种部署方式下都能工作。

## 静态部署检查清单

发布前端时检查：

- `.env.production` 或 CI/CD 变量中没有开发地址。
- `VITE_TIPHIA_FRONTEND_BASE` 与部署路径一致，根路径使用 `/`。
- Nginx 已配置 SPA fallback，否则 `/admin` 刷新会 404。
- 如果 API 同源，Nginx 已配置 `/api/` proxy。
- 如果 API 跨域，后端 CORS 已允许前端来源。
- 部署后清理 CDN 的 `index.html` 缓存。
- 浏览器控制台请求地址应是 `/api/v1/...` 或真实 API 域名，不应是 `127.0.0.1`。

## 主题与插件资产规则

前端不再依赖全局 `public/` 目录分散主题和插件资产。规则如下：

- 主题 favicon、CSS、图片、局部组件放在 `src/themes/<theme>/`。
- 插件配置面板、运行时代码、CSS、图片放在 `src/plugins/<plugin>/`。
- 主题或插件需要暴露静态 URL 时，应通过 bundler import，例如 `import logoUrl from "./logo.png"`。
- 不要让主题去读取 `/themes/<name>/favicon.ico` 这种外部约定；主题 registry 应显式导入并提供 `faviconUrl`。

这样主题仓库被复制或作为 Git submodule 放入前端仓库时，文件不会散落到其它目录，后续升级也更容易。
## 启动加载与主题边界

博客前端遵循“骨架取数据，主题负责渲染”的边界：

- `src/blog/components/Layout.tsx` 负责请求站点设置、分类标签和已启用插件列表。
- `src/themes/index.ts` 负责自动发现 `src/themes/*/index.tsx` 中导出的主题。
- 主题的 `Layout` 负责页面外壳、导航、页脚、Hook 插槽和视觉呈现。
- 页面级数据，例如文章列表、文章详情、归档列表、评论，由 `src/blog/pages/*` 请求后交给当前主题的 `views` 渲染。

首屏加载时，设置和分类标签尚未返回。如果直接渲染主题外壳，会出现标题、导航、页脚或标签云短暂空白的问题。因此主题可以提供一个可选的启动加载视图：

```ts
export interface BlogTheme {
  name: string;
  faviconUrl?: string;
  ConfigPanel?: ThemeConfigPanel;
  BootstrapLoading?: ComponentType;
  Layout: BlogThemeLayout;
  views: BlogThemeViews;
}
```

当前行为：

- 当 `settings` 或 `terms` 首次加载中且没有缓存数据时，博客骨架会渲染 `theme.BootstrapLoading`。
- 如果当前主题没有提供 `BootstrapLoading`，会回退到默认主题的加载视图。
- 一旦基础数据返回，骨架切换到主题 `Layout`，并把数据作为 props 传入。
- 页面内部的加载状态仍然由主题 `views.State` 和各个视图组件负责，例如文章列表、归档、时间线和评论区。

主题作者应把 `BootstrapLoading` 设计成轻量、无数据依赖、无副作用的组件。它不应该请求 API，也不应该读取业务状态。推荐使用骨架屏、轻量 shimmer、spinner 或品牌化 loading 动画。

### 加载 UI 设计建议

- 首屏加载视图应尽量模拟最终布局，例如站点头部、搜索框、文章卡片和侧栏占位。
- 避免只显示纯文字“加载中”，这样在慢网络下会显得页面未完成。
- 避免在加载视图中执行插件 Hook，因为插件列表也可能尚未加载完成。
- 保持 `prefers-reduced-motion` 兼容，用户关闭动画时应停止 shimmer 或旋转动画。
- 加载视图不要依赖 `settings.data`，否则会重新引入空数据问题。

### 页面级加载状态

页面级加载由主题视图处理。默认主题的 `State` 组件会展示轻量 spinner 和骨架线，用于：

- 首页文章列表加载。
- 文章或页面详情加载。
- 分类、标签目录加载。
- 归档列表加载。
- 时间线加载。
- 注册状态读取。

插件如果要在自己的前端面板或公开组件中展示加载状态，也建议复用自己的局部 loading，而不是依赖博客全局启动加载视图。
