# API：Feed 与 Sitemap

Feed 和 Sitemap 用于搜索引擎、订阅客户端和站点地图。

## RSS

```text
GET /feed.xml
```

RSS item 链接按前端真实路由生成：

```text
/posts/{slug}
/pages/{slug}
```

## Atom

```text
GET /atom.xml
```

Atom 输出 UTF-8 XML，并对标题、摘要、链接进行 XML 转义。

## Sitemap

```text
GET /sitemap.xml
```

Sitemap 包含站点首页、公开文章和公开页面。

## base_url

如果配置了：

```toml
base_url = "https://blog.example.com"
```

Feed 和 Sitemap 会输出绝对 URL。否则会输出相对 URL。

## 常见问题

| 问题 | 处理 |
| --- | --- |
| 链接是旧 `/archives/...` | 更新后端到新版本；站点设置推荐改为 `/posts/{slug}`。 |
| XML 乱码 | 确认响应和文件都使用 UTF-8。 |
| RSS 没有新文章 | 确认文章状态为 `published` 且定时发布时间已到。 |