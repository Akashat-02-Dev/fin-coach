import { Router } from "express";
import { db, goalsTable } from "@workspace/db";
import { UpsertGoalsBody } from "@workspace/api-zod";
import { desc, eq, and } from "drizzle-orm";

const router = Router();

const toGoalsResponse = (row: typeof goalsTable.$inferSelect) => ({
  id: row.id,
  targetSavingsRate: row.targetSavingsRate != null ? Number(row.targetSavingsRate) : null,
  targetMonthlySavings: row.targetMonthlySavings != null ? Number(row.targetMonthlySavings) : null,
  targetDebtPayoffMonths: row.targetDebtPayoffMonths ?? null,
  targetEmergencyFundMonths: row.targetEmergencyFundMonths ?? null,
  notes: row.notes ?? null,
  updatedAt: row.updatedAt.toISOString(),
});

router.get("/goals", async (req, res) => {
  const userId = req.user!.id;
  const [row] = await db
    .select()
    .from(goalsTable)
    .where(eq(goalsTable.userId, userId))
    .orderBy(desc(goalsTable.id))
    .limit(1);

  if (!row) {
    res.json({
      id: null,
      targetSavingsRate: null,
      targetMonthlySavings: null,
      targetDebtPayoffMonths: null,
      targetEmergencyFundMonths: null,
      notes: null,
      updatedAt: null,
    });
    return;
  }
  res.json(toGoalsResponse(row));
});

router.put("/goals", async (req, res) => {
  const parsed = UpsertGoalsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.id;
  const data = parsed.data;
  const [existing] = await db
    .select({ id: goalsTable.id })
    .from(goalsTable)
    .where(eq(goalsTable.userId, userId))
    .limit(1);

  const values = {
    userId,
    targetSavingsRate: data.targetSavingsRate != null ? String(data.targetSavingsRate) : null,
    targetMonthlySavings: data.targetMonthlySavings != null ? String(data.targetMonthlySavings) : null,
    targetDebtPayoffMonths: data.targetDebtPayoffMonths ?? null,
    targetEmergencyFundMonths: data.targetEmergencyFundMonths ?? null,
    notes: data.notes ?? null,
  };

  let row: typeof goalsTable.$inferSelect;
  if (existing) {
    [row] = await db
      .update(goalsTable)
      .set(values)
      .where(and(eq(goalsTable.id, existing.id), eq(goalsTable.userId, userId)))
      .returning();
  } else {
    [row] = await db.insert(goalsTable).values(values).returning();
  }

  res.json(toGoalsResponse(row));
});

export default router;
