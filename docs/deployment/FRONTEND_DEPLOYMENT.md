# 前端部署

前端是静态资源。构建时需要决定 API Base，部署时需要正确配置 SPA 回退和 API 反向代理。

## 构建变量

前端使用 Vite，环境变量必须以 `VITE_` 开头。

| 变量 | 说明 |
| --- | --- |
| `VITE_TIPHIA_API_BASE` | 后端 API 基础地址。为空时使用同源 `/api/...`。 |
| `VITE_TIPHIA_BASE` | 前端部署子路径，根路径部署通常为 `/`。 |

`.env.production` 示例：

```env
VITE_TIPHIA_API_BASE=https://api.example.com
VITE_TIPHIA_BASE=/
```

同源部署时：

```env
VITE_TIPHIA_API_BASE=
VITE_TIPHIA_BASE=/
```

构建：

```bash
yarn install
yarn build
```

产物在 `dist/`。

## Nginx 静态部署

```nginx
server {
    listen 443 ssl http2;
    server_name blog.example.com;

    root /var/www/tiphia-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:7999/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

如果直接访问 `/admin` 404，通常是缺少：

```nginx
try_files $uri $uri/ /index.html;
```

## CDN 或对象存储部署

如果前端部署到 CDN 或对象存储，通常无法同源反代 `/api/`。这时需要：

```env
VITE_TIPHIA_API_BASE=https://api.example.com
```

同时后端配置：

```toml
[cors]
allowed_origins = ["https://blog.example.com"]
```

## 构建后变量不生效

Vite 环境变量在构建时固化进静态资源。修改 `.env` 后必须重新执行：

```bash
yarn build
```

然后重新上传 `dist/`。

浏览器仍访问旧 API 时，检查：

- 是否重新构建。
- CDN 是否刷新缓存。
- `dist/assets/app-*.js` 是否已更新。
- `.env` 文件是否在项目根目录。
- 变量名是否以 `VITE_` 开头。