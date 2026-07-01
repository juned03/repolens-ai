import { defineConfig } from "drizzle-kit";

import { env } from "./config/env";

export default defineConfig({
  dialect: "sqlite",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dbCredentials: {
    url: env.databaseUrl,
  },
});
