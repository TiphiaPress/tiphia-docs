# 从 Typecho 迁移

TiphiaPress 提供 `tiphia-typecho-import` 命令行工具，用于从 Typecho 数据库迁移内容。

## 支持范围

迁移工具支持：

- 文章。
- 页面。
- 分类。
- 标签。
- 文章与分类标签关系。
- 评论。

迁移前请备份 Typecho 数据库和 TiphiaPress 数据库。

## 基本命令

默认是 dry run，不会写入数据：

```bash
cargo run -p tiphia-typecho-import -- \
  --typecho-url "mysql://user:password@127.0.0.1:3306/typecho" \
  --typecho-prefix "typecho_" \
  --tiphia-url "sqlite://tiphia.db?mode=rwc" \
  --author-id 1
```

确认输出无误后加上 `--execute`：

```bash
cargo run -p tiphia-typecho-import -- \
  --typecho-url "mysql://user:password@127.0.0.1:3306/typecho" \
  --typecho-prefix "typecho_" \
  --tiphia-url "sqlite://tiphia.db?mode=rwc" \
  --author-id 1 \
  --execute
```

## 字段映射

常见映射关系：

- Typecho contents 中的 post 映射为 TiphiaPress 文章。
- Typecho contents 中的 page 映射为 TiphiaPress 页面。
- Typecho metas 中的 category 映射为分类。
- Typecho metas 中的 tag 映射为标签。
- Typecho comments 映射为评论。

如果 Typecho slug 缺失或不符合规则，迁移工具应生成兼容 slug。

## 迁移前准备

1. 在 TiphiaPress 中创建 root 用户。
2. 确认 `author-id` 对应一个存在的用户。
3. 停止旧站写入，避免迁移期间新增内容丢失。
4. 备份两个数据库。
5. 先 dry run，再执行写入。

## 迁移后检查

- 文章数量是否一致。
- 页面数量是否一致。
- 分类和标签是否存在。
- 文章绑定关系是否正确。
- 评论数量和状态是否正确。
- 前台文章路径是否符合预期。
- 搜索、归档、时间线是否正常。
