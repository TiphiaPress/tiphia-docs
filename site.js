const groups = [
  {
    title: "入门",
    pages: [
      { id: "intro", title: "什么是 TiphiaPress", file: "docs/start/INTRO.md" },
      { id: "concepts", title: "核心概念", file: "docs/start/CONCEPTS.md" },
      { id: "architecture", title: "架构总览", file: "docs/start/ARCHITECTURE.md" },
      { id: "development", title: "开发文档总览", file: "docs/development/DEVELOPMENT.md" },
    ],
  },
  {
    title: "部署与运维",
    pages: [
      { id: "deployment", title: "部署方式总览", file: "docs/deployment/DEPLOYMENT.md" },
      { id: "configuration", title: "配置文件", file: "docs/deployment/CONFIGURATION.md" },
      { id: "backend-deployment", title: "后端部署", file: "docs/deployment/BACKEND_DEPLOYMENT.md" },
      { id: "frontend-deployment", title: "前端部署", file: "docs/deployment/FRONTEND_DEPLOYMENT.md" },
      { id: "nginx-cors", title: "Nginx 与 CORS", file: "docs/deployment/NGINX_CORS.md" },
      { id: "operations", title: "运维与排错", file: "docs/deployment/OPERATIONS.md" },
      { id: "troubleshooting", title: "常见问题", file: "docs/deployment/TROUBLESHOOTING.md" },
      { id: "release", title: "Release Checklist", file: "docs/deployment/RELEASE.md" },
    ],
  },
  {
    title: "API",
    pages: [
      { id: "api", title: "API 总览", file: "docs/api/API_GUIDE.md" },
      { id: "api-auth", title: "认证与会话", file: "docs/api/API_AUTH.md" },
      { id: "api-content", title: "文章与页面", file: "docs/api/API_CONTENT.md" },
      { id: "api-comments", title: "评论", file: "docs/api/API_COMMENTS.md" },
      { id: "api-taxonomy-users-settings", title: "分类标签、用户与设置", file: "docs/api/API_TAXONOMY_USERS_SETTINGS.md" },
      { id: "api-feeds", title: "Feed 与 Sitemap", file: "docs/api/API_FEEDS.md" },
    ],
  },
  {
    title: "前端",
    pages: [
      { id: "frontend", title: "前端架构", file: "docs/development/FRONTEND.md" },
      { id: "admin-development", title: "后台管理开发", file: "docs/development/ADMIN_DEVELOPMENT.md" },
      { id: "frontend-hooks", title: "前端 Hook", file: "docs/hooks/FRONTEND_HOOKS.md" },
    ],
  },
  {
    title: "后端",
    pages: [
      { id: "backend-development", title: "后端开发", file: "docs/development/BACKEND_DEVELOPMENT.md" },
      { id: "backend-hooks", title: "后端 Hook", file: "docs/hooks/BACKEND_HOOKS.md" },
    ],
  },
  {
    title: "扩展生态",
    pages: [
      { id: "plugins", title: "插件开发", file: "docs/ecosystem/PLUGIN_DEVELOPMENT.md" },
      { id: "plugin-config-ui", title: "插件配置 UI", file: "docs/ecosystem/PLUGIN_CONFIG_UI.md" },
      { id: "themes", title: "主题开发", file: "docs/ecosystem/THEME_DEVELOPMENT.md" },
      { id: "default-theme", title: "默认主题配置", file: "docs/ecosystem/THEME_DEFAULT.md" },
      { id: "theme-legacy", title: "主题配置参考", file: "docs/ecosystem/THEMES.md" },
    ],
  },
  {
    title: "迁移",
    pages: [
      { id: "migration", title: "从 Typecho 迁移", file: "docs/migration/TYPECHO_MIGRATION.md" },
      { id: "typecho-import", title: "迁移工具", file: "docs/migration/TYPECHO_IMPORT.md" },
    ],
  },
];

const pages = groups.flatMap((group) => group.pages);
const nav = document.querySelector("#nav");
const content = document.querySelector("#content");
const menuButton = document.querySelector("#menuButton");

nav.innerHTML = groups.map((group) => `
  <section class="nav-group">
    <h2>${group.title}</h2>
    ${group.pages.map((page) => `<a href="#/${page.id}" data-id="${page.id}">${page.title}</a>`).join("")}
  </section>
`).join("");

menuButton.addEventListener("click", () => document.body.classList.toggle("nav-open"));
window.addEventListener("hashchange", renderRoute);
renderRoute();

async function renderRoute() {
  const id = location.hash.replace(/^#\/?/, "") || "intro";
  const page = pages.find((item) => item.id === id) || pages[0];
  document.querySelectorAll("nav a").forEach((link) => link.classList.toggle("active", link.dataset.id === page.id));
  document.body.classList.remove("nav-open");
  try {
    const response = await fetch(page.file);
    if (!response.ok) throw new Error(response.statusText);
    const text = await response.text();
    content.innerHTML = renderMarkdown(text);
    document.title = `${page.title} - TiphiaPress 文档`;
    content.scrollIntoView({ block: "start" });
  } catch (error) {
    content.innerHTML = `<h1>文档加载失败</h1><p>${escapeHtml(String(error))}</p>`;
  }
}

function renderMarkdown(markdown) {
  const blocks = [];
  let code = false;
  let codeLines = [];
  let list = [];
  let ordered = [];
  let table = [];

  function flushLists() {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      list = [];
    }
    if (ordered.length) {
      blocks.push(`<ol>${ordered.map((item) => `<li>${inline(item)}</li>`).join("")}</ol>`);
      ordered = [];
    }
  }

  function flushTable() {
    if (!table.length) return;
    const rows = table.map(splitTableRow).filter((row) => row.length);
    table = [];
    if (!rows.length) return;

    const separatorIndex = rows.findIndex(isTableSeparatorRow);
    if (separatorIndex !== 1) {
      rows.forEach((row) => blocks.push(`<p>${inline(row.join(" | "))}</p>`));
      return;
    }

    const header = rows[0];
    const body = rows.slice(2);
    blocks.push(
      `<div class="table-wrap"><table><thead><tr>${header.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead>` +
      `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    );
  }

  function flushFlow() {
    flushLists();
    flushTable();
  }

  markdown.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("```")) {
      if (code) {
        blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
      } else {
        flushFlow();
      }
      code = !code;
      return;
    }
    if (code) {
      codeLines.push(line);
      return;
    }
    if (!line.trim()) {
      flushFlow();
      return;
    }
    if (isTableLine(line)) {
      flushLists();
      table.push(line.trim());
      return;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushFlow();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      return;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushTable();
      ordered = [];
      list.push(bullet[1]);
      return;
    }
    const orderedItem = line.match(/^\d+\.\s+(.+)$/);
    if (orderedItem) {
      flushTable();
      list = [];
      ordered.push(orderedItem[1]);
      return;
    }
    flushFlow();
    blocks.push(`<p>${inline(line)}</p>`);
  });
  flushFlow();
  return blocks.join("\n");
}

function isTableLine(line) {
  const value = line.trim();
  return value.startsWith("|") && value.endsWith("|") && value.includes("|");
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparatorRow(row) {
  return row.every((cell) => /^:?-{3,}:?$/.test(cell));
}
function inline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => `<a href="${safeHref(href)}">${text}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function safeHref(href) {
  if (/^(https?:|mailto:|#|\/)/.test(href)) return escapeHtml(href);
  return escapeHtml(href);
}

function escapeHtml(value) {
  return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
}

