import { pgTable, serial, text, numeric, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// Accounts Table
export const accountsTable = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  institutionName: text("institution_name").notNull(),
  accountType: text("account_type").notNull(), // checking, savings, credit_card, mortgage, auto_loan
  encryptedAccountMask: text("encrypted_account_mask").notNull(), // encrypted ****1234
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
});

export const insertAccountSchema = createInsertSchema(accountsTable).omit({
  id: true,
  userId: true,
});
export const selectAccountSchema = createSelectSchema(accountsTable);

export type Account = typeof accountsTable.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

// Investments Table
export const investmentsTable = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  assetClass: text("asset_class").notNull(), // mutual_funds, stocks, etfs, bonds, real_estate
  tickerSymbol: text("ticker_symbol"), // optional
  currentValue: numeric("current_value", { precision: 14, scale: 2 }).notNull(),
  costBasis: numeric("cost_basis", { precision: 14, scale: 2 }).notNull(),
});

export const insertInvestmentSchema = createInsertSchema(investmentsTable).omit({
  id: true,
  userId: true,
});
export const selectInvestmentSchema = createSelectSchema(investmentsTable);

export type Investment = typeof investmentsTable.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;

// Insurance Policies Table
export const insurancePoliciesTable = pgTable("insurance_policies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  policyType: text("policy_type").notNull(), // life, health, auto, home
  coverageAmount: numeric("coverage_amount", { precision: 14, scale: 2 }).notNull(),
  monthlyPremium: numeric("monthly_premium", { precision: 14, scale: 2 }).notNull(),
});

export const insertInsurancePolicySchema = createInsertSchema(insurancePoliciesTable).omit({
  id: true,
  userId: true,
});
export const selectInsurancePolicySchema = createSelectSchema(insurancePoliciesTable);

export type InsurancePolicy = typeof insurancePoliciesTable.$inferSelect;
export type InsertInsurancePolicy = z.infer<typeof insertInsurancePolicySchema>;

// Transactions Table
export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  userId: true,
});
export const selectTransactionSchema = createSelectSchema(transactionsTable);

export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
