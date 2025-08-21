import express, { Router } from "express";
import authController from "../controllers/authController";
import { validateBody } from "../middlewares/validateZod";
import { RegisterSchema } from "../../bds-backend/schemas/registerSchema";

const router: Router = express.Router();
router.post("/register", validateBody(RegisterSchema), authController.register);
router.post("/login", authController.login);
router.get("/me", authController.getMe);
export default router;
