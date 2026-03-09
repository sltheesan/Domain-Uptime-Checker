import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", allowRoles("admin"), getSettings);
router.patch("/", allowRoles("admin"), updateSettings);

export default router;