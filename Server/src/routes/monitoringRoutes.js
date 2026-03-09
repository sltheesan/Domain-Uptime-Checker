import express from "express";
import {
  getBrandMonitoringHistory,
  getMonitoringDashboard,
  resolveVisitUrl,
  runBrandMonitoringNow,
  runMonitoringNow
} from "../controllers/monitoringController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard", getMonitoringDashboard);
router.get("/history/:brandId", getBrandMonitoringHistory);
router.get("/resolve-visit-url", resolveVisitUrl);

router.post("/run-now", allowRoles("admin", "manager"), runMonitoringNow);
router.post("/brands/:id/run-now", allowRoles("admin", "manager"), runBrandMonitoringNow);

export default router;
