import express, { Router } from "express";
import { login, register, getProfile } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router: Router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/profile", protect, getProfile);

export default router;
