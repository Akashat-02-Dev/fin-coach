import { pgTable, serial, date, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const netWorthEntriesTable = pgTable("net_worth_entries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  assets: numeric("assets", { precision: 14, scale: 2 }).notNull(),
  liabilities: numeric("liabilities", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNetWorthEntrySchema = createInsertSchema(netWorthEntriesTable).omit({ id: true, createdAt: true });
export type InsertNetWorthEntry = z.infer<typeof insertNetWorthEntrySchema>;
export type NetWorthEntry = typeof netWorthEntriesTable.$inferSelect;
