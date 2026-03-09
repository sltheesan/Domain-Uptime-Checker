import express from "express";
import { createUser, getUsers, updateUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("admin"));

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);

export default router;