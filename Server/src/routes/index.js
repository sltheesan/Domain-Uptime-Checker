import express from "express";
import authRoutes from "./authRoutes.js";
import brandRoutes from "./brandRoutes.js";
import domainRoutes from "./domainRoutes.js";
import monitoringRoutes from "./monitoringRoutes.js";
import settingsRoutes from "./settingsRoutes.js";
import userRoutes from "./userRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/brands", brandRoutes);
router.use("/domains", domainRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/settings", settingsRoutes);
router.use("/users", userRoutes);

export default router;