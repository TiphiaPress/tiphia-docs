# 后台管理开发

后台管理属于 `tiphia-frontend` 的 admin 区域，不属于主题。主题作者不应修改后台 CSS 或后台业务页面。

## 页面职责

后台页面负责：

- 根据权限决定是否展示入口和内容。
- 使用 React Query 获取数据。
- 显示列表、表单、弹窗和提示。
- 调用 API client。

不要让后台页面直接访问低层 fetch；统一走 `src/admin/lib/api`。

## 权限展示

没有权限访问某类接口时，后台不应展示对应页面内容。常见规则：

| 页面 | 可见角色 |
| --- | --- |
| 文章 | root/admin/editor/author，按后端权限限制操作。 |
| 评论 | root/admin/editor。 |
| 用户 | root/admin，但 admin 不能管理 root 或同级 admin。 |
| 插件 | root/admin。 |
| 主题 | root/admin。 |
| 设置 | root/admin。 |

## 表格页面

列表型页面建议统一：

- 顶部标题和主要操作按钮。
- 搜索和筛选栏。
- 批量操作栏。
- 数据表格。
- 分页器。
- 空状态。
- 成功和失败 toast。

## 插件配置面板

插件配置面板应使用后台已有类名：

- `plugin-config-panel`
- `settings-card`
- `field`
- `config-grid`
- `form-actions`

不要写与全局布局冲突的宽度或定位。

## i18n

后台新增文案应写入 `src/framework/i18n/dictionaries.ts`，不要直接把大量中文写死在组件里。插件可以通过 i18n Hook 注入自己的语言包。