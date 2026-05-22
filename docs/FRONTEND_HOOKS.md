# 前端 Hook 文档

前端 Hook 是 TiphiaPress 前端插件系统的核心。它允许插件在后台管理、博客前台、评论表单、页脚、头部等位置插入 React 组件或执行 head 副作用。

## 基本模型

前端插件通过 `registerFrontendPlugin` 注册：

```tsx
registerFrontendPlugin({
  name: "my-plugin",
  hooks: [
    {
      hook: "blog.footer.before",
      order: 50,
      render: (context) => <div>{String(context.title)}</div>,
    },
  ],
});
```

字段说明：

- `name`：插件名，需要与后端插件名保持一致时才能根据启用状态参与渲染。
- `hooks`：组件插入点。
- `head`：向 `document.head` 注入脚本、link、meta 等副作用。
- `adminConfigPanel`：后台插件配置页组件。
- `i18n`：插件语言包资源。

## Hook 顺序

每个 Hook 可以设置 `order`。数值越小越早渲染。没有设置时默认在中间位置。多个插件注册同一个 Hook 时，前端骨架会按 `order` 排序。

## 后台管理 Hook

后台相关 Hook 包括：

- `admin.auth.captcha`：登录、注册、初始化等认证表单验证码区域。
- `admin.auth.form.before`：认证表单前。
- `admin.auth.form.after`：认证表单后。
- `admin.dashboard.before`：总览页内容前。
- `admin.dashboard.after`：总览页内容后。
- `admin.sidebar.nav.after`：后台侧栏菜单后。
- `admin.topbar.after`：顶部栏用户信息前。
- `admin.content.toolbar.after`：内容管理工具栏后。
- `admin.plugin.card.after`：插件卡片内容扩展。

适合场景：验证码、快捷入口、后台统计面板、插件状态提示、管理员工具按钮。

## 博客前台 Hook

博客相关 Hook 包括：

- `blog.body.start` 和 `blog.body.end`：页面最外层开始/结束。
- `blog.header.before` 和 `blog.header.after`：头部前后。
- `blog.nav.after`：导航后。
- `blog.sidebar`：侧栏区域。
- `blog.main.before` 和 `blog.main.after`：主内容区前后。
- `blog.footer.before`、`blog.footer.filing`、`blog.footer.after`：页脚扩展。
- `blog.home.before`、`blog.home.hero.after`、`blog.home.after`：首页扩展。
- `blog.post.list.before` 和 `blog.post.list.after`：文章列表前后。
- `blog.post.card.before` 和 `blog.post.card.after`：文章卡片前后。
- `blog.post.content.before` 和 `blog.post.content.after`：文章正文前后。
- `blog.post.meta.after`：文章元信息后。
- `blog.archive.before` 和 `blog.archive.after`：归档页前后。
- `blog.search.before` 和 `blog.search.after`：搜索页前后。
- `blog.custom-page.after`：自定义页面后。
- `blog.custom-page.{slug}`：指定 slug 的自定义页面。例如 `blog.custom-page.links`。
- `blog.comment.captcha`：评论验证码区域。
- `blog.comment.list.before` 和 `blog.comment.list.after`：评论列表前后。
- `blog.comment.form.before` 和 `blog.comment.form.after`：评论表单前后。

主题作者决定是否渲染这些 Hook。前端骨架提供接口，主题负责放置插槽，插件负责注册内容。

## Head 副作用

插件可以注册 head effect：

```tsx
registerFrontendPlugin({
  name: "sdk-plugin",
  head: [
    {
      id: "sdk-script",
      run: () => {
        const script = document.createElement("script");
        script.src = "https://example.com/sdk.js";
        document.head.appendChild(script);
        return () => script.remove();
      },
    },
  ],
});
```

这适合 SDK、统计脚本、验证码脚本、预连接等场景。建议总是返回清理函数，避免路由切换后重复注入。

## i18n 扩展

插件可以提供语言包：

```tsx
registerFrontendPlugin({
  name: "language-ja",
  i18n: {
    locales: [{ code: "ja-JP", label: "日本語" }],
    resources: {
      "ja-JP": {
        "nav.dashboard": "ダッシュボード"
      }
    }
  }
});
```

插件语言资源可以覆盖核心文案，也可以只提供插件自己的 key。
