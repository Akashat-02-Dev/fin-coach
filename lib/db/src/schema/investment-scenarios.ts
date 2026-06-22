import { pgTable, serial, text, numeric, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const investmentScenariosTable = pgTable("investment_scenarios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  scenarioName: text("scenario_name").notNull(),
  investmentType: text("investment_type").notNull(), // flexible string e.g. 'lumpsum', 'monthly_sip', 'swp'
  principalAmount: numeric("principal_amount", { precision: 14, scale: 2 }).notNull(),
  durationYears: integer("duration_years").notNull(),
  metaData: jsonb("meta_data"), // future-proofing for dynamic SWP / dividend inputs
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvestmentScenarioSchema = createInsertSchema(investmentScenariosTable).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const selectInvestmentScenarioSchema = createSelectSchema(investmentScenariosTable);

export type InvestmentScenario = typeof investmentScenariosTable.$inferSelect;
export type InsertInvestmentScenario = z.infer<typeof insertInvestmentScenarioSchema>;
