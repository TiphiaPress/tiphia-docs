# API 文档

本文是 TiphiaPress 后端 REST API 的人工维护参考文档。运行时仍建议同时查看 `/openapi.json`，它由后端代码中的 utoipa 注解生成，适合导入 Swagger、Postman 或生成客户端。

## 约定

基础地址示例：

```text
http://127.0.0.1:3000
```

API 前缀：

```text
/api/v1
```

受保护接口需要请求头：

```http
Authorization: Bearer <access_token>
```

分页参数通用格式：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | `1` | 页码，从 1 开始。 |
| `per_page` | integer | 后端默认配置 | 每页数量，后端会限制最大值。 |

统一错误响应：

```json
{
  "error": {
    "code": "validation_error",
    "message": "validation error: title is required"
  }
}
```

常见错误码：

| code | HTTP | 说明 |
| --- | --- | --- |
| `validation_error` | 422 | 参数校验失败、唯一性冲突或业务规则不满足。 |
| `unauthorized` | 401 | 未提供 token 或 token 无效。 |
| `forbidden` | 403 | 已登录但权限不足。 |
| `not_found` | 404 | 资源不存在。 |
| `rate_limited` | 429 | 限流触发。 |
| `rate_limit_backend` | 503 | Redis 等限流后端异常。 |
| `plugin_error` | 500 | 插件配置、Hook 或路由处理失败。 |
| `internal_error` | 500 | 未预期错误。 |

## 系统接口

### GET /health

健康检查。公开接口。

响应示例：

```json
{
  "status": "ok"
}
```

### GET /openapi.json

返回 OpenAPI 文档。公开接口。

用途：Swagger UI、Postman、客户端 SDK 生成。

### GET /feed.xml

RSS Feed。公开接口。

### GET /atom.xml

Atom Feed。公开接口。

### GET /sitemap.xml

站点地图。公开接口。

### GET /robots.txt

搜索引擎 robots 文件。公开接口。

## 认证接口

### GET /api/v1/auth/status

读取认证状态。公开接口。

响应字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `initialized` | boolean | 是否已经创建过初始 root 用户。 |
| `registration_enabled` | boolean | 是否开放公开注册。 |

响应示例：

```json
{
  "initialized": true,
  "registration_enabled": false
}
```

### POST /api/v1/auth/bootstrap

创建第一个 root 管理员。仅当用户表为空时可用。公开接口，但只能成功一次。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 是 | 登录用户名。 |
| `email` | string | 是 | 邮箱。 |
| `password` | string | 是 | 密码。 |
| `display_name` | string/null | 否 | 显示名。 |
| `captcha` | object/null | 否 | 插件验证码载荷，例如 GeeTest。 |

请求示例：

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "change-me-please",
  "display_name": "Administrator"
}
```

响应：登录会话，包含 `access_token` 和 `user`。

### POST /api/v1/auth/register

公开注册。仅当站点设置 `registration_enabled = true` 时可用。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 是 | 用户名。 |
| `email` | string | 是 | 邮箱。 |
| `password` | string | 是 | 密码。 |
| `display_name` | string/null | 否 | 显示名。 |
| `captcha` | object/null | 否 | 插件验证码载荷。 |

注册用户默认角色为 `author`。

### POST /api/v1/auth/login

登录。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account` | string | 是 | 用户名或邮箱。 |
| `password` | string | 是 | 密码。 |
| `captcha` | object/null | 否 | 插件验证码载荷。 |

响应示例：

```json
{
  "access_token": "jwt-token",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "display_name": "Administrator",
    "role": "root",
    "status": "active"
  }
}
```

### GET /api/v1/auth/me

获取当前用户。需要登录。

响应：`PublicUser`。

## 文章接口

文章路径前缀：

```text
/api/v1/posts
```

文章状态：

| 值 | 说明 |
| --- | --- |
| `draft` | 草稿。 |
| `pending_review` | 待审核。 |
| `published` | 已发布。 |
| `scheduled` | 定时发布。 |
| `archived` | 归档。 |

### GET /api/v1/posts

