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
  if (!Number.isFinite(num) || num <= 0) {
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

function buildAccessUrl({ rootUrl, accessUrl, pagecode }) {
  if (typeof accessUrl === "string" && accessUrl.trim() !== "") {
    return accessUrl;
  }
  if (typeof rootUrl !== "string" || rootUrl.trim() === "") {
    return null;
  }
  if (typeof pagecode !== "string" || pagecode === "") {
    return null;
  }
  try {
    const u = new URL(rootUrl);
    u.searchParams.set("pagecode", pagecode);
    return u.toString();
  } catch {
    const sep = rootUrl.includes("?") ? "&" : "?";
    return `${rootUrl}${sep}pagecode=${encodeURIComponent(pagecode)}`;
  }
}

function formatExpiryText({ isUpdate, ttlProvided, ttlMsApplied, nowMs }) {
  if (isUpdate && !ttlProvided) {
    return "[EXPIRE_AT_UNCHANGED]";
  }
  if (ttlMsApplied === null) {
    return "[NEVER_EXPIRES]";
  }
  if (typeof ttlMsApplied === "number" && Number.isFinite(ttlMsApplied)) {
    return new Date(nowMs + ttlMsApplied).toLocaleString("zh-CN", { hour12: false });
  }
  return "[EXPIRE_AT_UNKNOWN]";
}

function extractApiErrorCode(message) {
  const match = message.match(/"(?:error|code)"\s*:\s*"([A-Z0-9_]+)"/);
  return match ? match[1] : null;
}

function buildFailureResult(err) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const apiCode = extractApiErrorCode(errorMessage);
  const statusMatch = errorMessage.match(/\bHTTP\s+(\d{3})\b/);
  const status = statusMatch ? Number(statusMatch[1]) : null;

  let errorCode = apiCode || (status ? `HTTP_${status}` : "UNKNOWN_ERROR");
  let action = "Check inputs and retry.";

  if (errorMessage.includes("keys file not found")) {
    errorCode = "LOCAL_KEYS_FILE_MISSING";
    action = "Create keys.local.json from keys.local.example.json, then add clawpage.token.";
  } else if (errorMessage.includes("token missing in keys.local.json")) {
    errorCode = "LOCAL_TOKEN_MISSING";
    action = "Add a valid clawpage.token in keys.local.json and retry.";
  } else if (errorMessage.includes("fetch failed")) {
    errorCode = "NETWORK_ERROR";
    action = "Check network connectivity/DNS and api-host reachability, then retry.";
  } else if (apiCode === "UNAUTHORIZED" || status === 401) {
    errorCode = "UNAUTHORIZED";
    action = "Verify token in keys.local.json and retry.";
  } else if (apiCode === "PAGE_NOT_FOUND" || status === 404) {
    errorCode = "PAGE_NOT_FOUND";
    action = "Verify pageId ownership/existence; create/bind page first if needed.";
  } else if (apiCode === "USERNAME_TAKEN") {
    errorCode = "USERNAME_TAKEN";
    action = "Choose another username and retry registration.";
  } else if (apiCode === "IP_DAILY_REGISTRATION_LIMIT_REACHED") {
    errorCode = "IP_DAILY_REGISTRATION_LIMIT_REACHED";
    action = "Retry registration the next day or use an existing account.";
  } else if (apiCode === "OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED") {
    errorCode = "OWNER_DAILY_PAGE_CREATE_LIMIT_REACHED";
    action = "Retry page creation later when daily quota resets.";
  } else if (apiCode === "OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED") {
    errorCode = "OWNER_MONTHLY_PERMANENT_PAGE_LIMIT_REACHED";
    action = "Use shorter TTL or delete/repurpose permanent pages.";
  } else if (status === 429) {
    errorCode = "RATE_LIMITED";
    action = "Retry later and inspect rate-limit details in response body.";
  } else if (status && status >= 500) {
    errorCode = "SERVER_ERROR";
    action = "Retry later and verify --api-host if needed.";
  }

  return {
    ok: false,
    errorCode,
    errorMessage,
    action,
  };
}

