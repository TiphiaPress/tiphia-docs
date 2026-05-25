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
