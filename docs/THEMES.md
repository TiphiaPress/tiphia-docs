# 主题开发与默认主题配置

TiphiaPress 的主题是独立的前台渲染层。后端核心不保存主题文件，前端骨架负责读取 API 和主题配置，主题负责把这些数据渲染成最终页面。

## 主题目录

```text
src/themes/default/
  index.tsx          主题入口，导出主题定义和视图组件
  theme.css          主题样式
  README.md          主题作者文档
  favicon.ico        浏览器标签图标，主题可自行提供
  assets/            可选，主题私有图片、字体或其它资源
```

主题资产应放在主题目录内。不要要求用户把主题资源复制到全局 `public` 目录。

## 主题与骨架的职责

前端骨架负责：

- 获取文章、页面、评论、分类标签、站点设置、插件状态和主题配置。
- 维护公开博客路由、分页、SEO、评论提交、注册开关、外站跳转提示等非视觉逻辑。
- 解析当前启用的主题配置，并把数据、配置、状态和动作交给主题。

主题负责：

- 渲染首页、文章详情、页面详情、归档、分类标签、时间线、评论区、页脚和错误状态。
- 控制图片、表格、代码块、标题层级、标签云、卡片、按钮等内容样式。
- 在允许插件插入内容的位置调用 `FrontendHookSlot`。

主题不应该直接处理后台登录态，也不应该实现后台管理页面。主题可以读取骨架传入的数据；只有主题自有的可选能力才建议自行请求额外接口。

## HookSlot 放置建议

默认主题应尽量提供完整 HookSlot，方便插件复用：

- `blog.body.start` / `blog.body.end`
- `blog.header.before` / `blog.header.after`
- `blog.nav.after`
- `blog.main.before` / `blog.main.after`
- `blog.footer.before` / `blog.footer.filing` / `blog.footer.after`
- `blog.home.before` / `blog.home.hero.after` / `blog.home.after`
- `blog.post.list.before` / `blog.post.list.after`
- `blog.post.card.before` / `blog.post.card.after`
- `blog.post.content.before` / `blog.post.content.after`
- `blog.post.meta.after`
- `blog.comment.captcha`
- `blog.comment.form.before` / `blog.comment.form.after`
- `blog.comment.list.before` / `blog.comment.list.after`
- `blog.custom-page.after`
- `blog.custom-page.{slug}`，例如 `blog.custom-page.links`

主题可以选择不放某些 HookSlot，但如果不放，对应插件就无法在该位置渲染。

## 主题配置存储格式

主题配置保存在站点设置中：

```json
{
  "theme": {
    "active": "default",
    "configs": {
      "default": {
        "accent": "#2563eb",
        "posts_per_page": 10
      }
    },
    "config": {
      "accent": "#2563eb",
      "posts_per_page": 10
    }
  }
}
```

字段说明：

- `theme.active`：当前启用的主题配置名。为空字符串表示未启用任何主题配置。
- `theme.configs`：所有保存过的主题配置，key 通常与主题目录名一致，也可以是用户自定义配置名。
- `theme.config`：当前 active 的解析结果，兼容旧前端读取方式。

新增主题配置不会自动启用。管理员必须在后台主题页面点击启用。

## 默认主题配置示例

默认主题支持以下 JSON 配置：

```json
{
  "accent": "#2563eb",
  "font_family": "Inter, system-ui, sans-serif",
  "posts_per_page": 10,
  "pinned_post_ids": [1, 2],
  "pinned_post_slugs": ["hello-world"],
  "show_popular_posts": true,
  "popular_posts_limit": 5,
  "show_recent_comments": true,
  "recent_comments_limit": 5,
  "footer_tag_limit": 18,
  "show_upyun": false,
  "liquid_glass": false,
  "footer_items": [
    { "label": "GitHub", "href": "https://github.com/TiphiaPress/tiphia", "icon": "github" },
    { "label": "RSS", "href": "/feed.xml", "icon": "rss" }
  ],
  "nav_pages": [
    { "label": "关于", "slug": "about", "display": "article" },
    { "label": "友情链接", "slug": "links", "display": "article" }
  ],
  "custom_css": ".site-title { letter-spacing: 0; }"
}
```

