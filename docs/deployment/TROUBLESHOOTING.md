# 常见问题

## 访问 `/admin` 404

静态部署没有配置 SPA 回退。Nginx 需要：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 前端请求 `127.0.0.1:3000`

生产构建时 `VITE_TIPHIA_API_BASE` 写错了。用户浏览器里的 `127.0.0.1` 指向用户本机。

同源部署留空：

```env
VITE_TIPHIA_API_BASE=
```

独立 API 域名写公网地址：

```env
VITE_TIPHIA_API_BASE=https://api.example.com
```

修改后重新 `yarn build`。

## CORS 报错

后端配置中加入真实前端来源：

```toml
[cors]
allowed_origins = ["https://blog.example.com"]
```

不要在生产环境随便放开 `*`。

## Docker 日志目录无权限

执行：

```bash
sudo chown -R 10001:10001 /opt/tiphia/logs /opt/tiphia/data
```

## Redis 地址解析失败

没有 Redis 就把 `redis_url` 留空。Docker 内写 `127.0.0.1` 通常是错的。

## 插件配置保存了但不生效

检查：

1. 插件是否启用。
2. 后端插件是否编译进主程序。
3. 前端插件是否导入。
4. 配置是否完整。
5. 主题是否放置对应 HookSlot。

## RSS 还是旧链接

升级后端，并把站点设置的 `permalink_format` 改成：

```text
/posts/{slug}
```

Feed 渲染会按前端真实路由生成链接。