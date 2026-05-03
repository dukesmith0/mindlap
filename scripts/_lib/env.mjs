// Shared env loader. Reads `.env.local` only (CLAUDE.md rule).
// Lazy: parses on first call, caches the map for the process.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

let cache = null;

async function load() {
  if (cache) return cache;
  const text = await readFile(resolve(".env.local"), "utf8").catch(() => "");
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    map.set(key, raw);
  }
  cache = map;
  return cache;
}

export async function get(key) {
  const map = await load();
  return map.get(key) ?? null;
}

export async function required(key) {
  const value = await get(key);
  if (!value) {
    console.error(`[env] missing ${key} in .env.local`);
    process.exit(1);
  }
  return value;
}
