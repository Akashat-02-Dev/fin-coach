import { Router } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable, getTrialStatus } from "@workspace/db";
import { eq, ne, and } from "drizzle-orm";
import { UpdateProfileBody, UpdateUserProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../../middlewares/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_local_secret_key_for_financial_coach_dev";

// Helper to format user response
function formatUserResponse(user: typeof usersTable.$inferSelect) {
  const { trialDaysRemaining, isTrialExpired } = getTrialStatus(user.createdAt);
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: user.dateOfBirth,
    employmentStatus: user.employmentStatus,
    annualIncomeRange: user.annualIncomeRange,
    riskTolerance: user.riskTolerance,
    baseCurrency: user.baseCurrency,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionTier: user.subscriptionTier,
    currentPeriodEnd: user.currentPeriodEnd ? user.currentPeriodEnd.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    trialDaysRemaining,
    isTrialExpired,
  };
}

// GET profile (both paths)
const getProfileHandler = async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(formatUserResponse(user));
  } catch (err) {
    console.error("Profile GET error:", err);
    res.status(500).json({ error: "An unexpected error occurred while fetching profile" });
  }
};

router.get("/profile", requireAuth, getProfileHandler);
router.get("/users/profile", requireAuth, getProfileHandler);

// PUT profile (both paths)
const putProfileHandler = (schema: typeof UpdateProfileBody | typeof UpdateUserProfileBody) => {
  return async (req: any, res: any) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const {
      firstName,
      lastName,
      email,
      dateOfBirth,
      employmentStatus,
      annualIncomeRange,
      riskTolerance,
      baseCurrency,
      currentPassword,
      newPassword,
    } = parsed.data;
    const userId = req.user!.id;

    try {
      // Check if user still exists
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check if email change conflicts with another user
      if (email.toLowerCase().trim() !== user.email) {
        const [emailConflict] = await db
          .select()
          .from(usersTable)
          .where(
            and(
              eq(usersTable.email, email.toLowerCase().trim()),
              ne(usersTable.id, userId)
            )
          )
          .limit(1);

        if (emailConflict) {
          res.status(400).json({ error: "Email is already taken by another account" });
          return;
        }
      }

      const updateValues: Partial<typeof usersTable.$inferInsert> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        dateOfBirth: dateOfBirth || null,
        employmentStatus: employmentStatus || null,
        annualIncomeRange: annualIncomeRange || null,
        riskTolerance: riskTolerance || null,
        baseCurrency: baseCurrency || null,
      };

      // If attempting to update password
      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({ error: "Current password is required to set a new password" });
          return;
        }

        const isValidPassword = await bcryptjs.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
          res.status(400).json({ error: "Incorrect current password" });
          return;
        }

        if (newPassword.length < 8) {
          res.status(400).json({ error: "New password must be at least 8 characters long" });
          return;
        }

        updateValues.passwordHash = await bcryptjs.hash(newPassword, 10);
      }

      // Perform database update
      const [updatedUser] = await db
        .update(usersTable)
        .set(updateValues)
        .where(eq(usersTable.id, userId))
        .returning();

      // Re-sign JWT cookie with updated details
      const token = jwt.sign(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(formatUserResponse(updatedUser));
    } catch (err) {
      console.error("Profile PUT error:", err);
      res.status(500).json({ error: "An unexpected error occurred while updating profile" });
    }
  };
};

router.put("/profile", requireAuth, putProfileHandler(UpdateProfileBody));
router.put("/users/profile", requireAuth, putProfileHandler(UpdateUserProfileBody));

// DELETE profile (both paths)
const deleteProfileHandler = async (req: any, res: any) => {
  try {
    const userId = req.user!.id;

    // Delete user from database (cascades automatically to all tables due to onDelete: "cascade")
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    // Clear session token cookie
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(204).end();
  } catch (err) {
    console.error("Profile DELETE error:", err);
    res.status(500).json({ error: "An unexpected error occurred while deleting profile" });
  }
};

router.delete("/profile", requireAuth, deleteProfileHandler);
router.delete("/users/profile", requireAuth, deleteProfileHandler);

export default router;
