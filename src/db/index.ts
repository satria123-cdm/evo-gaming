import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Next dev/HMR re-evaluates modules, so keep one pool per process.
 * `globalThis` caching prevents connection leaks during hot reload.
 */
const globalForDb = globalThis as unknown as {
  evoPool?: Pool;
};

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5433/evo_gaming";

export const pool =
  globalForDb.evoPool ??
  new Pool({
    connectionString,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.evoPool = pool;
}

export const db = drizzle({ client: pool, schema });