function buildSuccessSummary({ mode, pageId, publicUrl, rootUrl, accessUrl }) {
  const primaryUrl = publicUrl || rootUrl || accessUrl || "[NO_URL]";
  return `${mode} page ${pageId} successfully. Share: ${primaryUrl}`;
}

function escapeHtml(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function renderHtml({ template, title, subtitle, generatedAt, expiresAt }) {
  return template
    .replaceAll("__PAGE_TITLE__", escapeHtml(title))
    .replaceAll("__PAGE_SUBTITLE__", escapeHtml(subtitle))
    .replaceAll("__GENERATED_AT__", escapeHtml(generatedAt))
    .replaceAll("__EXPIRES_AT__", escapeHtml(expiresAt));
  // NOTE: __CONTENT_HTML__ is intentionally NOT replaced here.
  // It must be filled by the agent directly in index.html before publish.
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

  // __CONTENT_HTML__ is left as-is: the agent must have already replaced it in index.html.
  // If it is still present here, the non-empty content gate in the publish checklist will catch it.
  return renderHtml({ template: html, title, subtitle, generatedAt, expiresAt });
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
        "Options:",
        "  --page-dir <path>          publish an existing page project directory (required)",
        "  --page-id <id>             update an existing page by pageId (PATCH)",
        "  --page-name <text>         page_name payload field",
        "  --pagecode <text|null>     set/remove URL access code (null = remove)",
        "  --password <text|null>     deprecated alias for --pagecode",
        "  --title <text>",
        "  --subtitle <text>",
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
  if (!pageDirArg) {
    throw new Error("--page-dir is required");
  }
  const pageDir = path.resolve(pageDirArg);
  const defaultTitle = path.basename(pageDir);
  const title = String(args.title || defaultTitle);
  const subtitle = String(args.subtitle || "[PAGE_SUBTITLE]");
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

  const html = bundlePageProject({ pageDir, title, subtitle, generatedAt, expiresAt: expiresAtText });

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

  // SOT from backend response
  const finalExpiresAt = page.expiresAt !== undefined ? page.expiresAt : expiresAt;
  const pagecodeProtected = typeof page.passwordProtected === "boolean"
    ? page.passwordProtected
    : (pagecodeUpdated ? (pagecode !== null && pagecode !== "") : (isUpdate ? null : (returnedPagecode ? true : null)));

  const rootUrl = page.rootUrl || data?.rootUrl || null;
  const publicUrl = page.publicUrl || data?.publicUrl || null;
  const accessUrl = buildAccessUrl({
    rootUrl,
    accessUrl: data?.accessUrl || null,
    pagecode: typeof resolvedPagecode === "string" ? resolvedPagecode : null,
  });

  const result = {
    ok: true,
    mode: isUpdate ? "updated" : "created",
    summary: buildSuccessSummary({
      mode: isUpdate ? "updated" : "created",
      pageId: page.pageId || pageId,
      publicUrl,
      rootUrl,
      accessUrl,
    }),
    pageId: page.pageId || pageId,
    username: page.username || data?.username || null,
    pageName: page.pageName || pageName || null,
    url: rootUrl,
    rootUrl,
    publicUrl,
    accessUrl,
    pageUrlNoPagecode: rootUrl,
    pageUrlWithPagecode: accessUrl,
    shareRecommendedUrl: publicUrl || rootUrl,
    pagecode: resolvedPagecode ?? null,
    pagecodeUpdated,
    pagecodeProtected,
    currentVersion: page.currentVersion || data?.currentVersion,
    ttlMsApplied,
    expiresAt: finalExpiresAt,
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
    // Backward-compatible aliases
    passwordUpdated: pagecodeUpdated,
    passwordProtected: pagecodeProtected,
    temporaryPassword: typeof resolvedPagecode === "string" ? resolvedPagecode : null,
    htmlPath: outputHtml,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  const failure = buildFailureResult(err);
  console.log(JSON.stringify(failure, null, 2));
  process.exit(1);
});
