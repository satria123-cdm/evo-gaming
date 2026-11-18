#!/usr/bin/env node
/**
 * Tiny migration runner. Applies drizzle/*.sql in filename order and records
 * each file in `_evo_migrations` so re-runs are safe.
 *
 * Usage: npm run db:migrate  (loads DATABASE_URL from .env.local)
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5433/evo_gaming";

const migrationsDir = path.join(process.cwd(), "drizzle");
const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const client = new Client({ connectionString });
await client.connect();

await client.query(`
  create table if not exists _evo_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

const { rows } = await client.query("select name from _evo_migrations");
const applied = new Set(rows.map((row) => row.name));

let appliedCount = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip    ${file}`);
    continue;
  }

  const sqlText = readFileSync(path.join(migrationsDir, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sqlText);
    await client.query("insert into _evo_migrations (name) values ($1)", [file]);
    await client.query("commit");
    appliedCount += 1;
    console.log(`applied ${file}`);
  } catch (error) {
    await client.query("rollback");
    console.error(`failed  ${file}\n${error.message}`);
    process.exitCode = 1;
    break;
  }
}

await client.end();
console.log(
  appliedCount === 0 ? "Database sudah terbaru." : `${appliedCount} migration diterapkan.`,
);