公开文章列表。只返回公开可见内容。

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `q` | string | 搜索标题、Markdown 或摘要。 |
| `status` | string | 状态过滤。公开列表通常只应看到可公开状态。 |
| `post_type` | string | 通常由路由内部设置，文章为 `post`。 |
| `term_id` | integer | 按分类或标签过滤。 |
| `page` | integer | 页码。 |
| `per_page` | integer | 每页数量。 |

响应：分页 `Page<PostResponse>`。

`PostResponse` 包含文章模型字段，并额外包含：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `permalink` | string | 根据站点固定链接规则生成。 |
| `view_count` | integer | 浏览次数。 |
| `comment_count` | integer | 评论数。 |

### GET /api/v1/posts/admin

后台文章列表。需要登录。作者只能看到自己的内容；编辑、管理员和 root 可以看到全部内容。

查询参数同公开列表。

### GET /api/v1/posts/popular

热门文章。公开接口。

查询参数：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `limit` | integer | `5` | 返回数量。 |

### GET /api/v1/posts/{id}

按 ID 获取公开文章详情。公开接口。访问成功会增加浏览次数。

### GET /api/v1/posts/admin/{id}

后台按 ID 获取文章详情。需要登录，并要求作者本人或具备编辑全部内容权限。

### GET /api/v1/posts/slug/{slug}

按 slug 获取公开文章详情。公开接口。访问成功会增加浏览次数。

### POST /api/v1/posts

创建文章。需要登录。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `slug` | string | 否 | 可留空，后端根据标题生成。只允许小写字母、数字和连字符。 |
| `title` | string | 是 | 标题。 |
| `markdown` | string | 是 | Markdown 内容。 |
| `html` | string/null | 否 | 若提供，会被后端清洗后保存。 |
| `excerpt` | string/null | 否 | 摘要；为空时可由内容生成。 |
| `status` | string/null | 否 | 状态。作者通常只能草稿或待审核。 |
| `post_type` | string/null | 否 | 文章路由下通常为 `post`。 |
| `published_at` | string/null | 否 | ISO 时间，用于发布或定时。 |

示例：

```json
{
  "title": "Hello Tiphia",
  "slug": "",
  "markdown": "# Hello",
  "status": "draft"
}
```

### PUT /api/v1/posts/{id}

更新文章。需要登录，并要求作者本人或具备编辑全部内容权限。

请求体字段均可选：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `slug` | string/null | 新 slug。 |
| `title` | string/null | 标题。 |
| `markdown` | string/null | Markdown。 |
| `html` | string/null | HTML，会被清洗。 |
| `excerpt` | string/null | 摘要。 |
| `status` | string/null | 状态。 |
| `published_at` | string/null | 发布时间。 |

### PUT /api/v1/posts/{id}/status

修改文章状态。需要登录。

请求体：

```json
{
  "status": "scheduled",
  "published_at": "2026-06-01T00:00:00Z"
}
```

### PUT /api/v1/posts/bulk

批量操作文章。需要登录。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ids` | integer[] | 是 | 文章 ID 列表。 |
| `action` | string | 是 | `publish`、`archive`、`delete`。 |
| `published_at` | string/null | 否 | 批量发布时可提供。 |

响应：

```json
{
  "action": "archive",
  "affected": 2,
  "posts": []
}
```

### DELETE /api/v1/posts/{id}

删除文章。需要登录，并要求作者本人或具备编辑全部内容权限。

### GET /api/v1/posts/{id}/terms

获取文章绑定的分类和标签。公开接口。

### PUT /api/v1/posts/{id}/terms

同步文章分类标签。需要登录。

请求体：

```json
{
  "term_ids": [1, 2, 3]
}
```

### GET /api/v1/posts/{id}/revisions

获取文章修订版本。需要登录。

### PUT /api/v1/posts/{id}/revisions/{revision_id}/restore

恢复文章修订版本。需要登录。

### GET /api/v1/posts/{id}/comments/tree

获取文章的公开评论树。公开接口。

## 页面接口

页面接口和文章接口完全同构，前缀从 `/api/v1/posts` 改为 `/api/v1/pages`。页面的 `post_type` 为 `page`。

逐项接口如下：

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/v1/pages` | 否 | 公开页面列表。 |
| GET | `/api/v1/pages/admin` | 是 | 后台页面列表。 |
| GET | `/api/v1/pages/popular` | 否 | 热门页面。 |
| GET | `/api/v1/pages/{id}` | 否 | 公开页面详情。 |
| GET | `/api/v1/pages/admin/{id}` | 是 | 后台页面详情。 |
| GET | `/api/v1/pages/slug/{slug}` | 否 | 按 slug 获取页面。 |
| POST | `/api/v1/pages` | 是 | 创建页面。 |
| PUT | `/api/v1/pages/{id}` | 是 | 更新页面。 |
| PUT | `/api/v1/pages/{id}/status` | 是 | 修改页面状态。 |
| PUT | `/api/v1/pages/bulk` | 是 | 批量发布、归档、删除。 |
| DELETE | `/api/v1/pages/{id}` | 是 | 删除页面。 |
| GET | `/api/v1/pages/{id}/terms` | 否 | 获取页面绑定分类标签。 |
| PUT | `/api/v1/pages/{id}/terms` | 是 | 同步页面分类标签。 |
| GET | `/api/v1/pages/{id}/revisions` | 是 | 页面修订版本。 |
| PUT | `/api/v1/pages/{id}/revisions/{revision_id}/restore` | 是 | 恢复页面修订版本。 |
| GET | `/api/v1/pages/{id}/comments/tree` | 否 | 页面评论树。 |

