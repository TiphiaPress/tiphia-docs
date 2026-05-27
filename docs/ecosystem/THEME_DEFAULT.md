# 默认主题配置

默认主题位于 `tiphia-frontend/src/themes/default`。它是主题开发参考实现，也可以直接用于生产站点。

## 配置方式

默认主题提供自己的配置 Panel。站长在后台主题页进入配置，不需要手写 JSON。

配置最终存储在 `options` 表：

```text
theme:default:config
```

## 常用配置

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `accent` | string | 强调色。按钮、链接、标签等会使用该颜色。 |
| `font_family` | string | 字体栈。 |
| `posts_per_page` | number | 首页每页文章数量。 |
| `show_popular_posts` | boolean | 显示热门文章。 |
| `popular_posts_limit` | number | 热门文章数量。 |
| `show_recent_comments` | boolean | 显示最新评论。 |
| `recent_comments_limit` | number | 最新评论数量。 |
| `tag_cloud_limit` | number | 页脚标签云最大数量。 |
| `pinned_post_ids` | number[] | 置顶文章 ID。 |
| `pinned_post_slugs` | string[] | 置顶文章 slug。 |
| `nav_pages` | array | 顶部自定义页面导航。 |
| `show_upyun` | boolean | 页脚展示又拍云推广信息。 |
| `liquid_glass` | boolean | 启用液态玻璃样式。 |
| `footer_icons` | object | 控制页脚 GitHub、RSS 等图标。 |
| `custom_css` | string | 额外 CSS。 |

## 自定义页面

`nav_pages` 示例：

```json
[
  { "label": "友链", "slug": "links", "display": "article" },
  { "label": "关于", "slug": "about", "display": "plain" }
]
```

`slug = links` 的页面会自动尝试展示友情链接插件提供的卡片区域。页面正文在上方，友情链接卡片组在下方。

## 评论展示

默认主题支持：

- 评论树。
- 超过三层后平铺。
- Gravatar/Cravatar 头像。
- 登录用户自动填写评论身份。
- 评论验证码 Hook。

## 外链提示

除备案插件允许的链接外，默认主题会对外站链接展示跳转风险提示页。

## 图片与表格

默认主题会限制文章图片宽度，居中展示，并将 Markdown 图片 alt 文本作为下方说明。表格带边框并支持横向滚动。
## 页脚内置标识

默认主题会在页脚展示一个低调的 `Powered by TiphiaPress` 标识，链接到：

```text
https://github.com/TiphiaPress/tiphia
```

这个标识不属于 `footer_items` 配置项，用户清空自定义页脚链接时它仍会保留。设计上它会跟随主题色和液态玻璃模式，不应比备案、标签云、又拍云联盟信息更突兀。

## 加载动画

默认主题内置两类加载动画，不需要额外配置：

- 首屏启动骨架屏：由 `BootstrapLoading` 提供，在站点设置、分类标签等基础数据首次返回前展示。
- 页面级加载状态：由 `State` 和小组件内部 loading 提供，用于文章列表、文章详情、归档、时间线、热门文章和最新评论等局部加载场景。

默认主题的启动骨架屏会模拟最终页面结构：

- 顶部站点标题和导航占位。
- Hero 区域占位。
- 搜索框占位。
- 文章卡片占位。
- 侧栏小组件占位。

这样即使 API 较慢，用户也能看到稳定的页面结构，而不是短暂空白或布局跳变。

主题配置中没有独立的 loading 开关。加载动画属于默认主题基础体验，如果用户希望完全替换加载效果，应通过自定义主题实现自己的 `BootstrapLoading` 和 `State` 组件。

动画兼容 `prefers-reduced-motion`，当用户系统设置减少动态效果时，shimmer 和旋转动画会停止。

## Cookie 提示

默认主题支持首次访问 Cookie 提示。该功能默认关闭，只有主题配置中 `cookie_notice` 为 `true` 时才显示。

示例：

```json
{
  "cookie_notice": true,
  "cookie_notice_text": "本站会使用 Cookie 或本地存储来保存登录状态、评论表单和偏好设置。",
  "cookie_notice_accept_text": "知道了",
  "cookie_notice_policy_url": "/pages/privacy"
}
```

字段说明：

- `cookie_notice`：是否启用 Cookie 提示，必须为 `true` 才显示。
- `cookie_notice_text`：提示正文。为空时使用默认文案。
- `cookie_notice_accept_text`：确认按钮文字。为空时使用 `知道了`。
- `cookie_notice_policy_url`：可选的隐私说明或 Cookie 政策链接。为空时不显示“了解更多”。

用户点击确认后，默认主题会在浏览器 `localStorage` 中写入 `tiphia.default.cookie_notice.accepted=1`，之后不再重复弹出。该状态仅保存在当前浏览器中，不会写入后端数据库。

如果你开发自定义主题，可以自行实现 Cookie 提示，也可以完全不提供。Cookie 提示属于主题 UI，不属于后端核心能力。

## 站点公告

默认主题支持首页公告横幅。该功能默认关闭，只有 `announcement_enabled` 为 `true`，且标题或内容至少填写一项时才会展示。

示例：

```json
{
  "announcement_enabled": true,
  "announcement_title": "站点公告",
  "announcement_content": "这里是一条简短公告，可以用于维护通知、活动提示或重要链接。",
  "announcement_url": "/posts/hello-world",
  "announcement_link_text": "查看详情"
}
```

字段说明：

- `announcement_enabled`：是否启用首页公告。
- `announcement_title`：公告标题，可为空。
- `announcement_content`：公告正文，可为空。
- `announcement_url`：可选链接，支持站内路径或外部 URL。
- `announcement_link_text`：链接文字。为空时默认显示 `查看详情`。

公告显示在首页 Hero 区域之后、搜索框之前。它是默认主题的 UI 能力，不依赖后端专用接口。
