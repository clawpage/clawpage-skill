#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, "..");
const DEFAULT_API_HOST = "https://api.clawpage.ai";
const DEFAULT_CREATE_TTL_MS = 21600000;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function parseTtlArg(value) {
  if (value === undefined) {
    return { provided: false, ttlMs: undefined };
  }
  if (String(value) === "null") {
    return { provided: true, ttlMs: null };
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`invalid --ttl-ms value: ${value}`);
  }
  return { provided: true, ttlMs: num };
}

function computeExpiryIso(nowMs, ttlMs) {
  if (typeof ttlMs === "number" && Number.isFinite(ttlMs)) {
    return new Date(nowMs + ttlMs).toISOString();
  }
  return null;
}

function formatExpiryText({ isUpdate, ttlProvided, ttlMsApplied, nowMs }) {
  if (isUpdate && !ttlProvided) {
    return "__I18N_TEXT_0001__(__I18N_TEXT_0002__)";
  }
  if (ttlMsApplied === null) {
    return "__I18N_TEXT_0003__";
  }
  if (typeof ttlMsApplied === "number" && Number.isFinite(ttlMsApplied)) {
    return new Date(nowMs + ttlMsApplied).toLocaleString("zh-CN", { hour12: false });
  }
  return "__I18N_TEXT_0004__";
}

function escapeHtml(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text) {
  const links = [];
  let s = text;

  // markdown links: [text](https://...)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => {
    const idx = links.push({ label, url }) - 1;
    return `__LINK_${idx}__`;
  });

  // plain links (strip common trailing punctuation)
  s = s.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (_m, p1, rawUrl) => {
    const url = rawUrl.replace(/[),.!?;:'",.!?;:,]+$/u, "");
    const trailing = rawUrl.slice(url.length);
    const idx = links.push({ label: url, url }) - 1;
    return `${p1}__LINK_${idx}__${trailing}`;
  });

  s = escapeHtml(s);

  // bold markdown (**text** / __text__)
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  s = s.replace(/__LINK_(\d+)__/g, (_m, n) => {
    const link = links[Number(n)];
    if (!link) return "";
    const href = escapeHtml(link.url);
    const label = escapeHtml(link.label);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  return s;
}

function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inCode = false;
  let codeLang = "";
  let inUl = false;
  let inOl = false;
  let paragraph = [];

  const closeParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${paragraph.join(" ")}</p>`);
      paragraph = [];
    }
  };

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      closeParagraph();
      closeLists();
      if (!inCode) {
        inCode = true;
        codeLang = line.replace(/^```/, "").trim().toLowerCase();
        const languageClass = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : "";
        const dataLang = codeLang ? ` data-lang="${escapeHtml(codeLang)}"` : "";
        out.push(`<pre${dataLang}><code${languageClass}>`);
      } else {
        inCode = false;
        codeLang = "";
        out.push("</code></pre>");
      }
      continue;
    }

    if (inCode) {
      out.push(`${escapeHtml(rawLine)}\n`);
      continue;
    }

    if (line.trim() === "") {
      closeParagraph();
      closeLists();
      continue;
    }

    if (/^###\s+/.test(line)) {
      closeParagraph();
      closeLists();
      out.push(`<h3>${escapeHtml(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }

    if (/^##\s+/.test(line)) {
      closeParagraph();
      closeLists();
      out.push(`<h2>${escapeHtml(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      closeParagraph();
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      closeParagraph();
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${renderInline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    // Allow standalone raw HTML snippets so page toolkits can be used directly in content.
    if (/^<[^>]+>/.test(line.trim())) {
      closeParagraph();
      closeLists();
      out.push(rawLine);
      continue;
    }

    closeLists();
    paragraph.push(renderInline(line));
  }

  if (inCode) out.push("</code></pre>");
  closeParagraph();
  closeLists();

  return out.join("\n");
}

function loadKeys(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`keys file not found: ${filePath}`);
  }
  const obj = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const token =
    obj?.clawpage?.token ??
    obj?.clawpages?.token ??
    obj?.token ??
    obj?.clawpageToken ??
    obj?.clawpage_api_token ??
    obj?.clawpagesToken ??
    obj?.clawpages_api_token;
  const apiHost =
    obj?.clawpage?.apiHost ??
    obj?.clawpages?.apiHost ??
    obj?.apiHost ??
    obj?.clawpageApiHost ??
    obj?.clawpagesApiHost ??
    DEFAULT_API_HOST;

  if (!token || typeof token !== "string") {
    throw new Error("token missing in keys.local.json");
  }

  return { token, apiHost };
}

function renderHtml({ template, title, subtitle, generatedAt, expiresAt, contentHtml }) {
  return template
    .replaceAll("__PAGE_TITLE__", escapeHtml(title))
    .replaceAll("__PAGE_SUBTITLE__", escapeHtml(subtitle))
    .replaceAll("__GENERATED_AT__", escapeHtml(generatedAt))
    .replaceAll("__EXPIRES_AT__", escapeHtml(expiresAt))
    .replaceAll("__CONTENT_HTML__", contentHtml);
}

function bundleTemplate(templateDir) {
  const indexPath = path.join(templateDir, "index.html");
  const cssPath = path.join(templateDir, "default.css");
  const jsPath = path.join(templateDir, "default.js");

  const index = fs.readFileSync(indexPath, "utf8");
  const css = fs.readFileSync(cssPath, "utf8");
  const js = fs.readFileSync(jsPath, "utf8");

  return index
    .replaceAll("__DEFAULT_CSS__", css)
    .replaceAll("__DEFAULT_JS__", js);
}

function bundlePageProject({ pageDir, title, subtitle, generatedAt, expiresAt }) {
  const indexPath = path.join(pageDir, "index.html");
  const cssPath = path.join(pageDir, "default.css");
  const jsPath = path.join(pageDir, "default.js");

  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found in page dir: ${pageDir}`);
  }

  let html = fs.readFileSync(indexPath, "utf8");

  const hasDefaultCss = fs.existsSync(cssPath);
  const hasDefaultJs = fs.existsSync(jsPath);

  if (hasDefaultCss) {
    const css = fs.readFileSync(cssPath, "utf8");
    html = html.replaceAll("__DEFAULT_CSS__", css);
    html = html.replace(
      /<link[^>]*href=["'][^"']*default\.css["'][^>]*>/gi,
      `<style>\n${css}\n</style>`,
    );
  } else {
    html = html.replaceAll("__DEFAULT_CSS__", "");
  }

  if (hasDefaultJs) {
    const js = fs.readFileSync(jsPath, "utf8");
    html = html.replaceAll("__DEFAULT_JS__", js);
    html = html.replace(
      /<script[^>]*src=["'][^"']*default\.js["'][^>]*>\s*<\/script>/gi,
      `<script>\n${js}\n</script>`,
    );
  } else {
    html = html.replaceAll("__DEFAULT_JS__", "");
  }

  return renderHtml({
    template: html,
    title,
    subtitle,
    generatedAt,
    expiresAt,
    contentHtml: "",
  });
}

async function createPage({ apiHost, token, html, ttlMs, pageName, pagecode }) {
  const payload = { html };
  if (ttlMs === null || (typeof ttlMs === "number" && Number.isFinite(ttlMs))) payload.ttlMs = ttlMs;
  if (typeof pageName === "string" && pageName.trim() !== "") payload.page_name = pageName;
  if (pagecode !== undefined) payload.pagecode = pagecode;

  const res = await fetch(`${apiHost.replace(/\/$/, "")}/api/pages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await res.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = { raw: bodyText };
  }

  if (!res.ok) {
    const msg = typeof body === "object" ? JSON.stringify(body) : bodyText;
    throw new Error(`publish failed: HTTP ${res.status} ${msg}`);
  }

  return body;
}

