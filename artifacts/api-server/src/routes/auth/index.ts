import { Router } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable, getTrialStatus } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SignupUserBody, LoginUserBody } from "@workspace/api-zod";

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

router.post("/auth/signup", async (req, res) => {
  const parsed = SignupUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    email,
    password,
    firstName,
    lastName,
    dateOfBirth,
    employmentStatus,
    annualIncomeRange,
    riskTolerance,
    baseCurrency,
  } = parsed.data;

  // Validate password strength
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters long" });
    return;
  }

  try {
    // Check if email already exists
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      res.status(400).json({ error: "Email is already registered" });
      return;
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Insert user
    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || null,
        employmentStatus: employmentStatus || null,
        annualIncomeRange: annualIncomeRange || null,
        riskTolerance: riskTolerance || null,
        baseCurrency: baseCurrency || null,
      })
      .returning();

    // Create session JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json(formatUserResponse(user));
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "An unexpected error occurred during signup" });
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isValidPassword = await bcryptjs.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Create session JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json(formatUserResponse(user));
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "An unexpected error occurred during login" });
  }
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("session_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const token = req.cookies?.session_token;
  if (!token) {
    res.status(401).json({ error: "Unauthenticated: No active session found" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.id))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Unauthenticated: User does not exist" });
      return;
    }

    res.json(formatUserResponse(user));
  } catch (err) {
    res.status(401).json({ error: "Unauthenticated: Session has expired or is invalid" });
  }
});

export default router;
