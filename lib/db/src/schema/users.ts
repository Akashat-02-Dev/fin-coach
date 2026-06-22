import { pgTable, serial, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  employmentStatus: text("employment_status"),
  annualIncomeRange: text("annual_income_range"),
  riskTolerance: text("risk_tolerance"),
  baseCurrency: text("base_currency"),
  razorpayCustomerId: text("razorpay_customer_id").unique(),
  razorpaySubscriptionId: text("razorpay_subscription_id").unique(),
  subscriptionStatus: text("subscription_status").$type<"created" | "active" | "halted" | "cancelled" | "completed" | "expired">().default("expired"),
  subscriptionTier: text("subscription_tier").$type<"free" | "premium">().default("free"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(usersTable);

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

/**
 * Calculates the user's 15-day free trial status.
 */
export function getTrialStatus(createdAt: Date) {
  const trialDurationMs = 15 * 24 * 60 * 60 * 1000;
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsedMs = now - createdTime;

  const remainingMs = trialDurationMs - elapsedMs;
  // Use Math.ceil so a partial day (e.g. 14.2 days remaining) shows as 15 days
  const trialDaysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  const isTrialExpired = elapsedMs > trialDurationMs;

  return {
    trialDaysRemaining,
    isTrialExpired,
  };
}
