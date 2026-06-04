import { Router } from "express";
import { db, analysesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

interface DebtItem {
  name: string;
  amount: number;
  interestRate: number;
  minPayment?: number | null;
}

interface PayoffMonth {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  debtName: string;
}

function buildSchedule(
  debts: DebtItem[],
  extraBudget: number,
  strategy: "avalanche" | "snowball"
): { schedule: PayoffMonth[]; totalInterest: number; monthsToPayoff: number } {
  if (!debts.length) return { schedule: [], totalInterest: 0, monthsToPayoff: 0 };

  const balances = debts.map((d) => ({ ...d, balance: d.amount }));
  const minPayments = balances.map((d) => d.minPayment ?? Math.max(25, d.balance * 0.02));
  const minTotal = minPayments.reduce((s, v) => s + v, 0);
  const budget = Math.max(minTotal + extraBudget, minTotal);

  let totalInterest = 0;
  const schedule: PayoffMonth[] = [];
  let month = 0;
  const MAX_MONTHS = 600;

  while (balances.some((d) => d.balance > 0.01) && month < MAX_MONTHS) {
    month++;
    let remaining = budget;

    // Pay minimums first
    const paid = balances.map((d, i) => {
      if (d.balance <= 0) return 0;
      const min = Math.min(minPayments[i], d.balance);
      return min;
    });

    paid.forEach((p, i) => {
      remaining -= p;
      const interest = (balances[i].balance * balances[i].interestRate) / 100 / 12;
      totalInterest += interest;
      balances[i].balance = Math.max(0, balances[i].balance + interest - p);
    });

    // Apply extra to priority debt
    const active = balances
      .map((d, i) => ({ ...d, idx: i }))
      .filter((d) => d.balance > 0.01);

    if (active.length && remaining > 0) {
      const sorted =
        strategy === "avalanche"
          ? [...active].sort((a, b) => b.interestRate - a.interestRate)
          : [...active].sort((a, b) => a.balance - b.balance);

      const target = sorted[0];
      const extra = Math.min(remaining, target.balance);
      balances[target.idx].balance = Math.max(0, balances[target.idx].balance - extra);
    }

    const focus = balances.reduce(
      (best, d, i) =>
        d.balance > 0.01 && (best === -1 || (strategy === "avalanche"
          ? d.interestRate > balances[best].interestRate
          : d.balance < balances[best].balance))
          ? i
          : best,
      -1
    );

    if (focus >= 0) {
      const totalPayment = paid[focus] + (remaining > 0 ? Math.min(remaining, balances[focus].balance) : 0);
      const interestPaid = (balances[focus].balance * balances[focus].interestRate) / 100 / 12;
      schedule.push({
        month,
        payment: Math.round(totalPayment * 100) / 100,
        principalPaid: Math.round((totalPayment - interestPaid) * 100) / 100,
        interestPaid: Math.round(interestPaid * 100) / 100,
        remainingBalance: Math.round(balances.reduce((s, d) => s + Math.max(0, d.balance), 0) * 100) / 100,
        debtName: balances[focus].name,
      });
    }
  }

  return {
    schedule,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthsToPayoff: month,
  };
}

router.get("/debt/payoff-plan", async (_req, res) => {
  const [latest] = await db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt)).limit(1);

  if (!latest) {
    res.json({ hasDebts: false, totalDebt: 0, monthlyBudget: 0 });
    return;
  }

  const inputData = latest.inputData as { debts?: DebtItem[] } | null;
  const debts: DebtItem[] = inputData?.debts ?? [];
  const totalDebt = debts.reduce((s, d) => s + d.amount, 0);

  if (!debts.length || totalDebt === 0) {
    res.json({ hasDebts: false, totalDebt: 0, monthlyBudget: 0 });
    return;
  }

  const income = Number(latest.monthlyIncome);
  const expenses = Number(latest.totalExpenses);
  const surplus = income - expenses;
  const extraBudget = Math.max(0, surplus * 0.5);
  const monthlyBudget = debts.reduce((s, d) => s + (d.minPayment ?? Math.max(25, d.amount * 0.02)), 0) + extraBudget;

  const avalanche = buildSchedule(debts, extraBudget, "avalanche");
  const snowball = buildSchedule(debts, extraBudget, "snowball");

  res.json({
    hasDebts: true,
    totalDebt: Math.round(totalDebt * 100) / 100,
    monthlyBudget: Math.round(monthlyBudget * 100) / 100,
    avalanche,
    snowball,
  });
});

export default router;
