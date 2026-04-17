#!/usr/bin/env node
// clawpage-skill/scripts/clawpages_data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, "..");
const DEFAULT_API_HOST = "https://api.clawpage.ai";

function parseArgs(argv) {
  const args = { envSet: [], envDelete: [] };
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

function loadKeys() {
  const candidates = [
    path.join(skillRoot, "keys.local.json"),
    path.join(process.cwd(), "keys.local.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const obj = JSON.parse(fs.readFileSync(p, "utf8"));
      const token = obj?.clawpage?.token ?? obj?.clawpages?.token ?? obj?.token;
      const apiHost = obj?.clawpage?.apiHost ?? obj?.clawpages?.apiHost ?? DEFAULT_API_HOST;
      if (!token) throw new Error("token missing in keys.local.json");
      return { token, apiHost };
    }
  }
  throw new Error("keys.local.json not found (checked skill root and cwd)");
}

async function call(apiHost, method, pathname, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${apiHost}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
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

function usage() {
  console.error(`usage:
  --list-tables
  --create-table <name> --permission <private|read-public|public>
  --update-permission <name> --permission <level>
  --delete-table <name>
  --get <username>/<table>/<key>
  --put <username>/<table>/<key> --value '<json>'
  --delete-record <username>/<table>/<key>
  --list <username>/<table> [--limit 100] [--after <key>]
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const { token, apiHost } = loadKeys();

  try {
    if (args["list-tables"]) {
      const r = await call(apiHost, "GET", "/api/data/tables", { token });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["create-table"] === "string") {
      const r = await call(apiHost, "POST", "/api/data/tables", {
        token,
        body: { name: args["create-table"], permission: args.permission },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["update-permission"] === "string") {
      const r = await call(apiHost, "PATCH", `/api/data/tables/${encodeURIComponent(args["update-permission"])}`, {
        token,
        body: { permission: args.permission },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["delete-table"] === "string") {
      await call(apiHost, "DELETE", `/api/data/tables/${encodeURIComponent(args["delete-table"])}`, { token });
      console.log("deleted");
      return;
    }
    if (typeof args.get === "string") {
      const [username, table, key] = args.get.split("/");
      const r = await call(apiHost, "GET", `/api/data/${username}/${table}/${encodeURIComponent(key)}`);
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args.put === "string") {
      const [username, table, key] = args.put.split("/");
      const value = args.value === undefined ? null : JSON.parse(args.value);
      const r = await call(apiHost, "PUT", `/api/data/${username}/${table}/${encodeURIComponent(key)}`, {
        token,
        body: { value },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["delete-record"] === "string") {
      const [username, table, key] = args["delete-record"].split("/");
      await call(apiHost, "DELETE", `/api/data/${username}/${table}/${encodeURIComponent(key)}`, { token });
      console.log("deleted");
      return;
    }
    if (typeof args.list === "string") {
      const [username, table] = args.list.split("/");
      const limit = args.limit ? `&limit=${encodeURIComponent(args.limit)}` : "";
      const after = args.after ? `&after=${encodeURIComponent(args.after)}` : "";
      const r = await call(apiHost, "GET", `/api/data/${username}/${table}?1=1${limit}${after}`);
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