字段说明：

- `accent`：强调色。默认主题会用于链接、按钮、焦点态、分页和部分边框。
- `font_family`：全站字体栈。
- `posts_per_page`：文章列表分页大小。
- `pinned_post_ids`：置顶文章 ID 列表。默认主题会把置顶文章提升到首页第一分页展示。
- `pinned_post_slugs`：置顶文章 slug 列表，适合跨环境迁移后 ID 不稳定的场景。
- `show_popular_posts`：是否显示热门文章组件。热门依据文章阅读次数统计。
- `popular_posts_limit`：热门文章数量。
- `show_recent_comments`：是否显示最新评论组件。
- `recent_comments_limit`：最新评论数量。
- `footer_tag_limit`：页脚标签云数量上限。默认主题优先展示文章数多和较新的标签，避免标签过多撑满页脚。
- `show_upyun`：为 `true` 时在页脚显示又拍云推广信息；未设置或 `false` 时隐藏。
- `liquid_glass`：为 `true` 时启用默认主题的 Liquid Glass 视觉样式。这个样式通过 `backdrop-filter`、边缘高光、半透明材质和背景色斑模拟类 Apple 的玻璃界面；浏览器不支持透明模糊时会自动降级。
- `footer_items`：页脚链接。`icon` 支持 `github`、`rss`、`home`、`mail`、`link` 等默认图标。
- `nav_pages`：右上角导航中的自定义页面。点击后由骨架请求后端页面内容，再交给主题渲染。
- `custom_css`：追加 CSS。适合轻量微调，不建议写大量布局逻辑。

## 自定义页面与友情链接

默认主题自动支持 `tiphia-links` 插件。约定：

1. 后端启用并配置 `tiphia-links`。
2. 创建 slug 为 `links` 的页面。
3. 在 `nav_pages` 中添加 `{ "label": "友情链接", "slug": "links", "display": "article" }`。
4. 访问 `/custom-pages/links` 时，页面正文会显示在上方，友情链接会按分类分组显示为卡片。

友情链接是否显示不由主题配置开关控制，而是由插件 API 是否可用和页面 slug 是否匹配共同决定。

## Favicon

主题可以在自己的目录提供 `favicon.ico`。骨架会默认读取当前主题目录下的 favicon，主题不需要把 favicon 写入 JSON 配置。
## 后台主题配置面板

默认主题提供自己的 `ThemeConfigPanel.tsx`。后台主题页面会直接渲染这个面板，因此管理员可以通过表单配置默认主题，而不需要编辑 JSON。

当前面板包含：

- 视觉：强调色、字体、Liquid Glass、追加 CSS。
- 首页与列表：每页文章数、热门文章、最新评论、页脚标签数量、又拍云页脚。
- 置顶文章：通过文章 ID 或 slug 指定。
- 右上角页面导航：配置自定义页面入口。
- 页脚链接：配置 GitHub、RSS、邮箱等页脚信息。

保存后，配置会写入站点设置中的：

```json
{
  "theme": {
    "configs": {
      "default": {}
    }
  }
}
```

启用主题时，后台会把当前主题配置同步为 `theme.config`，公开博客读取它并应用样式变量。

## Liquid Glass 样式

`liquid_glass` 是默认主题提供的可选视觉模式。启用后：

- `useTheme` 会给 `document.documentElement` 添加 `theme-liquid-glass` class。
- 默认主题 CSS 只在 `:root[data-theme="default"].theme-liquid-glass` 下生效。
- Header、Hero、文章卡片、搜索框、评论、正文容器等会变成半透明玻璃材质。
- 样式会尊重 `prefers-reduced-transparency`，在用户降低透明度偏好或浏览器不支持时降级。

主题作者可以复用这个思路，但不建议把大量视觉模式写入骨架。视觉开关应属于主题配置。
