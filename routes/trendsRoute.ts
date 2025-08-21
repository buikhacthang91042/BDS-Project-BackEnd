import { Router } from "express";
import trendController from "../controllers/trendController";

const router = Router();
router.get("/hotspot", trendController.getHotSpot);
router.get("/price-trends", trendController.getPriceTrends);
export default router;
