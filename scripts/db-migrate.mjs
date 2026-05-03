// Apply Supabase migrations via the Mgmt API.
// Usage:
//   npm run db:migrate -- supabase/migrations/0014_xxx.sql
//   npm run db:migrate -- supabase/migrations/0014_a.sql supabase/migrations/0015_b.sql
//   npm run db:migrate                      (no args = no-op; pass files explicitly)

import { readFile } from "node:fs/promises";
import { runSql } from "./_lib/mgmt-api.mjs";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: npm run db:migrate -- <file.sql> [...more.sql]");
  process.exit(2);
}

for (const file of files) {
  const sql = await readFile(file, "utf8");
  process.stdout.write(`> ${file} (${sql.length} bytes) ... `);
  const result = await runSql(sql);
  if (!result.ok) {
    console.log(`FAIL ${result.status}`);
    console.error(result.body);
    process.exit(1);
  }
  console.log("ok");
}
console.log(`applied ${files.length} migration${files.length === 1 ? "" : "s"}`);
