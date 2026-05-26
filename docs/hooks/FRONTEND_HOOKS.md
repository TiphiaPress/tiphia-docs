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
## 三方职责

前端 Hook 涉及三方：

- 前端骨架：提供 `registerFrontendPlugin`、`FrontendHookSlot`、插件启用过滤、i18n 注册和 head effect 生命周期管理。
- 主题：决定把 `FrontendHookSlot` 放在哪里，并把当前页面上下文传给 slot。
- 插件：注册 hook 渲染函数、head 副作用、后台配置面板和语言包。

主题不应该知道某个具体插件如何实现；插件也不应该直接改主题源码。二者通过 hook name 和 context 协作。

## Context 约定

Hook 的 `context` 是普通对象。主题放置 slot 时应尽量传入足够的上下文，例如：

```tsx
<FrontendHookSlot
  hook="blog.post.content.after"
  context={{ post, settings, themeConfig }}
/>
```

插件读取 context 时要保持防御式写法：

```tsx
render: (context) => {
  const post = context.post as Post | undefined;
  if (!post) return null;
  return <RelatedPosts postId={post.id} />;
}
```

不要假设所有主题都会传同样的字段。需要强依赖某个字段时，应在插件 README 中说明。

## 插件启用状态与名称映射

前端插件可以声明多个后端名称别名：

```tsx
registerFrontendPlugin({
  name: "tiphia-links",
  backendNames: ["tiphia-plugin-links"],
  hooks: []
});
```

骨架会读取后端 `/api/v1/plugins` 的启用状态，只让已启用的插件参与 hook 渲染。纯前端插件也可以不声明后端别名，但如果它需要后台配置或后端 API，推荐始终提供后端插件。

## 后台配置面板

插件配置面板由前端插件注册：

```tsx
registerFrontendPlugin({
  name: "tiphia-geetest",
  backendNames: ["tiphia-plugin-geetest"],
  adminConfigPanel: GeetestConfigPanel
});
```

配置面板应只负责 UI 和校验。保存动作由后台插件配置页提供的 `value`、`onChange`、`onSave` 等能力完成。配置结构必须与后端插件 schema 和 README 保持一致。

## i18n Hook

插件可以注册语言包：

```tsx
registerFrontendPlugin({
  name: "my-language-pack",
  i18n: {
    locales: [{ code: "ja-JP", label: "日本語" }],
    resources: {
      "ja-JP": {
        "nav.dashboard": "ダッシュボード",
        "my_plugin.title": "タイトル"
      }
    }
  }
});
```

规则：

- 插件可以新增语言，也可以覆盖核心 key。
- 插件自己的文案建议使用插件名前缀，例如 `tiphia_links.title`。
- 覆盖核心 key 时要谨慎，避免影响其它插件和主题。

## Head effect 生命周期

`head` 适合插入 SDK、统计脚本、验证码脚本、预连接和 meta 信息。每个 effect 必须提供稳定 `id`，并尽量返回清理函数：

```tsx
head: [
  {
    id: "geetest-sdk",
    run: () => {
      const script = document.createElement("script");
      script.src = "https://static.geetest.com/v4/gt4.js";
      document.head.appendChild(script);
      return () => script.remove();
    }
  }
]
```

如果脚本由多个页面共用，插件应避免重复插入，并处理网络失败、SDK 不存在、配置为空等情况。