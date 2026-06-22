import OpenAI from "openai";
import { parse } from "csv-parse/sync";
import { logger } from "./logger";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openai) return openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }
  openai = new OpenAI({ apiKey });
  return openai;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
}

export interface CsvParseResult {
  transactions: Transaction[];
  expenses: Record<string, number>;
  rowCount: number;
  detectedColumns: { date: string; description: string; amount: string };
}

const STANDARD_CATEGORIES = [
  "Housing",
  "Food & Dining",
  "Transport",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Clothing",
  "Personal Care",
  "Subscriptions",
  "Education",
  "Travel",
  "Savings & Investments",
  "Other",
];

function detectColumns(headers: string[]): {
  date: string;
  description: string;
  amount: string;
} | null {
  const lower = headers.map((h) => h.toLowerCase().trim());

  const dateCol = headers[
    lower.findIndex((h) =>
      ["date", "transaction date", "posted date", "trans date", "time"].includes(h),
    )
  ];
  const descCol = headers[
    lower.findIndex((h) =>
      ["description", "memo", "payee", "merchant", "name", "details", "narrative", "particulars"].includes(h),
    )
  ];
  const amountCol = headers[
    lower.findIndex((h) =>
      ["amount", "debit", "credit", "value", "sum", "transaction amount", "amount (usd)", "amount usd"].includes(h),
    )
  ];

  if (!dateCol || !descCol || !amountCol) return null;
  return { date: dateCol, description: descCol, amount: amountCol };
}

export function parseTransactions(csvContent: string): {
  transactions: Transaction[];
  detectedColumns: { date: string; description: string; amount: string };
} {
  let records: Record<string, string>[];
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    }) as Record<string, string>[];
  } catch {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ";",
    }) as Record<string, string>[];
  }

  if (!records.length) throw new Error("CSV file is empty or has no data rows");

  const headers = Object.keys(records[0]);
  const cols = detectColumns(headers);

  if (!cols) {
    throw new Error(
      `Could not detect required columns (date, description, amount) in: ${headers.join(", ")}. ` +
        `Common formats: "Date, Description, Amount" or "Date, Payee, Debit".`,
    );
  }

  const transactions: Transaction[] = records
    .map((row) => {
      const rawAmount = row[cols.amount]?.replace(/[$,\s]/g, "") ?? "0";
      const amount = Math.abs(parseFloat(rawAmount) || 0);
      return {
        date: row[cols.date] ?? "",
        description: row[cols.description] ?? "",
        amount,
      };
    })
    .filter((t) => t.amount > 0 && t.description);

  return { transactions, detectedColumns: cols };
}

export async function categorizeTransactions(
  transactions: Transaction[],
): Promise<Record<string, number>> {
  if (!transactions.length) return {};

  const sample = transactions.slice(0, 200);
  const lines = sample
    .map((t) => `${t.description}: $${t.amount.toFixed(2)}`)
    .join("\n");

  logger.info({ count: sample.length }, "Categorizing transactions with AI");

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a bank transaction categorizer. Categorize each transaction into one of these categories:
${STANDARD_CATEGORIES.join(", ")}.

Rules:
- Rent/mortgage → Housing
- Groceries/restaurants/coffee → Food & Dining
- Gas/uber/transit/parking → Transport
- Electric/gas/water/internet/phone → Utilities
- Doctors/pharmacy/gym → Healthcare
- Movies/streaming/games/concerts → Entertainment
- Clothes/shoes → Clothing
- Haircut/cosmetics → Personal Care
- Netflix/Spotify/subscriptions → Subscriptions
- Tuition/books/courses → Education
- Airlines/hotels → Travel
- ATM withdrawal/transfer to savings → Savings & Investments
- Everything else → Other

Return a JSON object ONLY with category names as keys and TOTAL dollar amounts (summed across all transactions in that category) as values.
Only include categories that have non-zero spending.
Example: {"Food & Dining": 450.00, "Transport": 120.00}`,
      },
      {
        role: "user",
        content: `Categorize these ${sample.length} transactions and return the total spent per category:\n\n${lines}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI categorizer returned empty response");

  const raw = JSON.parse(content) as Record<string, number>;

  const result: Record<string, number> = {};
  for (const [cat, amount] of Object.entries(raw)) {
    if (typeof amount === "number" && amount > 0) {
      result[cat] = Math.round(amount * 100) / 100;
    }
  }
  return result;
}
