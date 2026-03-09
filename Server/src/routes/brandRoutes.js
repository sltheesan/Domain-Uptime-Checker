import express from "express";
import {
  createBrand,
  deleteBrand,
  getBrandById,
  getBrands,
  getDashboardSummary,
  toggleBrandMonitoring,
  updateBrand
} from "../controllers/brandController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getBrands);
router.get("/dashboard/summary", getDashboardSummary);
router.get("/:id", getBrandById);

router.post("/", allowRoles("admin", "manager"), createBrand);
router.patch("/:id", allowRoles("admin", "manager"), updateBrand);
router.patch("/:id/monitoring", allowRoles("admin", "manager"), toggleBrandMonitoring);
router.delete("/:id", allowRoles("admin"), deleteBrand);

export default router;