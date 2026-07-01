import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { env } from "@/config/env";

import * as schema from "./schema";

function createSqliteConnection(): Database.Database {
  mkdirSync(dirname(env.databaseUrl), { recursive: true });

  const sqlite = new Database(env.databaseUrl);

  sqlite.pragma("foreign_keys = ON");

  return sqlite;
}

type DatabaseInstance = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  sqlite?: Database.Database;
  db?: DatabaseInstance;
};

const sqlite = globalForDb.sqlite ?? createSqliteConnection();
const db: DatabaseInstance = globalForDb.db ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
  globalForDb.db = db;
}

export { db };
export type { DatabaseInstance };
