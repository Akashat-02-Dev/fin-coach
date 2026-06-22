import { Router } from "express";
import { db, netWorthEntriesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";

const router = Router();

const toEntry = (row: typeof netWorthEntriesTable.$inferSelect) => ({
  id: row.id,
  date: row.date,
  assets: Number(row.assets),
  liabilities: Number(row.liabilities),
  netWorth: Number(row.assets) - Number(row.liabilities),
  notes: row.notes ?? null,
  createdAt: row.createdAt.toISOString(),
});

router.get("/net-worth", async (req, res) => {
  const userId = req.user!.id;
  const rows = await db
    .select()
    .from(netWorthEntriesTable)
    .where(eq(netWorthEntriesTable.userId, userId))
    .orderBy(asc(netWorthEntriesTable.date));
  res.json(rows.map(toEntry));
});

router.post("/net-worth", async (req, res) => {
  const { date, assets, liabilities, notes } = req.body as {
    date?: string;
    assets?: number;
    liabilities?: number;
    notes?: string | null;
  };

  if (!date || assets == null || liabilities == null) {
    res.status(400).json({ error: "date, assets, and liabilities are required" });
    return;
  }

  const userId = req.user!.id;

  const [row] = await db
    .insert(netWorthEntriesTable)
    .values({
      userId,
      date,
      assets: String(assets),
      liabilities: String(liabilities),
      notes: notes ?? null,
    })
    .returning();

  res.status(201).json(toEntry(row));
});

router.delete("/net-worth/:id", async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user!.id;

  const [deleted] = await db
    .delete(netWorthEntriesTable)
    .where(and(eq(netWorthEntriesTable.id, id), eq(netWorthEntriesTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
