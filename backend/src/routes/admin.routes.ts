import express, { Router } from "express";
import {
  getAllUsers,
  getPendingUsers,
  updateUserStatus,
  createAdmin,
} from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router: Router = express.Router();

// Public route for creating admin (hidden, requires secret key)
router.post("/create", createAdmin);

// Protected routes (require authentication)
router.use(protect);

// Admin-only routes
router.get("/users", getAllUsers);
router.get("/users/pending", getPendingUsers);
router.put("/users/status", updateUserStatus);

export default router;
