import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Express middleware to restrict routes to users with an active Premium subscription.
 */
export async function requirePremium(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user?.id) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  try {
    const [user] = await db
      .select({
        subscriptionStatus: usersTable.subscriptionStatus,
        subscriptionTier: usersTable.subscriptionTier,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    if (!user || user.subscriptionStatus !== "active" || user.subscriptionTier !== "premium") {
      res.status(403).json({ error: "Access Denied: Premium subscription required." });
      return;
    }

    next();
  } catch (err) {
    console.error("requirePremium middleware error:", err);
    res.status(500).json({ error: "Internal server error during authorization check" });
  }
}
