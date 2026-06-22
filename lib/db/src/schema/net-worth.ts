import { pgTable, serial, date, numeric, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const netWorthEntriesTable = pgTable("net_worth_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  assets: numeric("assets", { precision: 14, scale: 2 }).notNull(),
  liabilities: numeric("liabilities", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNetWorthEntrySchema = createInsertSchema(netWorthEntriesTable).omit({ id: true, createdAt: true, userId: true });
export type InsertNetWorthEntry = z.infer<typeof insertNetWorthEntrySchema>;
export type NetWorthEntry = typeof netWorthEntriesTable.$inferSelect;
