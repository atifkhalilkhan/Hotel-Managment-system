import { Router } from "express";
import { getAnalyticsReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const reportRoutes = Router();

reportRoutes.use(protect, authorize("admin", "manager"));
reportRoutes.get("/analytics", getAnalyticsReport);

export default reportRoutes;
