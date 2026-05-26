# TiphiaPress Docs

This repository contains the Chinese documentation site for TiphiaPress and is intended for GitHub Pages.

Published site:

https://tiphiapress.github.io/

## Documentation Structure

The documentation is organized by task instead of by repository internals:

- `入门`: what TiphiaPress is, core concepts, architecture, and development overview.
- `部署与运维`: configuration, Docker backend deployment, frontend static deployment, Nginx/CORS, logs, Redis, release and troubleshooting.
- `API`: API overview plus focused pages for auth, content, comments, taxonomy/users/settings, and feeds.
- `前端`: frontend shell, admin development, and frontend hooks.
- `后端`: backend development and backend hooks.
- `扩展生态`: plugin development, plugin config UI, theme development, and default theme configuration.
- `协作规范`: branch model, commit message convention, merge rules, and development standards.
- `迁移`: Typecho migration workflow and import tool reference.

## Suggested Reading Order

For deployment:

1. `docs/deployment/DEPLOYMENT.md`
2. `docs/deployment/CONFIGURATION.md`
3. `docs/deployment/BACKEND_DEPLOYMENT.md`
4. `docs/deployment/FRONTEND_DEPLOYMENT.md`
5. `docs/deployment/NGINX_CORS.md`
6. `docs/deployment/OPERATIONS.md`

For development:

1. `docs/start/CONCEPTS.md`
2. `docs/start/ARCHITECTURE.md`
3. `docs/development/DEVELOPMENT.md`
4. `docs/development/BACKEND_DEVELOPMENT.md`
5. `docs/development/FRONTEND.md`
6. `docs/ecosystem/PLUGIN_DEVELOPMENT.md`
7. `docs/ecosystem/THEME_DEVELOPMENT.md`

For contributors:

1. `docs/development/CONTRIBUTING.md` for branch, commit, merge and release rules.
2. `docs/development/DEVELOPMENT.md` for repository workflow.
3. `docs/development/BACKEND_DEVELOPMENT.md` and `docs/development/FRONTEND.md` for code placement conventions.

For extension authors:

1. `docs/hooks/BACKEND_HOOKS.md`
2. `docs/hooks/FRONTEND_HOOKS.md`
3. `docs/ecosystem/PLUGIN_CONFIG_UI.md`
4. `docs/ecosystem/THEME_DEFAULT.md`

## Local Preview

```bash
python -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080
```

No build step is required. The site uses `index.html`, `site.js`, and `styles.css` directly.

## GitHub Pages

1. Push to `TiphiaPress/tiphia-docs`.
2. Open repository Settings -> Pages.
3. Source: `Deploy from a branch`.
4. Branch: `main`, folder: `/root`.

`.nojekyll` is included so GitHub Pages serves files as plain static assets.