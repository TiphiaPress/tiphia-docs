# 部署方式

TiphiaPress 推荐后端和前端分开部署。后端可以使用 Docker、二进制或 systemd 服务运行；前端构建后是静态资源，可以部署到 GitHub Pages、Nginx、Cloudflare Pages、Vercel 或任意静态托管服务。

## Docker 部署后端

Docker 镜像只部署后端 API，不包含前端静态文件。这样可以让前端独立升级，也便于把后台管理和博客前台部署到不同域名。

准备配置文件：

```bash
cp tiphia.example.toml tiphia.toml
```

构建镜像：

```bash
docker build -t tiphia:local .
```

运行容器：

```bash
docker run --rm -p 3000:3000 \
  -e TIPHIA_JWT_SECRET=change-this-secret-before-production \
  -e TIPHIA_CORS_ALLOWED_ORIGINS=https://your-frontend.example.com \
  -v "$PWD/tiphia.toml:/app/tiphia.toml:ro" \
  -v tiphia-data:/app/data \
  -v tiphia-logs:/app/logs \
  tiphia:local
```

生产环境必须修改 `auth.jwt_secret`，并将 `cors.allowed_origins` 或 `TIPHIA_CORS_ALLOWED_ORIGINS` 设置为你的前端实际域名。

## Docker Compose

如果使用 Compose，可以维护一个 `docker-compose.yml`：

```yaml
services:
  tiphia:
    image: tiphia:local
    build: .
    ports:
      - "3000:3000"
    environment:
      TIPHIA_ENV: production
      TIPHIA_BIND: 0.0.0.0:3000
      TIPHIA_CONFIG: /app/tiphia.toml
      DATABASE_URL: sqlite:///app/data/tiphia.db?mode=rwc
      TIPHIA_LOG_DIR: /app/logs
      TIPHIA_JWT_SECRET: change-this-secret-before-production
      TIPHIA_CORS_ALLOWED_ORIGINS: https://your-frontend.example.com
    volumes:
      - tiphia-data:/app/data
      - tiphia-logs:/app/logs
      - ./tiphia.toml:/app/tiphia.toml:ro

volumes:
  tiphia-data:
  tiphia-logs:
```

启动：

```bash
docker compose up --build -d
```

## 二进制部署

也可以直接构建后端二进制：

```bash
cargo build --release --locked
```

运行：

```bash
TIPHIA_CONFIG=/path/to/tiphia.toml ./target/release/tiphia
```

建议用 systemd 或其他进程管理器托管，并把日志目录、数据库文件和配置文件放在持久化目录中。

## 前端部署

前端仓库单独构建：

```bash
cd tiphia-frontend
yarn install
yarn build
```

构建结果在 `dist/`。部署到静态托管时，需要设置环境变量：

```bash
VITE_TIPHIA_API_BASE=https://api.example.com
```

如果前端和后端跨域，后端 CORS 必须允许前端域名。

## 初始化 Root 用户

第一次启动后，通过 API 创建最高管理员 root：

```http
POST /api/v1/auth/bootstrap
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "change-me-please",
  "display_name": "Administrator"
}
```

初始化完成后，该接口会被隐藏或拒绝再次创建，后台入口由前端 `/admin` 路由提供。

## 部署检查清单

- 后端 `/health` 返回正常。
- 后端 `/openapi.json` 可访问。
- 前端 `VITE_TIPHIA_API_BASE` 指向正确后端。
- 后端 CORS 允许前端域名。
- JWT secret 已更换。
- 数据库目录和日志目录已持久化。
- Redis 限流在多实例部署时已启用。
