# API：文章与页面

文章和页面共用 posts 数据结构，通过 `post_type` 区分。

## 文章列表

```text
GET /api/v1/posts?page=1&per_page=20&q=&status=&term_id=
```

公开列表只返回已发布且已到发布时间的文章。

## 文章详情

```text
GET /api/v1/posts/{id}
GET /api/v1/posts/slug/{slug}
```

公开详情会隐藏草稿、待审核、归档和未到时间的定时文章。

## 创建文章

```text
POST /api/v1/posts
Authorization: Bearer <token>
```

请求：

```json
{
  "title": "Hello",
  "slug": "hello",
  "markdown": "# Hello",
  "status": "published",
  "post_type": "post",
  "extensions": {}
}
```

`slug` 为空时后端会自动生成。

## 更新文章

```text
PUT /api/v1/posts/{id}
Authorization: Bearer <token>
```

只传需要更新的字段。

## 状态变更

```text
PUT /api/v1/posts/{id}/status
```

支持草稿、待审核、发布、定时、归档等状态。

## 页面接口

页面使用：

```text
GET /api/v1/pages/slug/{slug}
```

公开前端路由为：

```text
/pages/{slug}
```

## 修订版本

文章编辑会生成修订版本，可用于后台查看和恢复。主题不直接渲染修订版本。

## 浏览量

浏览量存储在 `options` 表：

```text
post:view:{post_id}
```

值形如：

```json
{ "count": 123 }
```

迁移工具导入浏览量时也应写入这个契约。