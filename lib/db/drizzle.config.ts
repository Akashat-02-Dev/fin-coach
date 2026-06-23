import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const connectionString = process.env.DATABASE_URL;
let cleanedUrl = connectionString;
try {
  const parsed = new URL(connectionString);
  if (parsed.searchParams.get("sslmode") === "require") {
    parsed.searchParams.set("sslmode", "no-verify");
    cleanedUrl = parsed.toString();
  }
} catch (e) {
  // Fallback
}

console.log("Original connectionString:", connectionString ? connectionString.replace(/:[^:@]+@/, ":****@") : "undefined");
console.log("Cleaned URL for drizzle-kit:", cleanedUrl ? cleanedUrl.replace(/:[^:@]+@/, ":****@") : "undefined");

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanedUrl,
  },
});



