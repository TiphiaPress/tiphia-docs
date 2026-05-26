# 评审、发布与回滚

这页用于发布前检查和出问题后的回滚处理。项目仍在快速迭代，流程保持轻量，但关键路径必须可验证。

## 代码评审重点

后端：

- API 是否保持向后兼容。
- 权限检查是否完整，普通管理员不能越权操作 root 或同级管理员。
- 插件是否通过 Hook 扩展，而不是在核心业务里写死插件名。
- Options key 是否有文档，默认值是否安全。
- 数据库迁移是否可重复执行。
- 邮件、Webhook、第三方接口失败时是否有日志。

前端：

- 博客骨架是否只负责数据和路由，渲染交给主题。
- 插件是否通过前端 Hook 插入内容。
- 新主题和插件是否可以自动注册。
- 后台管理是否按权限隐藏不可访问内容。
- 小屏幕下是否有溢出、遮挡或按钮不可点击问题。
- i18n 是否覆盖新增后台文案。

主题：

- 图片、表格、代码块、长链接在文章中是否正常展示。
- 页面和文章路径是否区分 `/pages/{slug}` 与 `/posts/{slug}`。
- 外链跳转提示是否能正常进入目标页面。
- 页脚备案、RSS、Powered by、推广信息是否不突兀。

插件：

- 默认禁用。
- 配置为空或不完整时不应半生效。
- 前端配置面板样式不应破坏后台布局。
- 后端路由需要权限时必须校验 token。
- 失败要有可定位的日志。

## 发布前 Checklist

后端：

```bash
cargo fmt --check
cargo check --workspace
cargo test --workspace
```

前端：

```bash
yarn build
```

文档：

```bash
node --check site.js
```

Docker：

```bash
docker build -t tiphia:latest .
docker run --rm -e TIPHIA_CONFIG=/app/tiphia.toml ... tiphia:latest
```

手工 smoke test：

- 登录后台。
- 创建文章和页面。
- 评论提交、审核、回复。
- RSS/Atom/Sitemap 打开无乱码。
- 前台文章、页面、友情链接、自定义页面能打开。
- 前端静态部署刷新 `/admin`、`/posts/*`、`/pages/*` 不 404。

## 回滚策略

后端：

- 优先回滚镜像版本。
- 如果涉及数据库迁移，先确认迁移是否可逆。
- 如果迁移不可逆，优先通过兼容代码修复，而不是直接删字段。

前端：

- 静态资源可直接回滚上一版 `dist`。
- 如果是 API Base 配置错误，优先检查 `.env.production` 或构建参数。
- 如果是 Nginx 路由 404，检查 `try_files $uri $uri/ /index.html;`。

文档：

- 文档站是静态页面，回滚 GitHub Pages 对应提交即可。
- 修改 `site.js` 后建议提升 `index.html` 中的资源版本号，减少旧缓存影响。
