import { Router } from "express";
import { db, analysesTable, goalsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/alerts", async (_req, res) => {
  const analyses = await db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt)).limit(2);
  const [goals] = await db.select().from(goalsTable).limit(1);

  const alerts: {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    value: number | null;
    threshold: number | null;
  }[] = [];

  if (!analyses.length) {
    alerts.push({
      id: "no_data",
      type: "no_data",
      severity: "info",
      title: "No analyses yet",
      message: "Run your first financial analysis to start receiving personalized alerts.",
      value: null,
      threshold: null,
    });
    res.json(alerts);
    return;
  }

  const latest = analyses[0];
  const prev = analyses[1] ?? null;

  const income = Number(latest.monthlyIncome);
  const expenses = Number(latest.totalExpenses);
  const savingsRate = latest.savingsRate != null ? Number(latest.savingsRate) : null;
  const expenseRatio = income > 0 ? expenses / income : null;

  // Alert: savings rate dropped
  if (prev && savingsRate != null && prev.savingsRate != null) {
    const prevRate = Number(prev.savingsRate);
    const drop = prevRate - savingsRate;
    if (drop >= 5) {
      alerts.push({
        id: "savings_rate_drop",
        type: "savings_rate_drop",
        severity: drop >= 10 ? "critical" : "warning",
        title: "Savings rate dropped",
        message: `Your savings rate fell from ${prevRate.toFixed(1)}% to ${savingsRate.toFixed(1)}% — a drop of ${drop.toFixed(1)} percentage points.`,
        value: savingsRate,
        threshold: prevRate,
      });
    }
  }

  // Alert: savings rate below goal
  if (goals?.targetSavingsRate != null && savingsRate != null) {
    const target = Number(goals.targetSavingsRate);
    if (savingsRate < target - 3) {
      alerts.push({
        id: "goal_missed_savings",
        type: "goal_missed",
        severity: "warning",
        title: "Below savings rate goal",
        message: `You're saving ${savingsRate.toFixed(1)}% but your goal is ${target}%. Try cutting back on discretionary spending.`,
        value: savingsRate,
        threshold: target,
      });
    }
  }

  // Alert: spending spike
  if (prev && expenseRatio != null) {
    const prevExpenses = Number(prev.totalExpenses);
    const change = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null;
    if (change != null && change >= 15) {
      alerts.push({
        id: "spending_spike",
        type: "spending_spike",
        severity: change >= 25 ? "critical" : "warning",
        title: "Spending spike detected",
        message: `Your expenses jumped ${change.toFixed(0)}% compared to last month ($${Math.round(prevExpenses).toLocaleString()} → $${Math.round(expenses).toLocaleString()}).`,
        value: expenses,
        threshold: prevExpenses,
      });
    }
  }

  // Alert: expense ratio dangerously high
  if (expenseRatio != null && expenseRatio >= 0.95) {
    alerts.push({
      id: "high_expense_ratio",
      type: "spending_spike",
      severity: "critical",
      title: "Expenses near or exceed income",
      message: `You're spending ${(expenseRatio * 100).toFixed(0)}% of your income. Immediate action needed to avoid going into debt.`,
      value: Math.round(expenseRatio * 100),
      threshold: 95,
    });
  }

  // Alert: low savings rate (< 5%)
  if (savingsRate != null && savingsRate < 5 && !alerts.find((a) => a.id === "goal_missed_savings")) {
    alerts.push({
      id: "low_savings_rate",
      type: "savings_rate_drop",
      severity: savingsRate < 0 ? "critical" : "warning",
      title: savingsRate < 0 ? "Negative savings rate" : "Very low savings rate",
      message:
        savingsRate < 0
          ? "You're spending more than you earn. Review your budget immediately."
          : `Your savings rate of ${savingsRate.toFixed(1)}% is below the recommended 20%. Look for areas to cut back.`,
      value: savingsRate,
      threshold: 5,
    });
  }

  res.json(alerts);
});

export default router;
