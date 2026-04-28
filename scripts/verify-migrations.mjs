import { readFile } from "node:fs/promises";

const env = await readFile(".env", "utf8");
const token = env.split(/\r?\n/).map(l => l.trim())
  .find(l => l.startsWith("SUPABASE_ACCESS_TOKEN="))
  ?.slice("SUPABASE_ACCESS_TOKEN=".length).replace(/^["']|["']$/g, "");

const res = await fetch("https://api.supabase.com/v1/projects/nookxuvlvwtppitqguxf/database/query", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `select
      (select count(*)::int from public.games) as games,
      (select count(*)::int from public.badges) as badges,
      (select count(*)::int from pg_policies where schemaname='public') as policies,
      (select count(*)::int from pg_trigger where tgname='on_auth_user_created') as auth_trigger,
      (select count(*)::int from pg_proc where proname='find_user_by_friend_code') as friend_lookup_rpc,
      (select count(*)::int from information_schema.tables where table_schema='public') as tables;`,
  }),
});
console.log(res.status, await res.text());