## 评论接口

评论状态：

| 值 | 说明 |
| --- | --- |
| `pending` | 待审核。 |
| `approved` | 已通过。 |
| `spam` | 垃圾评论。 |
| `trash` | 回收站。 |

### GET /api/v1/comments

后台评论列表。需要编辑及以上权限。

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `post_id` | integer | 按文章或页面 ID 过滤。 |
| `status` | string | 按评论状态过滤。 |
| `page` | integer | 页码。 |
| `per_page` | integer | 每页数量。 |

### GET /api/v1/comments/recent

最新评论。公开接口。只返回已通过评论。

查询参数：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `limit` | integer | `5` | 返回数量，后端限制最大值。 |

### POST /api/v1/comments

提交评论。公开接口，但受评论开关、限流和插件 Hook 影响。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `post_id` | integer | 是 | 评论所属文章或页面 ID。 |
| `parent_id` | integer/null | 否 | 父评论 ID。必须属于同一文章。 |
| `author_name` | string | 是 | 评论者名称。 |
| `author_email` | string | 是 | 邮箱。 |
| `author_url` | string/null | 否 | 主页 URL。 |
| `content` | string | 是 | 评论内容。 |
| `captcha` | object/null | 否 | 插件验证码载荷。 |

### GET /api/v1/comments/post/{post_id}/tree

按文章 ID 获取公开评论树。公开接口。

### PUT /api/v1/comments/{id}/moderation

审核评论。需要编辑及以上权限。

请求体：

```json
{
  "status": "approved"
}
```

## 分类标签接口

分类和标签共用 term 模型。类型值：

| 值 | 说明 |
| --- | --- |
| `category` | 分类。 |
| `tag` | 标签。 |

### GET /api/v1/terms

分类标签列表。公开接口。

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `term_type` | string | `category` 或 `tag`。 |
| `page` | integer | 页码。 |
| `per_page` | integer | 每页数量。 |

响应项包含 `post_count`。

### GET /api/v1/terms/{id}

获取单个分类或标签。公开接口。

### POST /api/v1/terms

创建分类或标签。需要编辑及以上权限。

请求体：

```json
{
  "name": "Rust",
  "slug": "",
  "description": "Rust articles",
  "term_type": "category",
  "parent_id": null,
  "sort_order": 0
}
```

`slug` 可留空，后端会根据名称生成。

### PUT /api/v1/terms/{id}

更新分类或标签。需要编辑及以上权限。

请求体字段均可选：

```json
{
  "name": "Rust",
  "slug": "rust",
  "description": "Rust articles",
  "parent_id": null,
  "sort_order": 10
}
```

### DELETE /api/v1/terms/{id}

删除分类或标签。需要编辑及以上权限。

## 用户接口

角色：

| 值 | 说明 |
| --- | --- |
| `root` | 最高管理员。 |
| `admin` | 管理员。不能管理 root 或同级管理员。 |
| `editor` | 编辑。可管理内容、评论和分类标签。 |
| `author` | 作者。只能管理自己的内容。 |

