# Nginx 与 CORS

Nginx 和 CORS 是 TiphiaPress 部署中最容易出错的部分。原则是：能同源就同源，不能同源时再配置 CORS。

## 推荐：前后端同源

前端和后端在同一个域名：

```text
https://blog.example.com/        -> 前端静态资源
https://blog.example.com/api/    -> Nginx 反代后端
```

前端构建：

```env
VITE_TIPHIA_API_BASE=
```

浏览器请求 `/api/v1/...`，没有跨域。

## 独立 API 域名

```text
https://blog.example.com         -> 前端
https://api.example.com          -> 后端 API
```

前端构建：

```env
VITE_TIPHIA_API_BASE=https://api.example.com
```

后端配置：

```toml
[cors]
allowed_origins = ["https://blog.example.com"]
```

## 不要这样做

不要把生产前端构建成：

```env
VITE_TIPHIA_API_BASE=http://127.0.0.1:3000
```

用户浏览器中的 `127.0.0.1` 指向用户自己的电脑，不是你的服务器。

也不要使用内网地址：

```env
VITE_TIPHIA_API_BASE=http://172.17.0.2:3000
```

这类地址只在服务器或容器内部有效，浏览器访问不到。

## 反代注意事项

后端应接收真实协议和来源信息：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

如果未来启用基于 IP 的限流、审计或链接生成，这些头会很重要。

## CORS 排错

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `No Access-Control-Allow-Origin` | 后端 CORS 未允许前端来源。 | 配置 `cors.allowed_origins`。 |
| 预检请求失败 | Nginx 未正确转发 `OPTIONS`。 | 确认 `/api/` location 能转发所有方法。 |
| Cookie 或 Authorization 不工作 | 请求头被代理丢失。 | 检查 `Authorization` 是否传到后端。 |
| 静态页 `/admin` 404 | SPA 回退缺失。 | 配置 `try_files $uri $uri/ /index.html`。 |