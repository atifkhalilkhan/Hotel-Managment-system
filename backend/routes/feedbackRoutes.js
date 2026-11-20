import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createGuestFeedback,
  createWebsiteFeedback,
  getPublicFeedback,
  getFeedback,
  getMyFeedback,
  moderateFeedback,
} from "../controllers/feedbackController.js";

const feedbackRoutes = Router();
const websiteSubmissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many feedback submissions. Please try again later." },
});

feedbackRoutes.get("/public", getPublicFeedback);
feedbackRoutes.post("/public", websiteSubmissionLimit, createWebsiteFeedback);
feedbackRoutes.post("/", protect, authorize("guest"), createGuestFeedback);
feedbackRoutes.get("/my", protect, authorize("guest"), getMyFeedback);
feedbackRoutes.get("/", protect, authorize("admin", "manager"), getFeedback);
feedbackRoutes.patch("/:id/moderate", protect, authorize("admin", "manager"), moderateFeedback);

export default feedbackRoutes;
