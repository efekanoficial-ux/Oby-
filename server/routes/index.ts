import { Router, type IRouter } from "express";
import healthRouter from "./health";
import notifyRouter from "./notify";
import emailRouter from "./email";

const router: IRouter = Router();

router.use(healthRouter);
router.use(notifyRouter);
router.use(emailRouter);

export default router;
