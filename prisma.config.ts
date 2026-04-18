import { defineConfig } from "prisma/config";

// Build the connection URL used by Prisma CLI commands (db push, migrate, etc.)
// - Local dev:  DATABASE_URL=file:./prisma/dev.db   (no auth token needed)
// - Production: DATABASE_URL=libsql://[db].turso.io  TURSO_AUTH_TOKEN=...
function connectionUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const token = process.env.TURSO_AUTH_TOKEN;

  // Embed auth token in URL for Turso remote databases
  if (token && url.startsWith("libsql://")) {
    return `${url}?authToken=${encodeURIComponent(token)}`;
  }

  return url;
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: connectionUrl(),
  },
});
