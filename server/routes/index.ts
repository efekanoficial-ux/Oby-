import { Router, type IRouter } from "express";
import healthRouter from "./health";
import notifyRouter from "./notify";
import emailRouter from "./email";
import ratesRouter from "./rates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(notifyRouter);
router.use(emailRouter);
router.use(ratesRouter);

export default router;
