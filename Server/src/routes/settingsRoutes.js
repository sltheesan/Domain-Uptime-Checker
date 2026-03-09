import express from "express";
import { getSettings, syncCheckerDomains, updateSettings } from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", allowRoles("admin"), getSettings);
router.patch("/", allowRoles("admin"), updateSettings);
router.post("/sync", allowRoles("admin"), syncCheckerDomains);

export default router;
