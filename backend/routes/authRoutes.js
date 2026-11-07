import {Router} from "express";
import { login, register, getMe, updateProfile, changePassword, logout } from "../controllers/authController.js";

const authRoutes = Router();

authRoutes.post("/register",register);

authRoutes.post("/login", login); 

authRoutes.get("/me", getMe);

authRoutes.put("/update-profile", updateProfile);                 

authRoutes.put("/change-password", changePassword);

authRoutes.post("/logout", logout);

export default authRoutes;