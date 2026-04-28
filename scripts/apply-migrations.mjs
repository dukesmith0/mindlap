import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ENV_PATH = resolve(".env");
const PROJECT_REF = "nookxuvlvwtppitqguxf";
const ARG_FILES = process.argv.slice(2);
const DEFAULT_FILES = [
  "supabase/migrations/0001_init.sql",
  "supabase/migrations/0002_handle_new_user.sql",
  "supabase/migrations/0003_rls_policies.sql",
  "supabase/migrations/0004_friend_code_privacy.sql",
  "supabase/seed.sql",
];
const FILES = ARG_FILES.length ? ARG_FILES : DEFAULT_FILES;

const env = await readFile(ENV_PATH, "utf8");
const token = env
  .split(/\r?\n/)
  .map(l => l.trim())
  .find(l => l.startsWith("SUPABASE_ACCESS_TOKEN="))
  ?.slice("SUPABASE_ACCESS_TOKEN=".length)
  .replace(/^["']|["']$/g, "");

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN not found in .env");
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

for (const file of FILES) {
  const sql = await readFile(file, "utf8");
  process.stdout.write(`> ${file} (${sql.length} bytes) ... `);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.log(`FAIL ${res.status}`);
    console.error(text);
    process.exit(1);
  }
  console.log("ok");
}
console.log("all migrations applied");
