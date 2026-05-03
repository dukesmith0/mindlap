// Read-only Supabase health checks. One verb covers every existing one-shot probe
// and gives a home for R20/R21 audits without growing the script count.
//
// Usage:
//   npm run db:doctor                       (= --counts, default summary)
//   npm run db:doctor -- --all
//   npm run db:doctor -- --extensions
//   npm run db:doctor -- --friend-code
//   npm run db:doctor -- --grants award_xp,eval_badges
//   npm run db:doctor -- --functions

import { runSql } from "./_lib/mgmt-api.mjs";

const argv = process.argv.slice(2);
const flags = new Set();
const args = new Map();

for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  const key = a.slice(2);
  const next = argv[i + 1];
  if (next && !next.startsWith("--")) {
    args.set(key, next);
    i += 1;
  } else {
    flags.add(key);
  }
}

const wantAll = flags.has("all");
const wantCounts = wantAll || flags.has("counts") || flags.size === 0 && args.size === 0;
const wantExtensions = wantAll || flags.has("extensions");
const wantFriendCode = wantAll || flags.has("friend-code");
const wantFunctions = wantAll || flags.has("functions");
const grantsArg = args.get("grants");

async function run(label, sql) {
  process.stdout.write(`> ${label} ... `);
  const result = await runSql(sql);
  if (!result.ok) {
    console.log(`FAIL ${result.status}`);
    console.error(result.body);
    return null;
  }
  console.log("ok");
  console.log(JSON.stringify(result.rows, null, 2));
  return result.rows;
}

if (wantCounts) {
  await run(
    "counts (tables / policies / triggers / RPCs / seeded rows)",
    `select
      (select count(*)::int from public.games) as games,
      (select count(*)::int from public.badges) as badges,
      (select count(*)::int from pg_policies where schemaname='public') as policies,
      (select count(*)::int from pg_trigger where tgname='on_auth_user_created') as auth_trigger,
      (select count(*)::int from pg_proc where proname='find_user_by_friend_code') as friend_lookup_rpc,
      (select count(*)::int from information_schema.tables where table_schema='public') as tables;`
  );
}

if (wantExtensions) {
  await run(
    "extensions (pgcrypto / citext / pgjwt schemas)",
    `select extname, extnamespace::regnamespace::text as schema
       from pg_extension
       where extname in ('pgcrypto','citext','pgjwt')
       order by extname;`
  );
}

if (wantFriendCode) {
  await run(
    "friend code generator",
    `select public.generate_friend_code() as code;`
  );
}

if (grantsArg) {
  const fns = grantsArg.split(",").map(s => s.trim()).filter(Boolean);
  const list = fns.map(f => `'${f.replace(/'/g, "''")}'`).join(", ");
  await run(
    `grants on ${fns.join(", ")} (R20 audit)`,
    `select n.nspname as schema, p.proname as function, r.rolname as grantee, a.privilege_type
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a on true
       join pg_roles r on r.oid = a.grantee
       where p.proname in (${list})
         and a.privilege_type = 'EXECUTE'
       order by p.proname, r.rolname;`
  );
}

if (wantFunctions) {
  await run(
    "SECURITY DEFINER functions + search_path (R21 audit)",
    `select n.nspname as schema,
            p.proname as function,
            p.prosecdef as security_definer,
            coalesce(
              (select string_agg(c, ',') from unnest(p.proconfig) c where c like 'search_path=%'),
              '(unset)'
            ) as search_path
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.prosecdef = true
       order by p.proname;`
  );
}
