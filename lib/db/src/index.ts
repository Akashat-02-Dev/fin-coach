import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

let cleanedConnectionString = connectionString;
try {
  const parsedUrl = new URL(connectionString);
  if (parsedUrl.searchParams.has("sslmode")) {
    parsedUrl.searchParams.delete("sslmode");
    cleanedConnectionString = parsedUrl.toString();
  }
} catch (e) {
  // Fallback if DATABASE_URL is not a valid URL structure
}

export const pool = new Pool({
  connectionString: cleanedConnectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });

export * from "./schema";

