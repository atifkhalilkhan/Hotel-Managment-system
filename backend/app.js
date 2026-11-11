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

const app = express();

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));

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


app.use(notFound);
app.use(errorHandler);

export default app;