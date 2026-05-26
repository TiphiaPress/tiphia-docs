# 后端开发

后端使用 Rust、Axum、SeaORM 和 tracing。代码应保持模块边界清晰，业务放 service，路由只做提取和返回。

## 目录结构

```text
crates/tiphia-core/src/
  app.rs
  config.rs
  entities/
  error.rs
  migration/
  plugins.rs
  rate_limit/
  routes/
  services/
src/main.rs
plugins/
tools/
```

## 服务层约定

- 输入结构放在对应 service 模块。
- 业务校验在 service 中完成。
- 路由层只提取参数、检查权限、调用 service。
- 共享逻辑拆到子模块，例如 `posts/slug.rs`、`posts/response.rs`。

## Entity 约定

Entity 已拆分到 `entities/` 子模块。新增表时需要：

1. 增加 entity 文件。
2. 在 `entities/mod.rs` 导出。
3. 在 migration 中建表和索引。
4. 在 OpenAPI/服务层补响应类型。
5. 写测试覆盖主要路径。

## Hook 约定

核心业务扩展点应通过 Hook 提供。新增 Hook 时需要记录：

- Hook 名称。
- 触发时机。
- `HookContext` subject 类型。
- 是否允许插件修改 subject。
- 错误是否中断主流程。

## 测试

常用命令：

```bash
cargo fmt
cargo check
cargo test
```

只测核心：

```bash
cargo test -p tiphia-core
```

## 安全检查重点

- 密码只保存 hash。
- token 不写日志。
- 插件错误要区分是否应阻断主流程。
- 公开接口不能泄露未发布内容。
- 用户权限规则必须在 service 层再次确认。