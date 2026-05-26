# Git 提交规范

提交信息要让别人能快速判断改动类型、影响范围和是否需要重点审查。

## 格式

推荐使用类似 Conventional Commits 的格式：

```text
<type>(<scope>): <summary>
```

示例：

```text
feat(plugin): add comment mail push templates
fix(feed): generate page links for recent comments
docs(deploy): document config-only docker run
refactor(frontend): auto register themes and plugins
test(core): cover feed permalink rendering
```

## type 说明

| type | 场景 |
| --- | --- |
| `feat` | 新功能。 |
| `fix` | Bug 修复。 |
| `docs` | 文档修改。 |
| `refactor` | 不改变行为的重构。 |
| `style` | CSS、布局、格式化等样式变更。 |
| `test` | 测试补充或测试修复。 |
| `perf` | 性能优化。 |
| `build` | 构建脚本、依赖、Docker、打包。 |
| `ci` | CI/CD 配置。 |
| `chore` | 杂项维护。 |
| `security` | 安全修复或安全加固。 |

## scope 建议

| scope | 说明 |
| --- | --- |
| `core` | 后端核心。 |
| `api` | REST API 或 OpenAPI。 |
| `auth` | 认证、权限、JWT、2FA。 |
| `comments` | 评论、评论树、评论审核、评论通知。 |
| `feed` | RSS、Atom、Sitemap、Robots。 |
| `plugin` | 插件系统或通用插件。 |
| `theme` | 主题系统或默认主题。 |
| `frontend` | 前端骨架。 |
| `admin` | 后台管理。 |
| `blog` | 博客前台数据容器。 |
| `docs` | 文档站。 |
| `deploy` | Docker、Nginx、部署配置。 |
| `migration` | 数据迁移、Typecho 导入。 |

## 提交粒度

推荐：

- 一个提交只解决一个问题。
- 行为改动和格式化尽量分开。
- 后端契约变更和前端适配可以放在同一功能提交里，但要写清楚。
- 文档更新可以跟随功能提交，也可以单独 `docs(...)` 提交。

不推荐：

- `update`、`fix bug`、`wip` 这类无法判断内容的提交。
- 把大规模重构、功能新增、样式调整、文档更新全塞进一个提交。
- 提交 `.env`、真实密钥、数据库文件、构建产物。

## PR 描述模板

```text
## 变更内容
- ...

## 影响范围
- 后端 API：是/否
- 前端构建：是/否
- 数据库迁移：是/否
- 文档更新：是/否

## 验证
- cargo check
- cargo test
- yarn build
- node --check site.js

## 注意事项
- ...
```
