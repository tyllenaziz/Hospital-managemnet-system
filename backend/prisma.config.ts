import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ||
  `mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || "3306"}/${process.env.DB_NAME}`;

export default defineConfig({
  schema: "./prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "./prisma/migrations",
    seed: "node scripts/prisma-seed.js",
  },
});
