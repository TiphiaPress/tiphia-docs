# 开发文档

TiphiaPress 拆分为后端、前端、主题和文档多个仓库。日常开发通常需要同时启动后端和前端。

## 仓库结构

推荐目录：

```text
TiphiaPress/
  tiphia/                  后端核心仓库
  tiphia-frontend/         前端骨架和后台管理
  tiphia-default-themes/   默认主题仓库
  tiphia-docs/             GitHub Pages 文档仓库
```

## 后端开发

进入后端仓库：

```bash
cd tiphia
cp tiphia.example.toml tiphia.toml
cp .env.example .env
cargo run
```

常用命令：

```bash
cargo check --locked
cargo test --workspace --locked
cargo clippy --workspace --all-targets --locked -- -D warnings
```

后端默认提供：

- `/health`
- `/openapi.json`
- `/api/v1/*`
- `/feed.xml`
- `/atom.xml`
- `/sitemap.xml`
- `/robots.txt`

## 前端开发

进入前端仓库：

```bash
cd tiphia-frontend
yarn install
yarn dev
```

前端默认地址：

```text
http://127.0.0.1:5173
```

后台地址：

```text
http://127.0.0.1:5173/admin
```

如果后端地址不是默认值，设置：

```bash
VITE_TIPHIA_API_BASE=http://127.0.0.1:3000
```

## 主题开发

默认主题源码可以从 `tiphia-default-themes` 复制或以 Git submodule 的方式放到：

```text
tiphia-frontend/src/themes/default
```

主题代码只负责渲染前台 UI。主题配置从后端 settings API 读取，前端骨架会把配置传给主题组件。

## 文档开发

`tiphia-docs` 是静态站，不需要构建。直接编辑 `docs/*.md`，然后打开 `index.html` 或使用静态服务器预览：

```bash
python -m http.server 8080
```

## 代码风格建议

- 后端保持服务、路由、实体、迁移、插件边界清晰。
- 前端骨架负责路由、数据加载、Hook 体系和主题装配。
- 主题只负责视觉和布局，不要耦合后台管理逻辑。
- 插件前端和后端可以协作，但不要假设一定同时存在。
- 文档要描述约定，而不是隐藏在代码里的口头规则。
