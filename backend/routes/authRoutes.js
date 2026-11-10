import {Router} from "express";
import { login, register, getMe, updateProfile, changePassword, logout } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const authRoutes = Router();

authRoutes.post("/register", register);

authRoutes.post("/login", login); 

authRoutes.get("/me", protect, getMe);

authRoutes.put("/update-profile", protect, updateProfile);

authRoutes.put("/change-password", protect, changePassword);

authRoutes.post("/logout", protect, logout);

export default authRoutes;