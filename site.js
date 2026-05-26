const groups = [
  {
    title: "开始使用",
    pages: [
      { id: "intro", title: "什么是 TiphiaPress", file: "docs/INTRO.md" },
      { id: "deployment", title: "部署方式", file: "docs/DEPLOYMENT.md" },
      { id: "development", title: "开发文档", file: "docs/DEVELOPMENT.md" },
      { id: "frontend", title: "前端架构", file: "docs/FRONTEND.md" },
    ],
  },
  {
    title: "接口与扩展",
    pages: [
      { id: "api", title: "API 文档", file: "docs/API_GUIDE.md" },
      { id: "frontend-hooks", title: "前端 Hook 文档", file: "docs/FRONTEND_HOOKS.md" },
      { id: "backend-hooks", title: "后端 Hook 文档", file: "docs/BACKEND_HOOKS.md" },
    ],
  },
  {
    title: "生态开发",
    pages: [
      { id: "plugins", title: "插件开发文档", file: "docs/PLUGIN_DEVELOPMENT.md" },
      { id: "themes", title: "主题开发文档", file: "docs/THEME_DEVELOPMENT.md" },
      { id: "default-theme", title: "默认主题配置", file: "docs/THEMES.md" },
      { id: "migration", title: "从 Typecho 迁移", file: "docs/TYPECHO_MIGRATION.md" },
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

