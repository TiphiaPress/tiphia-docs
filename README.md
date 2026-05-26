# TiphiaPress Docs

This repository contains the Chinese documentation site for TiphiaPress and is intended for GitHub Pages.

Published site:

https://tiphiapress.github.io/

## Content

The documentation covers:

- What TiphiaPress is.
- Docker and binary deployment.
- REST API reference.
- Frontend Hook reference.
- Backend Hook reference.
- General development workflow.
- Plugin development.
- Theme development.
- Typecho migration.


## Suggested Reading Order

For deployment, start with `docs/DEPLOYMENT.md`; it now covers Docker, config-file-only deployment, Nginx reverse proxy, frontend static build variables, cross-origin mode, cache invalidation, Redis, and common failure cases.

For development, read these in order:

1. `docs/DEVELOPMENT.md` for repository workflow and feature placement rules.
2. `docs/FRONTEND.md` for the frontend shell, theme, plugin and API base conventions.
3. `docs/FRONTEND_HOOKS.md` and `docs/BACKEND_HOOKS.md` for extension points.
4. `docs/PLUGIN_DEVELOPMENT.md` and `docs/THEME_DEVELOPMENT.md` for ecosystem development.
5. `docs/THEMES.md` for default theme configuration.

## Local Preview

```bash
python -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080
```

## GitHub Pages

1. Push to `TiphiaPress/tiphia-docs`.
2. Open repository Settings -> Pages.
3. Source: `Deploy from a branch`.
4. Branch: `main`, folder: `/root`.

No build step is required. `.nojekyll` is included so GitHub Pages serves files as plain static assets.
