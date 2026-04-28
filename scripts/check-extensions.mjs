import { readFile } from "node:fs/promises";
const env = await readFile(".env", "utf8");
const token = env.split(/\r?\n/).map(l => l.trim())
  .find(l => l.startsWith("SUPABASE_ACCESS_TOKEN="))
  ?.slice("SUPABASE_ACCESS_TOKEN=".length).replace(/^["']|["']$/g, "");
const res = await fetch("https://api.supabase.com/v1/projects/nookxuvlvwtppitqguxf/database/query", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: "select extname, extnamespace::regnamespace as schema from pg_extension where extname in ('pgcrypto','citext','pgjwt');" }),
});
console.log(res.status, await res.text());
