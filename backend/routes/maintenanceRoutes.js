import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createRequest,
  getRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  cancelRequest,
} from "../controllers/maintenanceController.js";

const maintenanceRoutes = Router();

const ALL_ROLES = ["admin", "manager", "receptionist", "housekeeping", "guest"];

maintenanceRoutes.post("/", protect, authorize(...ALL_ROLES), createRequest);
maintenanceRoutes.get("/", protect, authorize("admin", "manager", "receptionist"), getRequests);

// "/my" ko "/:id" se PEHLE likhna zaroori hai
maintenanceRoutes.get("/my", protect, authorize("guest", "housekeeping"), getMyRequests);

maintenanceRoutes.get("/:id", protect, authorize(...ALL_ROLES), getRequestById);
maintenanceRoutes.patch("/:id/status", protect, authorize("admin", "manager"), updateRequestStatus);
maintenanceRoutes.patch("/:id/cancel", protect, authorize(...ALL_ROLES), cancelRequest);

export default maintenanceRoutes;