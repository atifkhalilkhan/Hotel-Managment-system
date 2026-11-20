import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createTask,
  getTasks,
  getMyTasks,
  getOpenTasks,
  assignTask,
  claimTask,
  startTask,
  completeTask,
  cancelTask,
} from "../controllers/housekeepingController.js";

const housekeepingRoutes = Router();

housekeepingRoutes.post("/", protect, authorize("admin", "manager"), createTask);
housekeepingRoutes.get("/", protect, authorize("admin", "manager", "receptionist"), getTasks);

housekeepingRoutes.get("/my", protect, authorize("housekeeping"), getMyTasks);
housekeepingRoutes.get("/open", protect, authorize("admin", "manager", "housekeeping"), getOpenTasks);

housekeepingRoutes.patch("/:id/assign", protect, authorize("admin", "manager"), assignTask);
housekeepingRoutes.patch("/:id/claim", protect, authorize("housekeeping"), claimTask);
housekeepingRoutes.patch("/:id/start", protect, authorize("admin", "manager", "housekeeping"), startTask);
housekeepingRoutes.patch("/:id/complete", protect, authorize("admin", "manager", "housekeeping"), completeTask);
housekeepingRoutes.patch("/:id/cancel", protect, authorize("admin", "manager"), cancelTask);

export default housekeepingRoutes;