import { Request, Response, NextFunction } from "express";
import { db, usersTable, getTrialStatus } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Express middleware to lock down operational access if the user's trial is expired
 * and they have not upgraded to premium.
 */
export async function checkPlatformAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  // If no user is authenticated, bypass (requireAuth will handle blocking access)
  if (!req.user?.id) {
    return next();
  }

  // Exempt routes that must be accessible by expired trial users (for upgrading or logging out)
  const EXEMPT_PATHS = [
    "/api/auth/me",
    "/api/auth/logout",
    "/api/billing/create-subscription",
    "/api/billing/verify-signature",
    "/api/health",
    "/auth/me",
    "/auth/logout",
    "/billing/create-subscription",
    "/billing/verify-signature",
    "/health"
  ];

  const cleanOriginalPath = (req.originalUrl || "").split("?")[0].replace(/\/$/, "");
  const cleanPath = (req.path || "").split("?")[0].replace(/\/$/, "");

  if (EXEMPT_PATHS.includes(cleanOriginalPath) || EXEMPT_PATHS.includes(cleanPath)) {
    return next();
  }

  try {
    const [user] = await db
      .select({
        subscriptionStatus: usersTable.subscriptionStatus,
        subscriptionTier: usersTable.subscriptionTier,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Premium users with active subscription get full access
    if (user.subscriptionTier === "premium" && user.subscriptionStatus === "active") {
      return next();
    }

    // Free tier trial status check
    const { isTrialExpired } = getTrialStatus(user.createdAt);
    if (isTrialExpired) {
      res.status(403).json({
        error: "TRIAL_EXPIRED",
        message: "Your 15-day free trial has ended. Please upgrade to continue."
      });
      return;
    }

    // If trial is still active, allow baseline access
    next();
  } catch (err) {
    console.error("checkPlatformAccess middleware error:", err);
    res.status(500).json({ error: "Internal server error during authorization check" });
  }
}
