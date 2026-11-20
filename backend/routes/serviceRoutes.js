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
} from "../controllers/serviceController.js";

const serviceRoutes = Router();

const ROLES = ["admin", "manager", "receptionist", "guest"];
const STAFF = ["admin", "manager", "receptionist"];

serviceRoutes.post("/", protect, authorize(...ROLES), createRequest);
serviceRoutes.get("/", protect, authorize(...STAFF), getRequests);
serviceRoutes.get("/my", protect, authorize("guest"), getMyRequests);
serviceRoutes.get("/:id", protect, authorize(...ROLES), getRequestById);
serviceRoutes.patch("/:id/status", protect, authorize(...STAFF), updateRequestStatus);
serviceRoutes.patch("/:id/cancel", protect, authorize(...ROLES), cancelRequest);

export default serviceRoutes;
