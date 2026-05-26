# 后端部署

后端只部署 API 服务，不包含前端静态页面。前端需要单独构建后部署到 Nginx、对象存储、CDN 或静态托管服务。

## Docker 单机部署

准备目录：

```bash
sudo mkdir -p /opt/tiphia/{config,data,logs}
sudo chown -R 10001:10001 /opt/tiphia/data /opt/tiphia/logs
sudo chmod 750 /opt/tiphia/data /opt/tiphia/logs
```

启动：

```bash
docker run -d \
  --name tiphia \
  --restart unless-stopped \
  -p 127.0.0.1:7999:3000 \
  -e TIPHIA_CONFIG=/app/tiphia.toml \
  -v /opt/tiphia/config/tiphia.toml:/app/tiphia.toml:ro \
  -v /opt/tiphia/data:/app/data \
  -v /opt/tiphia/logs:/app/logs \
  tiphia:latest
```

只绑定 `127.0.0.1` 可以避免 API 端口直接暴露到公网，然后由 Nginx 反代。

## 日志持久化

配置文件中建议：

```toml
[log]
directory = "/app/logs"
json = true
```

宿主机挂载：

```bash
-v /opt/tiphia/logs:/app/logs
```

如果出现 `Permission denied`，通常是挂载目录权限不属于容器运行用户。执行：

```bash
sudo chown -R 10001:10001 /opt/tiphia/logs /opt/tiphia/data
```

## SQLite 持久化

推荐：

```toml
[database]
url = "sqlite:///app/data/tiphia.db?mode=rwc"
```

不要把数据库放在容器层文件系统里，否则重建容器会丢失数据。

## Redis 限流

单实例可以不配置 Redis，使用内存限流。多实例或生产高并发建议配置 Redis：

```toml
[rate_limit]
redis_url = "redis://redis:6379/0"
login_per_minute = 5
comments_per_minute = 10
```

如果 Docker 单容器连接宿主机 Redis，可以使用宿主机可达地址，不要在容器内写 `127.0.0.1`，因为那指向容器自身。

## 健康检查

后端提供：

```text
GET /health
```

Nginx、监控系统或容器平台可以用它判断服务是否存活。