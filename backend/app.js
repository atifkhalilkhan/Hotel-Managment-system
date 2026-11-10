import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import cors from "cors";
import roomRoutes from "./routes/roomRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";


const app = express();

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hotel Management System Backend is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", reservationRoutes); 



app.use(notFound);
app.use(errorHandler);

export default app;