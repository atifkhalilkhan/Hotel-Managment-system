import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
} from "../controllers/userController.js";

const userRoutes = Router();

userRoutes.post("/", protect, authorize("admin", "receptionist"), createUser);
userRoutes.get("/", protect, authorize("admin", "manager", "receptionist"), getUsers);
userRoutes.get("/:id", protect, authorize("admin", "manager"), getUserById);
userRoutes.put("/:id", protect, authorize("admin"), updateUser);
userRoutes.patch("/:id/status", protect, authorize("admin"), toggleUserStatus);

export default userRoutes;