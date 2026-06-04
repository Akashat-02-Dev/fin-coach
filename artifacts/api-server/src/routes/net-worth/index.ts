import { Router } from "express";
import { db, netWorthEntriesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

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

router.get("/net-worth", async (_req, res) => {
  const rows = await db.select().from(netWorthEntriesTable).orderBy(asc(netWorthEntriesTable.date));
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

  const [row] = await db
    .insert(netWorthEntriesTable)
    .values({ date, assets: String(assets), liabilities: String(liabilities), notes: notes ?? null })
    .returning();

  res.status(201).json(toEntry(row));
});

router.delete("/net-worth/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(netWorthEntriesTable).where(eq(netWorthEntriesTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
