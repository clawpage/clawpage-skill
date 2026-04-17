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

function keysPath() {
  for (const p of [path.join(skillRoot, "keys.local.json"), path.join(process.cwd(), "keys.local.json")]) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("keys.local.json not found (checked skill root and cwd)");
}

function loadKeys() {
  const p = keysPath();
  const obj = JSON.parse(fs.readFileSync(p, "utf8"));
  const token = obj?.clawpage?.token ?? obj?.clawpages?.token ?? obj?.token;
  const apiHost = obj?.clawpage?.apiHost ?? obj?.clawpages?.apiHost ?? DEFAULT_API_HOST;
  const username = obj?.clawpage?.username ?? obj?.clawpages?.username ?? null;
  const dataApiBase = obj?.clawpage?.dataApiBase ?? obj?.clawpages?.dataApiBase ?? null;
  if (!token) throw new Error("token missing in keys.local.json");
  return { token, apiHost, username, dataApiBase, keysFilePath: p, raw: obj };
}

function saveUserInfo({ keysFilePath, raw }, { username, dataApiBase }) {
  const updated = { ...raw };
  updated.clawpage = { ...(updated.clawpage || {}), username, dataApiBase };
  fs.writeFileSync(keysFilePath, JSON.stringify(updated, null, 2) + "\n", "utf8");
}

async function call(url, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  if (!r.ok) {
    const msg = typeof parsed === "object" && parsed && parsed.message
      ? `${r.status} ${parsed.error || ""}: ${parsed.message}`
      : `${r.status} ${text}`;
    throw new Error(msg);
  }
  return parsed;
}

async function ensureUserInfo(keys, args) {
  let username = args.user ?? keys.username;
  let dataApiBase = keys.dataApiBase;
  if (!username || !dataApiBase) {
    const me = await call(`${keys.apiHost}/api/me`, { token: keys.token });
    username = me.username;
    dataApiBase = me.dataApiBase;
    saveUserInfo(keys, { username, dataApiBase });
    console.error(`[info] cached username=${username} → keys.local.json`);
  }
  return { username, dataApiBase };
}

function usage() {
  console.error(`usage:
  --list-tables
  --create-table <name> --permission <private|read-public|public>
  --update-permission <name> --permission <level>
  --delete-table <name>
  --get <table>/<key>
  --put <table>/<key> --value '<json>'
  --delete-record <table>/<key>
  --list <table> [--limit 100] [--after <key>]
  --user <username>           # override auto-discovered username
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const keys = loadKeys();
  const { dataApiBase } = await ensureUserInfo(keys, args);
  const base = dataApiBase;

  try {
    if (args["list-tables"]) {
      const r = await call(`${base}/tables`, { token: keys.token });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["create-table"] === "string") {
      const r = await call(`${base}/tables`, {
        method: "POST",
        token: keys.token,
        body: { name: args["create-table"], permission: args.permission },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["update-permission"] === "string") {
      const r = await call(`${base}/tables/${encodeURIComponent(args["update-permission"])}`, {
        method: "PATCH",
        token: keys.token,
        body: { permission: args.permission },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["delete-table"] === "string") {
      await call(`${base}/tables/${encodeURIComponent(args["delete-table"])}`, {
        method: "DELETE",
        token: keys.token,
      });
      console.log("deleted");
      return;
    }
    if (typeof args.get === "string") {
      const [table, key] = args.get.split("/");
      const r = await call(`${base}/${encodeURIComponent(table)}/${encodeURIComponent(key)}`);
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args.put === "string") {
      const [table, key] = args.put.split("/");
      const value = args.value === undefined ? null : JSON.parse(args.value);
      const r = await call(`${base}/${encodeURIComponent(table)}/${encodeURIComponent(key)}`, {
        method: "PUT",
        token: keys.token,
        body: { value },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["delete-record"] === "string") {
      const [table, key] = args["delete-record"].split("/");
      await call(`${base}/${encodeURIComponent(table)}/${encodeURIComponent(key)}`, {
        method: "DELETE",
        token: keys.token,
      });
      console.log("deleted");
      return;
    }
    if (typeof args.list === "string") {
      const limit = args.limit ? `&limit=${encodeURIComponent(args.limit)}` : "";
      const after = args.after ? `&after=${encodeURIComponent(args.after)}` : "";
      const r = await call(`${base}/${encodeURIComponent(args.list)}?1=1${limit}${after}`);
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
