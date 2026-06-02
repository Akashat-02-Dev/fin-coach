import { pgTable, serial, timestamp, integer, numeric, text, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }).notNull(),
  dependants: integer("dependants").notNull().default(0),
  totalExpenses: numeric("total_expenses", { precision: 12, scale: 2 }).notNull(),
  totalDebt: numeric("total_debt", { precision: 12, scale: 2 }),
  savingsRate: numeric("savings_rate", { precision: 8, scale: 4 }),
  inputData: jsonb("input_data").notNull(),
  budgetAnalysis: jsonb("budget_analysis").notNull(),
  savingsStrategy: jsonb("savings_strategy").notNull(),
  debtReduction: jsonb("debt_reduction").notNull(),
  notes: text("notes"),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
