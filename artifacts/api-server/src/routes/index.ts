import { Router, type IRouter } from "express";
import healthRouter from "./health";
import municipalitiesRouter from "./municipalities";
import wasteRouter from "./waste";


const router: IRouter = Router();

router.use(healthRouter);
router.use(municipalitiesRouter);
router.use(wasteRouter);


export default router;
