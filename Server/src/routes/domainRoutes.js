import express from "express";
import multer from "multer";
import {
  assignDomainToBrand,
  createDomain,
  deleteDomain,
  getAvailableDomains,
  getDomains,
  importDomainsCsv,
  replaceBrandDomain,
  unassignDomainFromBrand,
  updateDomain
} from "../controllers/domainController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get("/", getDomains);
router.get("/available", getAvailableDomains);

router.post("/", allowRoles("admin", "manager"), createDomain);
router.post("/import/csv", allowRoles("admin", "manager"), upload.single("file"), importDomainsCsv);

router.patch("/:id", allowRoles("admin", "manager"), updateDomain);
router.patch("/:id/assign", allowRoles("admin", "manager"), assignDomainToBrand);
router.patch("/:id/unassign", allowRoles("admin", "manager"), unassignDomainFromBrand);
router.patch("/:id/replace", allowRoles("admin", "manager"), replaceBrandDomain);

router.delete("/:id", allowRoles("admin"), deleteDomain);

export default router;