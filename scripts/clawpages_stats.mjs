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

async function call(url, { method = "GET", token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { method, headers });
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
  --overview
  --page <name>   [--days 30]
  --home          [--days 30]
  --link <slug>   [--days 30]
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const keys = loadKeys();
  const { homeUrl } = await ensureHomeUrl(keys);
  const base = `${homeUrl}/api/stats`;
  const days = args.days ? `?days=${encodeURIComponent(args.days)}` : "";
  try {
    if (args.overview === true) {
      const r = await call(base, { token: keys.token });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args.page === "string") {
      const r = await call(`${base}/pages/${encodeURIComponent(args.page)}${days}`, { token: keys.token });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (args.home === true) {
      const r = await call(`${base}/home${days}`, { token: keys.token });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args.link === "string") {
      const r = await call(`${base}/links/${encodeURIComponent(args.link)}${days}`, { token: keys.token });
      console.log(JSON.stringify(r, null, 2));
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
