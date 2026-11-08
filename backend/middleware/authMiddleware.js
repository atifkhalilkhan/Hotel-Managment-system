import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
         const authheader = req.headers.authorization;
          if(!authheader || !authheader.startsWith("Bearer")){
             return res.status(401).json({message:"Not authorized, no token"})
           }

          const token = authheader.split(" ")[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id).select("-password");
          if(!user || !user.isActive){
            return res.status(401).json({message:"Not authorized, user not found"})
          }
          req.user = user;
          next();
    } catch (error) {
         res.status(401).json({message:"Not authorized, token failed"})
    }

}