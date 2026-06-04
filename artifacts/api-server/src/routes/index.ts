import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysisRouter from "./analysis";
import goalsRouter from "./goals";
import netWorthRouter from "./net-worth";
import debtRouter from "./debt";
import alertsRouter from "./alerts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysisRouter);
router.use(goalsRouter);
router.use(netWorthRouter);
router.use(debtRouter);
router.use(alertsRouter);

export default router;
