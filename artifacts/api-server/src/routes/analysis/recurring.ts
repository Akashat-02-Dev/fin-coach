import { Router } from "express";
import { db, analysesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

const SUBSCRIPTION_KEYWORDS = [
  "netflix", "spotify", "hulu", "disney", "amazon prime", "apple", "google",
  "microsoft", "adobe", "dropbox", "slack", "zoom", "gym", "membership",
  "subscription", "insurance", "mortgage", "rent", "loan", "utilities",
  "electric", "water", "gas", "internet", "phone", "cable", "streaming",
  "youtube", "twitch", "patreon", "onlyfans", "news", "magazine",
];

const CATEGORY_MAP: Record<string, string> = {
  netflix: "Entertainment", spotify: "Entertainment", hulu: "Entertainment",
  disney: "Entertainment", "amazon prime": "Entertainment", youtube: "Entertainment",
  twitch: "Entertainment", streaming: "Entertainment",
  apple: "Software", google: "Software", microsoft: "Software",
  adobe: "Software", dropbox: "Software", slack: "Software",
  zoom: "Software", subscription: "Software", patreon: "Software",
  gym: "Health & Fitness", membership: "Health & Fitness",
  insurance: "Insurance", mortgage: "Housing", rent: "Housing",
  loan: "Debt Payments", utilities: "Utilities", electric: "Utilities",
  water: "Utilities", gas: "Utilities", internet: "Utilities",
  phone: "Utilities", cable: "Utilities",
  news: "Media", magazine: "Media",
};

router.get("/analysis/recurring", async (req, res) => {
  const userId = req.user!.id;
  const [latest] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.userId, userId))
    .orderBy(desc(analysesTable.createdAt))
    .limit(1);

  if (!latest) {
    res.json([]);
    return;
  }

  const inputData = latest.inputData as {
    expenses?: Record<string, number>;
  } | null;
  const expenses = inputData?.expenses ?? {};

  const recurring: {
    name: string;
    estimatedMonthly: number;
    category: string;
    confidence: number;
  }[] = [];

  for (const [name, amount] of Object.entries(expenses)) {
    const lower = name.toLowerCase();
    const matchedKeyword = SUBSCRIPTION_KEYWORDS.find((kw) => lower.includes(kw));

    if (matchedKeyword) {
      recurring.push({
        name,
        estimatedMonthly: amount,
        category: CATEGORY_MAP[matchedKeyword] ?? "Subscription",
        confidence: 0.9,
      });
    } else {
      // Heuristic: fixed round amounts under $500 look like recurring bills
      if (amount % 5 === 0 && amount <= 500 && amount >= 5) {
        recurring.push({
          name,
          estimatedMonthly: amount,
          category: "Possible Recurring",
          confidence: 0.55,
        });
      }
    }
  }

  // Sort by confidence desc, then amount desc
  recurring.sort((a, b) => b.confidence - a.confidence || b.estimatedMonthly - a.estimatedMonthly);

  res.json(recurring);
});

export default router;
