// authRoute.ts
import express, { Router } from "express";
import authController from "../controllers/authController";
import { validateBody } from "../middlewares/validateZod";
import { RegisterSchema } from "../../bds-backend/schemas/registerSchema";

const router: Router = express.Router();
router.post("/register", validateBody(RegisterSchema), authController.register);
router.post("/login", authController.login);
router.get("/me", authController.getMe);

router.get("/google", authController.googleAuth);
router.get(
  "/google/callback",
  authController.googleAuthCallback,
  authController.googleCallbackHandler
);
router.get("/facebook", authController.facebookAuth);
router.get(
  "/facebook/callback",
  authController.facebookAuthCallback,
  authController.facebookCallbackHandler
);

export default router;
