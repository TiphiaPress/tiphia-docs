# 主题开发文档

TiphiaPress 主题是前端模块，不属于后端核心。主题可以独立仓库维护，再通过复制或 Git submodule 放入前端仓库。

## 主题目录

默认主题目录约定：

```text
tiphia-frontend/src/themes/default/
  index.tsx
  theme.css
  externalLinks.ts
  ExternalWarningPage.tsx
  README.md
```

如果主题有静态资源，例如 favicon，应放在前端 public 目录中：

```text
public/themes/default/favicon.ico
```

前端会自动读取：

```text
/themes/{themeName}/favicon.ico
```

不需要在主题 JSON 里配置 favicon。

## 主题组件

主题导出 Layout 组件，前端骨架负责把站点信息、导航页面、分类标签和主题配置传给主题。

主题应关注：

- 页面结构。
- 导航渲染。
- 首页布局。
- 文章详情布局。
- 评论区插槽。
- 页脚布局。
- Hook 插槽摆放。

主题不应该直接耦合后台管理逻辑。

## 主题配置

主题配置保存在后端 settings 中，是自由 JSON。默认主题支持示例：

```json
{
  "accent": "#2563eb",
  "font_family": "Inter, system-ui, sans-serif",
  "posts_per_page": 10,
  "show_popular_posts": true,
  "popular_posts_limit": 5,
  "show_recent_comments": true,
  "recent_comments_limit": 5,
  "custom_css": ".hero { text-align: center; }",
  "footer_items": [
    { "label": "GitHub", "href": "https://github.com/TiphiaPress/tiphia", "icon": "github" },
    { "label": "RSS", "href": "/feed.xml", "icon": "rss" }
  ],
  "nav_pages": [
    { "label": "关于", "slug": "about", "display": "article" },
    { "label": "友链", "slug": "links", "display": "article" }
  ]
}
```

`footer_items` 可控制页脚信息和图标。目前默认主题支持 `github`、`home`、`mail`、`rss`，未知值会回退到链接图标。

## Hook 插槽

主题作者决定哪些 Hook 会出现在页面中。默认主题建议保留：

- `blog.body.start`
- `blog.body.end`
- `blog.header.before`
- `blog.header.after`
- `blog.nav.after`
- `blog.main.before`
- `blog.main.after`
- `blog.footer.before`
- `blog.footer.filing`
- `blog.footer.after`
- `blog.post.content.before`
- `blog.post.content.after`
- `blog.comment.captcha`
- `blog.comment.form.before`
- `blog.comment.form.after`

如果主题不渲染某个 Hook，对应插件内容就不会出现。因此主题 README 应明确列出支持的 Hook。

## 外站跳转提示

默认主题对外站链接做风险提示，备案插件链接除外。主题可以复用 `externalLinks.ts` 中的判断逻辑，也可以实现自己的跳转提示页。

## 独立仓库维护

推荐做法：

1. 在 `tiphia-default-themes` 中维护主题代码。
2. 开发时复制到 `tiphia-frontend/src/themes/default` 或使用 Git submodule 链接。
3. 主题仓库自己维护 README、截图和配置示例。
4. 前端仓库只负责装配主题，不把主题规则写死在后端。

## 主题配置 Panel

新版前端支持主题像插件一样提供自己的后台配置面板。这样用户不需要编辑 JSON，也不需要修改前端代码。后台主题页会优先读取主题对象上的 `ConfigPanel`。

主题类型定义位于前端仓库：

```ts
export interface ThemeConfigPanelProps {
  theme: BlogTheme;
  value: Record<string, unknown>;
  saving: boolean;
  error?: unknown;
  onSubmit: (value: Record<string, unknown>) => Promise<void> | void;
}

export type ThemeConfigPanel = ComponentType<ThemeConfigPanelProps>;

export interface BlogTheme {
  name: string;
  faviconUrl?: string;
  ConfigPanel?: ThemeConfigPanel;
  Layout: BlogThemeLayout;
  views: BlogThemeViews;
}
```

最小示例：

```tsx
import { useEffect, useState } from "react";
import type { ThemeConfigPanelProps } from "../types";

export function MyThemeConfigPanel({ value, saving, error, onSubmit }: ThemeConfigPanelProps) {
  const [accent, setAccent] = useState("#2563eb");

  useEffect(() => {
    setAccent(typeof value.accent === "string" ? value.accent : "#2563eb");
  }, [value]);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ accent });
    }}>
      <label>
        强调色
        <input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} />
      </label>
      {error instanceof Error ? <p>{error.message}</p> : null}
      <button disabled={saving}>{saving ? "保存中..." : "保存配置"}</button>
    </form>
  );
}
```

注册主题时挂载：

```ts
const themes: Record<string, BlogTheme> = {
  default: {
    name: "default",
    faviconUrl,
    ConfigPanel: DefaultThemeConfigPanel,
    Layout: DefaultThemeLayout,
    views,
  },
};
```

后台保存时会把 `onSubmit` 传入的对象写入 `site:settings.theme.configs[themeName]`。如果当前主题已启用，同时会同步到 `site:settings.theme.config`。

### 配置 Panel 设计建议

- Panel 只负责 UI、输入规范化和简单校验，不直接调用后端 API 保存配置。
- 配置字段要尽量表单化，避免要求用户手写 JSON。
- 删除、启用、停用主题配置由后台主题页统一提供，主题 Panel 不应重复实现。
- 对复杂数组配置，例如导航页面、页脚链接、置顶文章，建议提供“添加/删除”行式表单。
- 所有字段都应能从空配置安全初始化。

## 默认主题视图拆分

默认主题目前按视图拆分：

```text
src/themes/default/
  index.tsx
  ThemeConfigPanel.tsx
  theme.css
  views/
    ArticleViews.tsx
    CommentViews.tsx
    HomeView.tsx
    RegisterView.tsx
    TermViews.tsx
    TimelineView.tsx
  components/
```

主题作者可以参考这种结构：

- `index.tsx`：布局和主题入口。
- `views/`：页面级视图，接收骨架 props。
- `components/`：主题内复用组件。
- `ThemeConfigPanel.tsx`：后台主题配置 UI。
- `theme.css`：主题全部样式，包括 Markdown 内容样式。

## Markdown 内容处理

主题负责正文内容的视觉呈现。默认主题已经处理：

- 图片最大宽度和居中。
- Markdown 图片 `![说明](url)` 的 `alt` 会渲染为图片下方居中说明。
- 表格边框、间距和横向滚动。
- 多级标题尺寸。
- 外站链接跳转提示。

如果主题自行渲染 `dangerouslySetInnerHTML`，应确保图片、表格、代码块、长链接不会破坏布局。
