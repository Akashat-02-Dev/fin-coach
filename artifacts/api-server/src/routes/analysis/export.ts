import { Router } from "express";
import { db, analysesTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router = Router();

function escapeCSV(val: string | number | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

router.get("/analysis/export/csv", async (_req, res) => {
  const rows = await db.select().from(analysesTable).orderBy(asc(analysesTable.createdAt));

  const headers = [
    "ID", "Date", "Monthly Income", "Total Expenses", "Total Debt",
    "Savings Rate (%)", "Net Surplus", "Top Category 1", "Top Category 2",
    "Top Category 3", "Budget Summary", "Savings Summary", "Debt Summary",
  ];

  const lines: string[] = [headers.join(",")];

  for (const row of rows) {
    const budget = row.budgetAnalysis as {
      spendingCategories?: { category: string; amount: number }[];
      summary?: string;
    } | null;
    const savings = row.savingsStrategy as { summary?: string } | null;
    const debt = row.debtReduction as { summary?: string } | null;

    const cats = budget?.spendingCategories ?? [];
    const top3 = cats.slice(0, 3).map((c) => `${c.category}: $${c.amount}`);

    const income = Number(row.monthlyIncome);
    const expenses = Number(row.totalExpenses);

    const cells = [
      row.id,
      new Date(row.createdAt).toLocaleDateString(),
      income.toFixed(2),
      expenses.toFixed(2),
      row.totalDebt != null ? Number(row.totalDebt).toFixed(2) : "",
      row.savingsRate != null ? Number(row.savingsRate).toFixed(1) : "",
      (income - expenses).toFixed(2),
      top3[0] ?? "",
      top3[1] ?? "",
      top3[2] ?? "",
      budget?.summary ?? "",
      savings?.summary ?? "",
      debt?.summary ?? "",
    ];

    lines.push(cells.map(escapeCSV).join(","));
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=financial-analyses.csv");
  res.send(lines.join("\n"));
});

export default router;
