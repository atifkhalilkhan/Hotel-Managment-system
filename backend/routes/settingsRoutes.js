import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const settingsRoutes = Router();

settingsRoutes.get("/", protect, getSettings);
settingsRoutes.put("/", protect, authorize("admin", "manager"), updateSettings);

export default settingsRoutes;
