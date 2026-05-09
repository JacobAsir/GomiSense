import { Router, type IRouter } from "express";
import healthRouter from "./health";
import municipalitiesRouter from "./municipalities";
import wasteRouter from "./waste";
import voiceRouter from "./voice";

const router: IRouter = Router();

router.use(healthRouter);
router.use(municipalitiesRouter);
router.use(wasteRouter);
router.use(voiceRouter);

export default router;
