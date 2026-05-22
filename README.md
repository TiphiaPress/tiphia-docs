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
