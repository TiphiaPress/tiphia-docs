# 运维与故障排查

这页记录常见运行问题和排查路径。

## 后端启动失败

### 日志目录权限错误

错误类似：

```text
initializing rolling file appender failed: Permission denied
```

处理：

```bash
sudo chown -R 10001:10001 /opt/tiphia/logs /opt/tiphia/data
sudo chmod 750 /opt/tiphia/logs /opt/tiphia/data
```

### Redis 地址解析失败

错误类似：

```text
RateLimitBackend("failed to lookup address information")
```

检查 `rate_limit.redis_url`：

- 没有 Redis 就留空。
- Docker Compose 中可以写 `redis://redis:6379/0`。
- 单容器访问宿主机 Redis 不要写 `127.0.0.1`。

## 前端访问失败

### `/admin` 404

这是静态服务器没有做 SPA 回退。Nginx 应配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### API 仍请求旧地址

前端环境变量是构建时注入。修改 `.env` 后必须重新构建并刷新 CDN 缓存。

## 插件不生效

检查顺序：

1. 后端插件是否已编译进主程序。
2. 后台插件页是否启用。
3. 插件配置是否完整。
4. 前端插件是否在 `src/plugins/index.ts` 导入。
5. 主题是否放置了对应 HookSlot。
6. 浏览器控制台和后端日志是否有错误。

## RSS 或链接不正确

公开前端路由约定：

| 类型 | 路由 |
| --- | --- |
| 文章 | `/posts/{slug}` |
| 页面 | `/pages/{slug}` |

如果历史配置中仍有 `/archives/{slug}`，请在站点设置中改成 `/posts/{slug}`。RSS、Atom、Sitemap 会按前端真实路由生成。

## 数据备份

SQLite 单机部署至少备份：

```text
/opt/tiphia/data/tiphia.db
/opt/tiphia/config/tiphia.toml
/opt/tiphia/logs
```

备份前最好短暂停止容器，或使用 SQLite 在线备份方式。