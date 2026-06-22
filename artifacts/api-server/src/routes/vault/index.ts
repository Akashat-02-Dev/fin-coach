import { Router } from "express";
import { db, accountsTable, investmentsTable, insurancePoliciesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateVaultAccountBody,
  CreateVaultInvestmentBody,
  CreateVaultInsurancePolicyBody,
} from "@workspace/api-zod";
import { requireAuth } from "../../middlewares/auth";
import { encrypt, decrypt } from "../../lib/encryption";

const router = Router();

// ==========================================
// Accounts Endpoints
// ==========================================

router.get("/vault/accounts", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const accounts = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.userId, userId));

    const decryptedAccounts = accounts.map((acc) => {
      let mask = acc.encryptedAccountMask;
      try {
        mask = decrypt(acc.encryptedAccountMask);
      } catch (err) {
        console.error("Failed to decrypt account mask for ID:", acc.id);
      }
      return {
        id: acc.id,
        institutionName: acc.institutionName,
        accountType: acc.accountType,
        encryptedAccountMask: mask,
        currentBalance: parseFloat(acc.currentBalance),
        interestRate: parseFloat(acc.interestRate),
      };
    });

    res.json(decryptedAccounts);
  } catch (err) {
    console.error("GET vault accounts error:", err);
    res.status(500).json({ error: "An unexpected error occurred while fetching accounts" });
  }
});

router.post("/vault/accounts", requireAuth, async (req: any, res: any) => {
  const parsed = CreateVaultAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const userId = req.user!.id;
    const { institutionName, accountType, encryptedAccountMask, currentBalance, interestRate } = parsed.data;

    // Encrypt sensitive fields
    const cipherMask = encrypt(encryptedAccountMask);

    const [newAccount] = await db
      .insert(accountsTable)
      .values({
        userId,
        institutionName,
        accountType,
        encryptedAccountMask: cipherMask,
        currentBalance: currentBalance.toString(),
        interestRate: interestRate.toString(),
      })
      .returning();

    res.status(201).json({
      id: newAccount.id,
      institutionName: newAccount.institutionName,
      accountType: newAccount.accountType,
      encryptedAccountMask, // Return cleartext to frontend
      currentBalance: parseFloat(newAccount.currentBalance),
      interestRate: parseFloat(newAccount.interestRate),
    });
  } catch (err) {
    console.error("POST vault account error:", err);
    res.status(500).json({ error: "An unexpected error occurred while creating vault account" });
  }
});

router.delete("/vault/accounts/:id", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const accountId = parseInt(req.params.id, 10);

    if (isNaN(accountId)) {
      res.status(400).json({ error: "Invalid account ID" });
      return;
    }

    const [deleted] = await db
      .delete(accountsTable)
      .where(and(eq(accountsTable.id, accountId), eq(accountsTable.userId, userId)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Vault account not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    console.error("DELETE vault account error:", err);
    res.status(500).json({ error: "An unexpected error occurred while deleting vault account" });
  }
});

// ==========================================
// Investments Endpoints
// ==========================================

router.get("/vault/investments", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const investments = await db
      .select()
      .from(investmentsTable)
      .where(eq(investmentsTable.userId, userId));

    const formattedInvestments = investments.map((inv) => ({
      id: inv.id,
      assetClass: inv.assetClass,
      tickerSymbol: inv.tickerSymbol || null,
      currentValue: parseFloat(inv.currentValue),
      costBasis: parseFloat(inv.costBasis),
    }));

    res.json(formattedInvestments);
  } catch (err) {
    console.error("GET vault investments error:", err);
    res.status(500).json({ error: "An unexpected error occurred while fetching investments" });
  }
});

router.post("/vault/investments", requireAuth, async (req: any, res: any) => {
  const parsed = CreateVaultInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const userId = req.user!.id;
    const { assetClass, tickerSymbol, currentValue, costBasis } = parsed.data;

    const [newInvestment] = await db
      .insert(investmentsTable)
      .values({
        userId,
        assetClass,
        tickerSymbol: tickerSymbol || null,
        currentValue: currentValue.toString(),
        costBasis: costBasis.toString(),
      })
      .returning();

    res.status(201).json({
      id: newInvestment.id,
      assetClass: newInvestment.assetClass,
      tickerSymbol: newInvestment.tickerSymbol,
      currentValue: parseFloat(newInvestment.currentValue),
      costBasis: parseFloat(newInvestment.costBasis),
    });
  } catch (err) {
    console.error("POST vault investment error:", err);
    res.status(500).json({ error: "An unexpected error occurred while creating investment" });
  }
});

router.delete("/vault/investments/:id", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const investmentId = parseInt(req.params.id, 10);

    if (isNaN(investmentId)) {
      res.status(400).json({ error: "Invalid investment ID" });
      return;
    }

    const [deleted] = await db
      .delete(investmentsTable)
      .where(and(eq(investmentsTable.id, investmentId), eq(investmentsTable.userId, userId)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Investment not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    console.error("DELETE vault investment error:", err);
    res.status(500).json({ error: "An unexpected error occurred while deleting investment" });
  }
});

// ==========================================
// Insurance Endpoints
// ==========================================

router.get("/vault/insurance", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const insurance = await db
      .select()
      .from(insurancePoliciesTable)
      .where(eq(insurancePoliciesTable.userId, userId));

    const formattedInsurance = insurance.map((pol) => ({
      id: pol.id,
      policyType: pol.policyType,
      coverageAmount: parseFloat(pol.coverageAmount),
      monthlyPremium: parseFloat(pol.monthlyPremium),
    }));

    res.json(formattedInsurance);
  } catch (err) {
    console.error("GET vault insurance error:", err);
    res.status(500).json({ error: "An unexpected error occurred while fetching insurance policies" });
  }
});

router.post("/vault/insurance", requireAuth, async (req: any, res: any) => {
  const parsed = CreateVaultInsurancePolicyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const userId = req.user!.id;
    const { policyType, coverageAmount, monthlyPremium } = parsed.data;

    const [newPolicy] = await db
      .insert(insurancePoliciesTable)
      .values({
        userId,
        policyType,
        coverageAmount: coverageAmount.toString(),
        monthlyPremium: monthlyPremium.toString(),
      })
      .returning();

    res.status(201).json({
      id: newPolicy.id,
      policyType: newPolicy.policyType,
      coverageAmount: parseFloat(newPolicy.coverageAmount),
      monthlyPremium: parseFloat(newPolicy.monthlyPremium),
    });
  } catch (err) {
    console.error("POST vault insurance error:", err);
    res.status(500).json({ error: "An unexpected error occurred while creating insurance policy" });
  }
});

router.delete("/vault/insurance/:id", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const policyId = parseInt(req.params.id, 10);

    if (isNaN(policyId)) {
      res.status(400).json({ error: "Invalid policy ID" });
      return;
    }

    const [deleted] = await db
      .delete(insurancePoliciesTable)
      .where(and(eq(insurancePoliciesTable.id, policyId), eq(insurancePoliciesTable.userId, userId)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Insurance policy not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    console.error("DELETE vault insurance error:", err);
    res.status(500).json({ error: "An unexpected error occurred while deleting insurance policy" });
  }
});

export default router;
