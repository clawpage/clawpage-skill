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
  const homeUrl = obj?.clawpage?.homeUrl ?? obj?.clawpages?.homeUrl ?? null;
  if (!token) throw new Error("token missing in keys.local.json");
  return { token, apiHost, username, homeUrl, keysFilePath: p, raw: obj };
}

function saveUserInfo({ keysFilePath, raw }, { username, homeUrl, dataApiBase }) {
  const updated = { ...raw };
  updated.clawpage = { ...(updated.clawpage || {}), username, homeUrl, dataApiBase };
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

async function ensureHomeUrl(keys) {
  if (keys.homeUrl && keys.username) return { username: keys.username, homeUrl: keys.homeUrl };
  const me = await call(`${keys.apiHost}/api/me`, { token: keys.token });
  saveUserInfo(keys, { username: me.username, homeUrl: me.homeUrl, dataApiBase: me.dataApiBase });
  console.error(`[info] cached username=${me.username} → keys.local.json`);
  return { username: me.username, homeUrl: me.homeUrl };
}

function usage() {
  console.error(`usage:
  --create <target>         create a short link (target must be *.clawpage.ai URL)
  --list                    list my short links
  --update <slug> <target>  update target (provide two bare args after flag isn't supported — use --slug / --target)
  --update-slug <slug> --target <url>
  --delete <slug>
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const keys = loadKeys();
  const { homeUrl } = await ensureHomeUrl(keys);
  const base = `${homeUrl}/api/links`;

  try {
    if (typeof args.create === "string") {
      const r = await call(base, { method: "POST", token: keys.token, body: { target: args.create } });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (args.list === true) {
      const r = await call(base, { token: keys.token });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args["update-slug"] === "string") {
      if (typeof args.target !== "string") throw new Error("--update-slug requires --target <url>");
      const r = await call(`${base}/${encodeURIComponent(args["update-slug"])}`, {
        method: "PATCH",
        token: keys.token,
        body: { target: args.target },
      });
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    if (typeof args.delete === "string") {
      await call(`${base}/${encodeURIComponent(args.delete)}`, { method: "DELETE", token: keys.token });
      console.log("deleted");
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
