import { Router } from "express";
import { db, investmentScenariosTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateInvestmentScenarioBody } from "@workspace/api-zod";
import { requireAuth } from "../../middlewares/auth";
import { requirePremium } from "../../middlewares/premium";

const router = Router();

// 1. GET Benchmark Rates (Available to all authenticated users)
router.get("/investments/benchmark-rates", requireAuth, async (req: any, res: any) => {
  try {
    res.json({
      fixedDeposit: 7.0,
      corporateBonds: 8.5,
      gold: 9.5,
      indexFunds: 12.0,
      realEstate: 8.0,
    });
  } catch (err) {
    console.error("GET benchmark rates error:", err);
    res.status(500).json({ error: "An unexpected error occurred while fetching benchmark rates" });
  }
});

// 2. GET Saved Scenarios (Premium only)
router.get("/investments/scenarios", requireAuth, requirePremium, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const scenarios = await db
      .select()
      .from(investmentScenariosTable)
      .where(eq(investmentScenariosTable.userId, userId));

    const mapped = scenarios.map((row) => ({
      id: row.id,
      scenarioName: row.scenarioName,
      investmentType: row.investmentType,
      principalAmount: Number(row.principalAmount), // Explicit typecast from string/decimal to number
      durationYears: row.durationYears,
      metaData: row.metaData,
      createdAt: row.createdAt.toISOString(),
    }));

    res.json(mapped);
  } catch (err) {
    console.error("GET investment scenarios error:", err);
    res.status(500).json({ error: "An unexpected error occurred while fetching scenarios" });
  }
});

// 3. POST Save Scenario (Premium only)
router.post("/investments/scenarios", requireAuth, requirePremium, async (req: any, res: any) => {
  const parsed = CreateInvestmentScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const userId = req.user!.id;
    const { scenarioName, investmentType, principalAmount, durationYears, metaData } = parsed.data;

    const [newScenario] = await db
      .insert(investmentScenariosTable)
      .values({
        userId,
        scenarioName,
        investmentType,
        principalAmount: principalAmount.toString(), // Store numeric/decimal as string
        durationYears,
        metaData: metaData || null,
      })
      .returning();

    res.status(201).json({
      id: newScenario.id,
      scenarioName: newScenario.scenarioName,
      investmentType: newScenario.investmentType,
      principalAmount: Number(newScenario.principalAmount), // Explicit typecast
      durationYears: newScenario.durationYears,
      metaData: newScenario.metaData,
      createdAt: newScenario.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("POST investment scenario error:", err);
    res.status(500).json({ error: "An unexpected error occurred while saving scenario" });
  }
});

// 4. DELETE Saved Scenario (Premium only)
router.delete("/investments/scenarios/:id", requireAuth, requirePremium, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const scenarioId = parseInt(req.params.id, 10);

    if (isNaN(scenarioId)) {
      res.status(400).json({ error: "Invalid scenario ID" });
      return;
    }

    const [existing] = await db
      .select()
      .from(investmentScenariosTable)
      .where(and(eq(investmentScenariosTable.id, scenarioId), eq(investmentScenariosTable.userId, userId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Scenario not found" });
      return;
    }

    await db
      .delete(investmentScenariosTable)
      .where(eq(investmentScenariosTable.id, scenarioId));

    res.status(204).end();
  } catch (err) {
    console.error("DELETE investment scenario error:", err);
    res.status(500).json({ error: "An unexpected error occurred while deleting scenario" });
  }
});

export default router;
