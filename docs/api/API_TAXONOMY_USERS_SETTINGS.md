# API：分类标签、用户与设置

## 分类和标签

分类、标签统称 term，通过 `type` 区分。

```text
GET  /api/v1/terms?type=category
POST /api/v1/terms
GET  /api/v1/terms/{id}
PUT  /api/v1/terms/{id}
```

创建分类或标签时，`slug` 为空会由后端自动生成。

前端管理后台应将分类和标签分开管理，并在数据量大时分页展示。

## 用户

```text
GET  /api/v1/users
POST /api/v1/users
GET  /api/v1/users/{id}
PUT  /api/v1/users/{id}
```

权限规则：

- root 可以管理所有用户，但不能禁用自己。
- admin 不能管理 root，也不能管理其他 admin。
- admin 不能禁用自己。
- editor/author 不应看到用户管理入口。

## 站点设置

```text
GET /api/v1/settings
PUT /api/v1/settings
```

重要字段：

| 字段 | 说明 |
| --- | --- |
| `title` | 站点名称。 |
| `description` | 站点描述。 |
| `base_url` | 公开站点地址，用于邮件、RSS、Sitemap。 |
| `avatar_url` | 站点头像。 |
| `gravatar_base_url` | Gravatar 或 Cravatar 镜像地址。 |
| `comments_enabled` | 是否启用评论。 |
| `comment_moderation` | 评论是否需要审核。 |
| `registration_enabled` | 是否开放注册。 |
| `permalink_format` | 文章 permalink 格式，推荐 `/posts/{slug}`。 |

页面公开路由固定为 `/pages/{slug}`。