async function updatePage({ apiHost, token, pageId, html, ttlMs, pageName, pagecode }) {
  const payload = { html };
  if (ttlMs !== undefined) payload.ttlMs = ttlMs;
  if (pageName !== undefined) payload.page_name = pageName;
  if (pagecode !== undefined) payload.pagecode = pagecode;

  const res = await fetch(`${apiHost.replace(/\/$/, "")}/api/pages/${encodeURIComponent(pageId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await res.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = { raw: bodyText };
  }

  if (!res.ok) {
    const msg = typeof body === "object" ? JSON.stringify(body) : bodyText;
    throw new Error(`update failed: HTTP ${res.status} ${msg}`);
  }

  return body;
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(
      [
        "Usage:",
        "  node scripts/clawpages_publish.mjs --page-dir <dir> [--title <title> --subtitle <text>]",
        "  node scripts/clawpages_publish.mjs --title <title> --content-file <file>",
        "Options:",
        "  --page-dir <path>          publish an existing page project directory",
        "  --page-id <id>             update an existing page by pageId (PATCH)",
        "  --page-name <text>         page_name payload field",
        "  --pagecode <text|null>     set/remove URL access code (null = remove)",
        "  --password <text|null>     deprecated alias for --pagecode",
        "  --title <text>",
        "  --subtitle <text>",
        "  --content <text>",
        "  --ttl-ms <number|null>     create default: 21600000 (6h)",
        "  --keys-file <path>",
        "  --api-host <url>",
        "  --output-html <path>",
        "  --dry-run",
      ].join("\n"),
    );
    process.exit(0);
  }

  const pageDirArg = args["page-dir"] ? String(args["page-dir"]) : "";
  const pageDir = pageDirArg ? path.resolve(pageDirArg) : "";
  const defaultTitle = pageDir ? path.basename(pageDir) : "__I18N_TEXT_0005__";
  const title = String(args.title || defaultTitle);
  const subtitle = String(args.subtitle || "__I18N_TEXT_0006__");
  const generatedAt = new Date().toLocaleString("zh-CN", { hour12: false });
  const pageId = args["page-id"] ? String(args["page-id"]) : "";
  const isUpdate = Boolean(pageId);
  const ttlArg = parseTtlArg(args["ttl-ms"]);
  const ttlMs = isUpdate
    ? (ttlArg.provided ? ttlArg.ttlMs : undefined)
    : (ttlArg.provided ? ttlArg.ttlMs : DEFAULT_CREATE_TTL_MS);
  const nowMs = Date.now();
  const ttlMsApplied = isUpdate ? (ttlArg.provided ? ttlMs : null) : ttlMs;
  const expiresAt = computeExpiryIso(nowMs, ttlMsApplied);
  const expiresAtText = formatExpiryText({ isUpdate, ttlProvided: ttlArg.provided, ttlMsApplied, nowMs });

  let html = "";
  if (pageDir) {
    html = bundlePageProject({ pageDir, title, subtitle, generatedAt, expiresAt: expiresAtText });
  } else {
    let rawContent = "";
    if (args["content-file"]) {
      rawContent = fs.readFileSync(path.resolve(String(args["content-file"])), "utf8");
    } else if (typeof args.content === "string") {
      rawContent = args.content;
    } else {
      throw new Error("missing content: use --content-file or --content, or pass --page-dir");
    }

    const templateDir = path.join(skillRoot, "templates", "genernal_template");
    const template = bundleTemplate(templateDir);
    const contentHtml = markdownToHtml(rawContent);
    html = renderHtml({ template, title, subtitle, generatedAt, expiresAt: expiresAtText, contentHtml });
  }

  const outputHtml = path.resolve(String(args["output-html"] || "/tmp/clawpages-preview.html"));
  fs.writeFileSync(outputHtml, html, "utf8");

  if (args["dry-run"]) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          htmlPath: outputHtml,
        },
        null,
        2,
      ),
    );
    return;
  }

  const keysFile = path.resolve(String(args["keys-file"] || path.join(skillRoot, "keys.local.json")));
  const { token, apiHost: keyApiHost } = loadKeys(keysFile);
  const apiHost = String(args["api-host"] || keyApiHost || DEFAULT_API_HOST);
  const pageName = typeof args["page-name"] === "string"
    ? String(args["page-name"])
    : (isUpdate ? undefined : title);
  const pagecodeRaw = args.pagecode !== undefined ? args.pagecode : args.password;
  const pagecode = pagecodeRaw === undefined ? undefined : String(pagecodeRaw) === "null" ? null : String(pagecodeRaw);
  const pagecodeUpdated = pagecode !== undefined;

  const data = pageId
    ? await updatePage({ apiHost, token, pageId, html, ttlMs, pageName, pagecode })
    : await createPage({ apiHost, token, html, ttlMs, pageName, pagecode });
  const page = data?.page || data || {};
  const returnedPagecode = typeof data?.pagecode === "string" ? data.pagecode : null;
  const resolvedPagecode = pagecode !== undefined ? pagecode : returnedPagecode;
  const pagecodeProtected = resolvedPagecode === undefined
    ? (isUpdate ? null : (returnedPagecode ? true : null))
    : (resolvedPagecode !== null && resolvedPagecode !== "");
  const accessUrl = data?.accessUrl || null;

  const result = {
    ok: true,
    mode: isUpdate ? "updated" : "created",
    pageId: page.pageId || pageId,
    username: page.username || data?.username || null,
    pageName: page.pageName || pageName || null,
    url: page.rootUrl || data?.rootUrl,
    accessUrl,
    pagecode: resolvedPagecode ?? null,
    pagecodeUpdated,
    pagecodeProtected,
    currentVersion: page.currentVersion || data?.currentVersion,
    ttlMsApplied,
    expiresAt,
    // Backward-compatible aliases
    passwordUpdated: pagecodeUpdated,
    passwordProtected: pagecodeProtected,
    temporaryPassword: typeof resolvedPagecode === "string" ? resolvedPagecode : null,
    htmlPath: outputHtml,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(`[clawpage] ${err.message}`);
  process.exit(1);
});
