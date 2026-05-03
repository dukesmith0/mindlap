// Run a seed SQL file via the Mgmt API.
// Built-in seeds live in scripts/seeds/<name>.sql.
//
// Usage:
//   npm run db:seed                          (= walkthrough, default)
//   npm run db:seed -- walkthrough
//   npm run db:seed -- --file path/to.sql

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runSql } from "./_lib/mgmt-api.mjs";

const argv = process.argv.slice(2);
let target = null;

for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === "--file") {
    target = argv[i + 1];
    i += 1;
  } else if (!a.startsWith("--")) {
    target = resolve("scripts/seeds", `${a}.sql`);
  }
}

if (!target) {
  target = resolve("scripts/seeds/walkthrough.sql");
}

const sql = await readFile(target, "utf8").catch(err => {
  console.error(`[db-seed] cannot read ${target}: ${err.message}`);
  process.exit(1);
});

process.stdout.write(`> seeding from ${target} (${sql.length} bytes) ... `);
const result = await runSql(sql);
if (!result.ok) {
  console.log(`FAIL ${result.status}`);
  console.error(result.body);
  process.exit(1);
}
console.log("ok");
console.log(JSON.stringify(result.rows, null, 2));
