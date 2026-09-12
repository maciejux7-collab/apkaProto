import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: connectionString ? {
    url: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  } : {
    host: process.env.SQL_HOST || '',
    user: process.env.SQL_ADMIN_USER || '',
    password: process.env.SQL_ADMIN_PASSWORD || '',
    database: process.env.SQL_DB_NAME || '',
    ssl: false,
  },
  verbose: true,
});
