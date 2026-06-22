import { pgTable, serial, numeric, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  targetSavingsRate: numeric("target_savings_rate", { precision: 8, scale: 4 }),
  targetMonthlySavings: numeric("target_monthly_savings", { precision: 12, scale: 2 }),
  targetDebtPayoffMonths: integer("target_debt_payoff_months"),
  targetEmergencyFundMonths: integer("target_emergency_fund_months"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, updatedAt: true, userId: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
