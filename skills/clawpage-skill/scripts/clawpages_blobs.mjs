#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, "..");
const DEFAULT_API_HOST = "https://api.clawpage.ai";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const t = argv[i];
    if (!t.startsWith("--")) continue;
    const k = t.slice(2);
    const n = argv[i + 1];
    if (!n || n.startsWith("--")) { args[k] = true; continue; }
    args[k] = n;
    i += 1;
  }
  return args;
}

function keysPath() {
  for (const p of [path.join(skillRoot, "keys.local.json"), path.join(process.cwd(), "keys.local.json")]) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("keys.local.json not found");
}

function loadKeys() {
  const p = keysPath();
  const o = JSON.parse(fs.readFileSync(p, "utf8"));
  const token = o?.clawpage?.token ?? o?.clawpages?.token ?? o?.token;
  const apiHost = o?.clawpage?.apiHost ?? o?.clawpages?.apiHost ?? DEFAULT_API_HOST;
  const username = o?.clawpage?.username ?? o?.clawpages?.username ?? null;
  const homeUrl = o?.clawpage?.homeUrl ?? o?.clawpages?.homeUrl ?? null;
  if (!token) throw new Error("token missing");
  return { token, apiHost, username, homeUrl, keysFilePath: p, raw: o };
}

function saveUserInfo({ keysFilePath, raw }, { username, homeUrl, dataApiBase }) {
  const u = { ...raw };
  u.clawpage = { ...(u.clawpage || {}), username, homeUrl, dataApiBase };
  fs.writeFileSync(keysFilePath, JSON.stringify(u, null, 2) + "\n", "utf8");
}

async function call(url, { method = "GET", token, body, headers: extraHeaders } = {}) {
  const headers = { ...(extraHeaders || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { method, headers, body });
  const txt = await r.text();
  let parsed = null;
  try { parsed = txt ? JSON.parse(txt) : null; } catch { parsed = txt; }
  if (!r.ok) {
    const msg = typeof parsed === "object" && parsed && parsed.message
      ? `${r.status} ${parsed.error || ""}: ${parsed.message}`
      : `${r.status} ${txt}`;
    throw new Error(msg);
  }
  return parsed;
}

async function ensureHomeUrl(keys) {
  if (keys.homeUrl && keys.username) return { username: keys.username, homeUrl: keys.homeUrl };
  const me = await call(`${keys.apiHost}/api/me`, { token: keys.token });
  saveUserInfo(keys, { username: me.username, homeUrl: me.homeUrl, dataApiBase: me.dataApiBase });
  console.error(`[info] cached username=${me.username}`);
  return { username: me.username, homeUrl: me.homeUrl };
}

function usage() {
  console.error(`usage:
  --upload <path>         # upload a file, returns URL
  --list                  # list my blobs + usage
  --delete <blobId>
  --usage                 # just show storage usage
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const keys = loadKeys();
  const { homeUrl } = await ensureHomeUrl(keys);
  const base = `${homeUrl}/api/blobs`;

  try {
    if (typeof args.upload === "string") {
      const filePath = path.resolve(process.cwd(), args.upload);
      if (!fs.existsSync(filePath)) throw new Error(`file not found: ${filePath}`);
      const buf = fs.readFileSync(filePath);
      const filename = path.basename(filePath);
      // Guess content-type from extension (minimal; server will use uploaded value)
      const ext = path.extname(filename).toLowerCase();
      const MIME = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif",
        ".webp": "image/webp", ".svg": "image/svg+xml", ".pdf": "application/pdf",
        ".txt": "text/plain", ".csv": "text/csv", ".md": "text/markdown", ".json": "application/json",
      };
      const contentType = MIME[ext] || "application/octet-stream";
      const fd = new FormData();
      fd.append("file", new Blob([buf], { type: contentType }), filename);
      const r = await call(base, { method: "POST", token: keys.token, body: fd });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (args.list === true) {
      const r = await call(base, { token: keys.token });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args.delete === "string") {
      await call(`${base}/${encodeURIComponent(args.delete)}`, { method: "DELETE", token: keys.token });
      console.log("deleted");
      return;
    }
    if (args.usage === true) {
      const r = await call(base, { token: keys.token });
      const u = r.usage;
      const mb = (n) => (n / 1024 / 1024).toFixed(2);
      console.log(`${mb(u.totalBytes)}MB / ${mb(u.limit)}MB (${(u.totalBytes * 100 / u.limit).toFixed(1)}%)`);
      return;
    }
    usage();
    process.exit(1);
  } catch (err) {
    console.error("[error]", err.message ?? err);
    process.exit(1);
  }
}

main();
