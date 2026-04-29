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
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
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

function readValue(args) {
  if (typeof args["value-file"] === "string") {
    const filePath = path.resolve(process.cwd(), args["value-file"]);
    if (!fs.existsSync(filePath)) {
      throw new Error(`--value-file not found: ${filePath}`);
    }
    const text = fs.readFileSync(filePath, "utf8");
    return JSON.parse(text);
  }
  if (typeof args.value === "string") {
    return JSON.parse(args.value);
  }
  if (args.value === true) {
    return null;
  }
  throw new Error("missing --value '<json>' or --value-file <path>");
}

function splitTableKey(combined) {
  const idx = combined.indexOf("/");
  if (idx < 0) throw new Error(`expected <table>/<key>, got: ${combined}`);
  const table = combined.slice(0, idx);
  const key = combined.slice(idx + 1);
  if (!table || !key) throw new Error(`expected <table>/<key>, got: ${combined}`);
  return { table, key };
}

function buildListUrl(base, table, { limit, after }) {
  const qs = new URLSearchParams();
  if (limit !== undefined && limit !== null) qs.set("limit", String(limit));
  if (after !== undefined && after !== null && after !== "") qs.set("after", String(after));
  const qsStr = qs.toString();
  return `${base}/${encodeURIComponent(table)}${qsStr ? `?${qsStr}` : ""}`;
}

async function listAll(base, table, limit) {
  const pageLimit = limit ? Math.min(Number(limit), 500) : 500;
  const all = [];
  let cursor = null;
  for (;;) {
    const url = buildListUrl(base, table, { limit: pageLimit, after: cursor });
    const page = await call(url);
    all.push(...page.records);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return { records: all, nextCursor: null, total: all.length };
}

function usage() {
  console.error(`usage:
  # Table management (owner token required)
  --list-tables
  --create-table <name> --permission <private|read-public|public>
  --update-permission <name> --permission <level>
  --delete-table <name>
  --export <table> --out <file.json>
  --import <table> --in <file.json>

  # Record CRUD (permission-aware)
  --get <table>/<key>
  --put <table>/<key>    (--value '<json>' | --value-file <path>)
  --patch <table>/<key>  (--value '<json>' | --value-file <path>)   # deep merge objects
  --incr <table>/<key> --field <name> [--by <N>]   # atomic increment (default by=1; negative OK)
  --post <table>         (--value '<json>' | --value-file <path>)   # auto-generated key
  --delete-record <table>/<key>
  --list <table> [--limit 100] [--after <key>] [--all]

  # Options
  --user <username>         # override auto-discovered username
  --value-file <path>       # read JSON value from file instead of --value
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const keys = loadKeys();
  const { dataApiBase } = await ensureUserInfo(keys, args);
  const base = dataApiBase;

  try {
    // ---------- Table management ----------
    if (args["list-tables"]) {
      const r = await call(`${base}/tables`, { token: keys.token });
      console.log(JSON.stringify(r, null, 2));
      return;
    }

    if (typeof args["create-table"] === "string") {
      if (typeof args.permission !== "string") {
        throw new Error("--create-table requires --permission <private|read-public|public>");
      }
      const r = await call(`${base}/tables`, {
        method: "POST",
        token: keys.token,
        body: { name: args["create-table"], permission: args.permission },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }

    if (typeof args["update-permission"] === "string") {
      if (typeof args.permission !== "string") {
        throw new Error("--update-permission requires --permission <private|read-public|public>");
      }
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

    if (typeof args.export === "string") {
      const table = args.export;
      const r = await call(`${base}/tables/${encodeURIComponent(table)}/export`, { token: keys.token });
      const out = typeof args.out === "string" ? path.resolve(process.cwd(), args.out) : null;
      const serialized = JSON.stringify(r, null, 2);
      if (out) {
        fs.writeFileSync(out, serialized + "\n", "utf8");
        const count = r && typeof r.records === "object" ? Object.keys(r.records).length : 0;
        console.error(`[info] exported ${count} records → ${out}`);
      } else {
        console.log(serialized);
      }
      return;
    }

    if (typeof args.import === "string") {
      const table = args.import;
      if (typeof args.in !== "string") {
        throw new Error("--import requires --in <file.json>");
      }
      const inPath = path.resolve(process.cwd(), args.in);
      if (!fs.existsSync(inPath)) {
        throw new Error(`--in not found: ${inPath}`);
      }
      const raw = JSON.parse(fs.readFileSync(inPath, "utf8"));
      // Accept either {records: {...}} (an export file) or a bare {key: value} map.
      const records = raw && typeof raw === "object" && raw.records && typeof raw.records === "object" && !Array.isArray(raw.records)
        ? raw.records
        : raw;
      if (!records || typeof records !== "object" || Array.isArray(records)) {
        throw new Error(`--in file must contain {records: {...}} or a {key: value} map`);
      }
      const r = await call(`${base}/tables/${encodeURIComponent(table)}/import`, {
        method: "POST",
        token: keys.token,
        body: { records },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }

    // ---------- Record CRUD ----------
    if (typeof args.get === "string") {
      const { table, key } = splitTableKey(args.get);
      const r = await call(`${base}/${encodeURIComponent(table)}/${encodeURIComponent(key)}`);
      console.log(JSON.stringify(r, null, 2));
      return;
    }

    if (typeof args.put === "string") {
      const { table, key } = splitTableKey(args.put);
      const value = readValue(args);
      const r = await call(`${base}/${encodeURIComponent(table)}/${encodeURIComponent(key)}`, {
        method: "PUT",
        token: keys.token,
        body: { value },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }

    if (typeof args.patch === "string") {
      const { table, key } = splitTableKey(args.patch);
      const value = readValue(args);
      const r = await call(`${base}/${encodeURIComponent(table)}/${encodeURIComponent(key)}`, {
        method: "PATCH",
        token: keys.token,
        body: { value },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }

    if (typeof args.incr === "string") {
      const { table, key } = splitTableKey(args.incr);
      if (typeof args.field !== "string" || args.field.length === 0) {
        throw new Error("--incr requires --field <name>");
      }
      const by = args.by === undefined ? 1 : Number(args.by);
      if (!Number.isFinite(by)) throw new Error("--by must be a finite number");
      const r = await call(`${base}/${encodeURIComponent(table)}/${encodeURIComponent(key)}/incr`, {
        method: "POST",
        body: { field: args.field, by },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }

    if (typeof args.post === "string") {
      const table = args.post;
      const value = readValue(args);
      const r = await call(`${base}/${encodeURIComponent(table)}`, {
        method: "POST",
        token: keys.token,
        body: { value },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }

    if (typeof args["delete-record"] === "string") {
      const { table, key } = splitTableKey(args["delete-record"]);
      await call(`${base}/${encodeURIComponent(table)}/${encodeURIComponent(key)}`, {
        method: "DELETE",
        token: keys.token,
      });
      console.log("deleted");
      return;
    }

    if (typeof args.list === "string") {
      const table = args.list;
      if (args.all === true) {
        const r = await listAll(base, table, args.limit);
        console.log(JSON.stringify(r, null, 2));
        return;
      }
      const url = buildListUrl(base, table, { limit: args.limit, after: args.after });
      const r = await call(url);
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