状态：

| 值 | 说明 |
| --- | --- |
| `active` | 可登录。 |
| `disabled` | 禁用。 |

### GET /api/v1/users

用户列表。需要管理员权限。

查询参数：`page`、`per_page`。

### POST /api/v1/users

创建用户。需要管理员权限。

请求体：

```json
{
  "username": "writer",
  "email": "writer@example.com",
  "password": "change-me-please",
  "display_name": "Writer",
  "role": "author"
}
```

### GET /api/v1/users/{id}

获取用户详情。需要管理员权限。

### PUT /api/v1/users/{id}

更新用户。需要管理员权限。

请求体字段可选：

```json
{
  "email": "writer@example.com",
  "display_name": "Writer",
  "role": "editor",
  "status": "active"
}
```

安全规则：管理员不能管理 root，普通管理员不能管理同级管理员，root/admin 不能禁用自身。

### PUT /api/v1/users/{id}/password

修改用户密码。需要管理员权限。

请求体：

```json
{
  "password": "new-change-me-please"
}
```

## 插件管理接口

### GET /api/v1/plugins

插件列表。公开读取。返回插件 manifest、启用状态、hook 数、菜单数、是否可配置等信息。

### GET /api/v1/plugins/admin-menu

插件后台菜单。需要登录。

### GET /api/v1/plugins/{name}/config

读取插件配置。需要登录。

响应包含：

- `name`
- `config`
- `schema`

### PUT /api/v1/plugins/{name}/config

保存插件配置。需要登录。

请求体：

```json
{
  "config": {
    "enabled": true
  }
}
```

### GET /api/v1/plugins/{name}/state

读取插件启用状态。需要登录。

### PUT /api/v1/plugins/{name}/state

启用或禁用插件。需要登录。

请求体：

```json
{
  "enabled": true
}
```

插件默认状态是禁用。

## 设置接口

### GET /api/v1/settings

读取站点设置。公开接口。

重要字段：

- `title`
- `description`
- `avatar_url`
- `base_url`
- `timezone`
- `default_page_size`
- `comments_enabled`
- `comment_moderation`
- `registration_enabled`
- `permalink_format`
- `theme`
- `seo`

### PUT /api/v1/settings

更新站点设置。需要管理员权限。

请求体示例：

```json
{
  "title": "Tiphia",
  "description": "A Rust blog powered by Tiphia.",
  "avatar_url": "/assets/avatar.png",
  "base_url": "https://example.com",
  "timezone": "UTC",
  "default_page_size": 20,
  "comments_enabled": true,
  "comment_moderation": true,
  "registration_enabled": false,
  "permalink_format": "/archives/{slug}",
  "theme": {
    "active": "default",
    "configs": {
      "default": {
        "accent": "#2563eb"
      }
    },
    "config": {
      "accent": "#2563eb"
    }
  },
  "seo": {
    "meta_title_suffix": "Tiphia",
    "meta_description": "A Rust blog powered by Tiphia."
  }
}
```

## 主题接口

### GET /api/v1/themes

读取主题配置 schema 和当前主题设置。公开接口。后台主题页用它辅助渲染配置表单。

主题 favicon 不通过 JSON 配置，而由前端按主题名读取：

```text
/themes/{themeName}/favicon.ico
```

## 内置插件公开接口

这些接口只有在对应插件启用时才可用。未启用时返回 404。

### GET /api/v1/links

友情链接插件接口。公开接口。

返回字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 站点名称。 |
| `description` | string/null | 描述。 |
| `url` | string | 链接地址。 |
| `avatar` | string/null | 头像 URL。 |
| `category` | string/null | 自定义分类。 |

### GET /api/v1/filing

备案信息插件接口。公开接口。

返回 ICP 备案号、备案 URL 和公安备案 HTML 片段。

### GET /api/v1/geetest/config

GeeTest 插件公开配置。公开接口。

前端根据该接口判断是否渲染验证码。插件启用但关键信息为空时，前端不应显示验证码，后端也不应强制校验。

### GET /api/v1/audit/status

审计插件状态接口。插件启用时可用。

### GET /api/v1/audit/events

审计事件列表。需要编辑及以上权限。

查询参数：`page`、`per_page`。
