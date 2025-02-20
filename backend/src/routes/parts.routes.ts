import express, { Router } from "express";
import {
  getParts,
  getPart,
  createPart,
  updatePart,
  deletePart,
  searchParts,
  getLowStockParts,
} from "../controllers/parts.controller";
import { protect } from "../middleware/auth.middleware";

const router: Router = express.Router();

// Protected routes
router.use(protect);

router.get("/", getParts);
router.post("/", createPart);
router.get("/search", searchParts);
router.get("/low-stock", getLowStockParts);
router.get("/:id", getPart);
router.put("/:id", updatePart);
router.delete("/:id", deletePart);

export default router;
