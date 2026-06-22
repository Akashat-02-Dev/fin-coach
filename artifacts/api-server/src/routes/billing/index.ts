import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../middlewares/auth";

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const RAZORPAY_PLAN_ID = process.env.RAZORPAY_PLAN_ID || "plan_premium_monthly_mock";

// Initialize Razorpay client only if keys are present, otherwise fallback to mock mode
const isMockMode = !RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.startsWith("rzp_test_mock");
let razorpay: Razorpay | null = null;
if (!isMockMode) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

// 1. Create Subscription Endpoint
router.post("/billing/create-subscription", requireAuth, async (req: any, res: any) => {
  const userId = req.user!.id;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let customerId = user.razorpayCustomerId;

    // Mock Mode checkout session generation
    if (isMockMode) {
      const mockSubId = `sub_mock_${crypto.randomBytes(8).toString("hex")}`;
      res.json({ subscriptionId: mockSubId, keyId: RAZORPAY_KEY_ID || "rzp_test_mock" });
      return;
    }

    // Production Customer Check/Creation
    if (!customerId && razorpay) {
      try {
        const customer = await razorpay.customers.create({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: "9999999999", // Mock contact phone
        });
        customerId = customer.id;

        // Update database with customer ID
        await db
          .update(usersTable)
          .set({ razorpayCustomerId: customerId })
          .where(eq(usersTable.id, userId));
      } catch (err: any) {
        console.error("Razorpay Customer Creation failed:", err);
        res.status(500).json({ error: "Failed to initialize subscription identity" });
        return;
      }
    }

    // Create Razorpay Subscription
    if (razorpay) {
      const subscription = await (razorpay.subscriptions as any).create({
        plan_id: RAZORPAY_PLAN_ID,
        customer_notify: 1,
        total_count: 120, // 10 years
        quantity: 1,
        customer_id: customerId || undefined,
        notes: {
          userId: userId.toString(),
        },
      });

      res.json({ subscriptionId: subscription.id, keyId: RAZORPAY_KEY_ID });
    }
  } catch (err: any) {
    console.error("Create subscription error:", err);
    res.status(500).json({ error: err.message ?? "An unexpected error occurred during subscription setup" });
  }
});

// 2. Verify Signature Endpoint
router.post("/billing/verify-signature", requireAuth, async (req: any, res: any) => {
  const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = req.body;
  const userId = req.user!.id;

  if (!razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature) {
    res.status(400).json({ error: "Missing required payment fields" });
    return;
  }

  try {
    if (!isMockMode) {
      // Construction of HMAC verification payload
      const generatedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(razorpayPaymentId + "|" + razorpaySubscriptionId)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        res.status(400).json({ error: "Invalid payment signature verification failed" });
        return;
      }
    }

    // Update database user status
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const [updatedUser] = await db
      .update(usersTable)
      .set({
        razorpaySubscriptionId,
        subscriptionStatus: "active",
        subscriptionTier: "premium",
        currentPeriodEnd: thirtyDaysFromNow,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionTier: updatedUser.subscriptionTier,
      currentPeriodEnd: updatedUser.currentPeriodEnd?.toISOString(),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    });
  } catch (err: any) {
    console.error("Verify signature error:", err);
    res.status(500).json({ error: "Signature verification failed" });
  }
});

// 3. Cancel Subscription Endpoint
router.post("/billing/cancel-subscription", requireAuth, async (req: any, res: any) => {
  const userId = req.user!.id;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || !user.razorpaySubscriptionId) {
      res.status(404).json({ error: "No active subscription found to cancel" });
      return;
    }

    if (!isMockMode && razorpay) {
      await (razorpay.subscriptions as any).cancel(user.razorpaySubscriptionId, {
        cancel_at_cycle_end: false, // Cancel immediately
      });
    }

    await db
      .update(usersTable)
      .set({
        subscriptionStatus: "cancelled",
        subscriptionTier: "free",
      })
      .where(eq(usersTable.id, userId));

    res.json({ success: true });
  } catch (err: any) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// 4. Secure Webhook Handler Endpoint (public)
router.post("/billing/webhook", async (req: any, res: any) => {
  const sig = req.headers["x-razorpay-signature"] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret && sig) {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");

    if (expectedSignature !== sig) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }
  }

  const { event, payload } = req.body;
  if (!event || !payload) {
    res.status(400).json({ error: "Invalid webhook body" });
    return;
  }

  try {
    const subscriptionEntity = payload.subscription?.entity;
    if (!subscriptionEntity) {
      res.json({ status: "ignored", reason: "no_subscription_payload" });
      return;
    }

    const subId = subscriptionEntity.id;
    const status = subscriptionEntity.status;
    const currentEndSec = subscriptionEntity.current_end; // Unix timestamp
    const currentEnd = currentEndSec ? new Date(currentEndSec * 1000) : null;

    // Lookup user by subscription ID
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.razorpaySubscriptionId, subId))
      .limit(1);

    if (!user) {
      res.json({ status: "ignored", reason: "user_not_found_for_subscription" });
      return;
    }

    if (event === "subscription.charged") {
      // Webhook Idempotency Check: Only update if the new end date is strictly greater
      if (currentEnd && user.currentPeriodEnd) {
        const existingEnd = new Date(user.currentPeriodEnd).getTime();
        const newEnd = currentEnd.getTime();
        if (newEnd <= existingEnd) {
          res.json({ status: "skipped", reason: "idempotency_guard" });
          return;
        }
      }

      await db
        .update(usersTable)
        .set({
          subscriptionStatus: "active",
          subscriptionTier: "premium",
          currentPeriodEnd: currentEnd,
        })
        .where(eq(usersTable.id, user.id));

      res.json({ status: "processed", event: "subscription.charged" });
    } else if (event === "subscription.cancelled") {
      await db
        .update(usersTable)
        .set({
          subscriptionStatus: "cancelled",
          subscriptionTier: "free",
        })
        .where(eq(usersTable.id, user.id));

      res.json({ status: "processed", event: "subscription.cancelled" });
    } else if (event === "subscription.halted") {
      await db
        .update(usersTable)
        .set({
          subscriptionStatus: "halted",
          subscriptionTier: "free",
        })
        .where(eq(usersTable.id, user.id));

      res.json({ status: "processed", event: "subscription.halted" });
    } else {
      res.json({ status: "ignored", reason: "unhandled_event_type" });
    }
  } catch (err) {
    console.error("Webhook event processing failed:", err);
    res.status(500).json({ error: "Webhook handler error" });
  }
});

export default router;
