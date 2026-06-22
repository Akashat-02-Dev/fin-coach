import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import billingRouter from "./billing";
import usersRouter from "./users";
import vaultRouter from "./vault";
import analysisRouter from "./analysis";
import goalsRouter from "./goals";
import netWorthRouter from "./net-worth";
import debtRouter from "./debt";
import alertsRouter from "./alerts";
import investmentsRouter from "./investments";
import { requireAuth } from "../middlewares/auth";
import { checkPlatformAccess } from "../middlewares/access-control";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use(authRouter);
router.use(billingRouter);

// Protected routes
router.use(requireAuth);
router.use(checkPlatformAccess);
router.use(usersRouter);
router.use(vaultRouter);
router.use(analysisRouter);
router.use(goalsRouter);
router.use(netWorthRouter);
router.use(debtRouter);
router.use(alertsRouter);
router.use(investmentsRouter);

export default router;
