import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
      };
      rawBody?: Buffer;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "default_local_secret_key_for_financial_coach_dev";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.session_token;

  if (!token) {
    res.status(401).json({ error: "Unauthenticated: No session cookie provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthenticated: Session is invalid or expired" });
  }
}
