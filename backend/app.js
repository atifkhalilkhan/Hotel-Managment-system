import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import cors from "cors";
import roomRoutes from "./routes/roomRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import { handleWebhook } from "./controllers/paymentController.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import housekeepingRoutes from "./routes/housekeepingRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
       "http://localhost:5175",
      ...(process.env.FRONTEND_URL || "").split(",").map((value) => value.trim().replace(/\/+$/, "")).filter(Boolean),
    ];
    callback(null, !origin || allowedOrigins.includes(origin));
  },
}));

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hotel Management System Backend is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", reservationRoutes); 
app.use("/api/invoices", invoiceRoutes);  
app.use("/api/payments", paymentRoutes);
app.use("/api/housekeeping", housekeepingRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;