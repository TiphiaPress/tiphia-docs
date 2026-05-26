# 配置文件

TiphiaPress 后端支持 TOML 配置文件和环境变量覆盖。生产环境推荐使用配置文件作为主配置，敏感项可以按部署习惯放在环境变量或 secret 管理中。

## 加载顺序

1. 默认读取当前工作目录下的 `tiphia.toml`。
2. 如果设置 `TIPHIA_CONFIG`，读取该路径。
3. 环境变量覆盖配置文件中的同名配置。

## 基础示例

```toml
[app]
environment = "production"

[http]
bind = "0.0.0.0:3000"
request_timeout_secs = 30
max_body_bytes = 1048576

[cors]
allowed_origins = ["https://blog.example.com"]

[database]
url = "sqlite:///app/data/tiphia.db?mode=rwc"
max_connections = 16
min_connections = 1
connect_timeout_secs = 10
acquire_timeout_secs = 10

[log]
level = "tiphia=info,tower_http=info"
directory = "/app/logs"
file_prefix = "tiphia"
json = true

[auth]
jwt_secret = "replace-with-a-long-random-secret"
token_ttl_seconds = 604800

[rate_limit]
redis_url = ""
login_per_minute = 5
comments_per_minute = 10
```

## 常用环境变量

| 环境变量 | 对应配置 | 说明 |
| --- | --- | --- |
| `TIPHIA_CONFIG` | 配置文件路径 | Docker 中常用 `/app/tiphia.toml`。 |
| `TIPHIA_ENV` | `app.environment` | 生产环境为 `production`。 |
| `TIPHIA_BIND` | `http.bind` | 容器内通常是 `0.0.0.0:3000`。 |
| `DATABASE_URL` | `database.url` | 覆盖数据库连接。 |
| `TIPHIA_LOG_DIR` | `log.directory` | 覆盖日志目录。 |
| `RUST_LOG` | `log.level` | 覆盖日志级别。 |
| `TIPHIA_JWT_SECRET` | `auth.jwt_secret` | JWT 签名密钥。 |
| `TIPHIA_CORS_ALLOWED_ORIGINS` | `cors.allowed_origins` | 逗号分隔的前端来源。 |
| `TIPHIA_REDIS_URL` | `rate_limit.redis_url` | Redis 限流地址。 |

## 只用配置文件

如果你希望所有配置都写在 `tiphia.toml`，启动容器时只传：

```bash
docker run -d \
  --name tiphia \
  --restart unless-stopped \
  -p 7999:3000 \
  -e TIPHIA_CONFIG=/app/tiphia.toml \
  -v /opt/tiphia/config/tiphia.toml:/app/tiphia.toml:ro \
  -v /opt/tiphia/data:/app/data \
  -v /opt/tiphia/logs:/app/logs \
  tiphia:latest
```

不要再传 `DATABASE_URL`、`TIPHIA_JWT_SECRET`、`TIPHIA_CORS_ALLOWED_ORIGINS`、`TIPHIA_REDIS_URL`，否则它们会覆盖配置文件。

## JWT 密钥

生产环境必须使用高强度随机值：

```bash
openssl rand -base64 48
```

密钥改变后，已有登录 token 会失效。