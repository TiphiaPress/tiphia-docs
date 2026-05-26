# API：评论

评论支持树状展示、审核、后台回复和插件扩展。

## 创建评论

```text
POST /api/v1/comments
```

请求：

```json
{
  "post_id": 1,
  "parent_id": null,
  "author_name": "Alice",
  "author_email": "alice@example.com",
  "author_url": "https://example.com",
  "content": "评论内容",
  "extensions": {}
}
```

登录用户在默认主题中无需填写昵称和邮箱，前端会自动使用当前登录用户信息提交。

## 评论树

```text
GET /api/v1/comments/post/{post_id}/tree
```

默认主题超过三层后会把后续回复平铺到第三层，避免嵌套过深。

## 最近评论

```text
GET /api/v1/comments/recent?limit=5
```

用于主题侧边栏或首页组件。

## 审核评论

```text
PUT /api/v1/comments/{id}/moderation
Authorization: Bearer <token>
```

请求：

```json
{ "status": "approved" }
```

## 后台回复评论

```text
POST /api/v1/comments/{id}/reply
Authorization: Bearer <token>
```

请求：

```json
{ "content": "管理员回复内容" }
```

回复会作为子评论写入，并可触发评论邮件推送插件的回复通知。

## Hook 扩展

评论创建前后会触发后端 Hook。验证码、审计、邮件推送、反垃圾等插件都应通过 Hook 扩展，而不是修改评论业务代码。