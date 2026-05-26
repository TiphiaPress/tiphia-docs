# API：认证与用户会话

认证接口统一位于 `/api/v1/auth`。

## 状态

```text
GET /api/v1/auth/status
```

返回系统是否初始化、是否开放注册。

## 初始化 root

```text
POST /api/v1/auth/bootstrap
```

只在用户表为空时可用。请求：

```json
{
  "username": "root",
  "email": "root@example.com",
  "password": "long-enough-password",
  "display_name": "Root"
}
```

## 登录

```text
POST /api/v1/auth/login
```

请求：

```json
{
  "account": "root@example.com",
  "password": "long-enough-password",
  "extensions": {}
}
```

插件可以通过 `extensions` 接收额外认证信息，例如 TOTP、验证码等。

## 当前用户

```text
GET /api/v1/auth/me
Authorization: Bearer <token>
```

返回当前登录用户公开信息。

## 注册

```text
POST /api/v1/auth/register
```

是否开放由站点设置控制。插件可通过注册 Hook 做验证码或风控。

## 权限模型

| 角色 | 说明 |
| --- | --- |
| `root` | 最高管理员，不能被普通管理员管理。 |
| `admin` | 管理员，不能管理 root 或同级管理员。 |
| `editor` | 内容编辑。 |
| `author` | 作者或普通注册用户。 |

管理员和 root 都不能禁用自己。