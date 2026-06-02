import { Router } from "express";
import multer from "multer";
import { parseTransactions, categorizeTransactions } from "../../lib/csv-categorizer";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are supported"));
    }
  },
});

router.post("/analysis/parse-csv", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded. Send a CSV file in the 'file' field." });
    return;
  }

  try {
    const csvContent = req.file.buffer.toString("utf-8");
    const { transactions, detectedColumns } = parseTransactions(csvContent);

    if (!transactions.length) {
      res.status(400).json({ error: "No valid transactions found in CSV. Check that the file has date, description, and amount columns." });
      return;
    }

    const expenses = await categorizeTransactions(transactions);

    res.json({
      rowCount: transactions.length,
      detectedColumns,
      expenses,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse CSV";
    req.log.warn({ err }, "CSV parse error");
    res.status(400).json({ error: message });
  }
});

export default router;
