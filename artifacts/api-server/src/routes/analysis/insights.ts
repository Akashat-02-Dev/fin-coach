import { Router } from "express";
import { db, analysesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

function computeHealthScore(params: {
  savingsRate: number | null;
  debtToIncomeRatio: number | null;
  expenseRatio: number | null;
  trendDirection: "improving" | "declining" | "stable" | null;
}): { score: number; label: string } {
  let score = 0;

  // Savings rate: 0-30 pts (20%+ = full marks)
  if (params.savingsRate != null) {
    const sr = Math.max(0, Math.min(params.savingsRate, 20));
    score += (sr / 20) * 30;
  }

  // Debt-to-income: 0-25 pts (0 debt = full, 12x monthly income = 0)
  if (params.debtToIncomeRatio != null) {
    const capped = Math.max(0, Math.min(params.debtToIncomeRatio, 12));
    score += ((12 - capped) / 12) * 25;
  } else {
    // No debts — full marks
    score += 25;
  }

  // Expense ratio: 0-25 pts (50% or less = full, 100%+ = 0)
  if (params.expenseRatio != null) {
    const ratio = Math.max(0.5, Math.min(params.expenseRatio, 1.0));
    score += ((1.0 - ratio) / 0.5) * 25;
  }

  // Trend: 0-20 pts
  if (params.trendDirection === "improving") score += 20;
  else if (params.trendDirection === "stable") score += 10;
  else if (params.trendDirection === "declining") score += 0;
  else score += 10; // unknown / single point — neutral

  const rounded = Math.round(Math.min(100, Math.max(0, score)));
  const label =
    rounded >= 80 ? "Excellent"
    : rounded >= 65 ? "Good"
    : rounded >= 50 ? "Fair"
    : rounded >= 35 ? "Needs Work"
    : "Critical";

  return { score: rounded, label };
}

function pctChange(prev: number, curr: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

router.get("/analysis/insights", async (req, res) => {
  const rows = await db
    .select()
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(2);

  if (!rows.length) {
    res.json({
      hasEnoughData: false,
      healthScore: null,
      healthLabel: null,
      velocity: {},
      projection: {},
      tips: [],
      latestSavingsRate: null,
      latestMonthlySurplus: null,
    });
    return;
  }

  const latest = rows[0];
  const prev = rows[1] ?? null;

  const income = Number(latest.monthlyIncome);
  const expenses = Number(latest.totalExpenses);
  const debt = latest.totalDebt != null ? Number(latest.totalDebt) : null;
  const savingsRate = latest.savingsRate != null ? Number(latest.savingsRate) : null;
  const surplus = income - expenses;

  // Velocity
  const velocity: Record<string, number | null> = {};
  if (prev) {
    velocity.incomeChange = pctChange(Number(prev.monthlyIncome), income);
    velocity.expensesChange = pctChange(Number(prev.totalExpenses), expenses);
    if (prev.totalDebt != null && debt != null) {
      velocity.debtChange = pctChange(Number(prev.totalDebt), debt);
    }
    const prevRate = prev.savingsRate != null ? Number(prev.savingsRate) : null;
    if (prevRate != null && savingsRate != null) {
      velocity.savingsRateChange = Math.round((savingsRate - prevRate) * 10) / 10;
    }
  }

  // Trend direction
  let trendDirection: "improving" | "declining" | "stable" | null = null;
  if (prev && savingsRate != null && prev.savingsRate != null) {
    const diff = savingsRate - Number(prev.savingsRate);
    trendDirection = diff > 1 ? "improving" : diff < -1 ? "declining" : "stable";
  }

  // Health score
  const { score: healthScore, label: healthLabel } = computeHealthScore({
    savingsRate,
    debtToIncomeRatio: debt != null && income > 0 ? debt / income : null,
    expenseRatio: income > 0 ? expenses / income : null,
    trendDirection,
  });

  // Projections (compound monthly surplus)
  const projection: Record<string, number | null> = {};
  if (surplus > 0) {
    projection.monthlySurplus = Math.round(surplus);
    projection.months6 = Math.round(surplus * 6);
    projection.months12 = Math.round(surplus * 12);
    projection.months24 = Math.round(surplus * 24);
  } else {
    projection.monthlySurplus = Math.round(surplus);
    projection.months6 = null;
    projection.months12 = null;
    projection.months24 = null;
  }

  // Top tips from latest budget analysis
  interface StoredRecommendation {
    category?: string;
    recommendation?: string;
    potentialSavings?: number | null;
  }

  const budgetAnalysis = latest.budgetAnalysis as {
    recommendations?: StoredRecommendation[];
  } | null;

  const rawRecs = budgetAnalysis?.recommendations ?? [];
  const tips = rawRecs
    .slice(0, 3)
    .map((r, i) => ({
      category: r.category ?? "General",
      text: r.recommendation ?? "",
      potentialSavings: r.potentialSavings ?? null,
      priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
    }));

  res.json({
    hasEnoughData: true,
    healthScore,
    healthLabel,
    velocity,
    projection,
    tips,
    latestSavingsRate: savingsRate,
    latestMonthlySurplus: Math.round(surplus),
  });
});

export default router;
