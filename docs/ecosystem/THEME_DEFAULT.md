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
