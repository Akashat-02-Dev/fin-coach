import { Router } from "express";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { RunAnalysisBody } from "@workspace/api-zod";
import { desc, eq, avg, count } from "drizzle-orm";
import { runFinancialAnalysis } from "../../lib/financial-agents";
import parseCsvRouter from "./parse-csv";
import insightsRouter from "./insights";

const router = Router();

router.post("/analysis/run", async (req, res) => {
  const parsed = RunAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;

  try {
    const result = await runFinancialAnalysis({
      monthlyIncome: input.monthlyIncome,
      dependants: input.dependants ?? 0,
      expenses: input.expenses as Record<string, number>,
      debts: (input.debts ?? []).map((d) => ({
        name: d.name,
        amount: d.amount,
        interestRate: d.interestRate,
        minPayment: d.minPayment ?? null,
      })),
      notes: input.notes ?? null,
    });

    const totalExpenses = result.budgetAnalysis.totalExpenses;
    const totalDebt = result.debtReduction.totalDebt;
    const savingsRate = result.budgetAnalysis.savingsRate;

    const [saved] = await db
      .insert(analysesTable)
      .values({
        monthlyIncome: String(input.monthlyIncome),
        dependants: input.dependants ?? 0,
        totalExpenses: String(totalExpenses),
        totalDebt: totalDebt > 0 ? String(totalDebt) : null,
        savingsRate: savingsRate != null ? String(savingsRate) : null,
        inputData: input,
        budgetAnalysis: result.budgetAnalysis,
        savingsStrategy: result.savingsStrategy,
        debtReduction: result.debtReduction,
        notes: input.notes ?? null,
      })
      .returning();

    res.json({
      id: saved.id,
      createdAt: saved.createdAt.toISOString(),
      input: saved.inputData,
      budgetAnalysis: saved.budgetAnalysis,
      savingsStrategy: saved.savingsStrategy,
      debtReduction: saved.debtReduction,
    });
  } catch (err) {
    req.log.error({ err }, "Financial analysis failed");
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

router.get("/analysis/history", async (req, res) => {
  const rows = await db
    .select({
      id: analysesTable.id,
      createdAt: analysesTable.createdAt,
      monthlyIncome: analysesTable.monthlyIncome,
      totalExpenses: analysesTable.totalExpenses,
      savingsRate: analysesTable.savingsRate,
      totalDebt: analysesTable.totalDebt,
    })
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(50);

  res.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      monthlyIncome: Number(r.monthlyIncome),
      totalExpenses: Number(r.totalExpenses),
      savingsRate: r.savingsRate != null ? Number(r.savingsRate) : null,
      totalDebt: r.totalDebt != null ? Number(r.totalDebt) : null,
    })),
  );
});

router.get("/analysis/history/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [row] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    input: row.inputData,
    budgetAnalysis: row.budgetAnalysis,
    savingsStrategy: row.savingsStrategy,
    debtReduction: row.debtReduction,
  });
});

router.delete("/analysis/history/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const deleted = await db
    .delete(analysesTable)
    .where(eq(analysesTable.id, id))
    .returning({ id: analysesTable.id });

  if (!deleted.length) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.status(204).send();
});

router.get("/analysis/stats", async (req, res) => {
  const [stats] = await db
    .select({
      totalAnalyses: count(),
      avgSavingsRate: avg(analysesTable.savingsRate),
      avgMonthlyIncome: avg(analysesTable.monthlyIncome),
      avgTotalExpenses: avg(analysesTable.totalExpenses),
      avgTotalDebt: avg(analysesTable.totalDebt),
    })
    .from(analysesTable);

  res.json({
    totalAnalyses: Number(stats?.totalAnalyses ?? 0),
    avgSavingsRate:
      stats?.avgSavingsRate != null ? Number(stats.avgSavingsRate) : null,
    avgMonthlyIncome:
      stats?.avgMonthlyIncome != null ? Number(stats.avgMonthlyIncome) : null,
    avgTotalExpenses:
      stats?.avgTotalExpenses != null ? Number(stats.avgTotalExpenses) : null,
    avgTotalDebt:
      stats?.avgTotalDebt != null ? Number(stats.avgTotalDebt) : null,
  });
});

router.use(parseCsvRouter);
router.use(insightsRouter);
router.use((await import("./recurring")).default);
router.use((await import("./export")).default);

export default router;
