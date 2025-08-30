import { Router } from "express";
import { getListing } from "../controllers/listingController";

const router = Router();
router.post("/listings", getListing);
export default router;
