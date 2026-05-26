# 插件配置 UI

前端插件可以提供自己的后台配置面板。后端插件也可以提供 schema，让后台自动生成配置表单。

## 两种模式

| 模式 | 适合场景 |
| --- | --- |
| 后端 schema 自动表单 | 字段简单，如开关、输入框、文本域。 |
| 前端自定义 Panel | 字段复杂，需要预览、动态列表、二维码、交互校验。 |

## 自定义 Panel 接口

前端插件注册：

```tsx
registerFrontendPlugin({
  name: "example-plugin",
  backendNames: ["example-plugin"],
  adminConfigPanel: ExampleConfigPanel,
});
```

Panel 接收：

```ts
interface PluginConfigPanelProps {
  plugin: PluginDescriptor;
  value: unknown;
  saving: boolean;
  error?: unknown;
  onSubmit: (value: unknown) => Promise<void> | void;
}
```

## 设计建议

- 配置页只负责配置，不负责启用插件。启用状态由插件列表卡片控制。
- 保存按钮放在表单底部右侧。
- 对危险操作使用 ConfirmBox，不要使用浏览器 `alert`/`confirm`。
- 长模板字段使用 textarea，并写清楚变量。
- 密码、密钥字段应避免默认展示真实值。

## 与后端配置同步

后端插件配置通常存储在：

```text
plugin:{plugin-name}:config
```

前端保存时只提交 JSON。后端负责 schema 校验、默认值补齐和敏感字段处理。