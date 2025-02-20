import express, { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller";
import { protect } from "../middleware/auth.middleware";

const router: Router = express.Router();

// Protected routes
router.use(protect);

router.get("/", getCategories);
router.post("/", createCategory);
router.get("/:id", getCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
