import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createInvoice,
  getInvoices,
  getMyInvoices,
  getBillingReport,
  getInvoiceById,
  downloadInvoicePdf,
  addCharge,
  removeCharge,
  applyDiscount,
  markPaid,
  voidInvoice,
} from "../controllers/invoiceController.js";

const invoiceRoutes = Router();

invoiceRoutes.post("/", protect, authorize("admin", "receptionist"), createInvoice);
invoiceRoutes.get("/", protect, authorize("admin", "manager", "receptionist"), getInvoices);

// "/my" aur "/report" ko "/:id" se PEHLE likhna zaroori hai
invoiceRoutes.get("/my", protect, authorize("guest"), getMyInvoices);
invoiceRoutes.get("/report", protect, authorize("admin", "manager"), getBillingReport);

invoiceRoutes.get("/:id", protect, authorize("admin", "manager", "receptionist", "guest"), getInvoiceById);
invoiceRoutes.get("/:id/pdf", protect, authorize("admin", "manager", "receptionist", "guest"), downloadInvoicePdf);

invoiceRoutes.post("/:id/charges", protect, authorize("admin", "manager", "receptionist"), addCharge);
invoiceRoutes.delete("/:id/charges/:chargeId", protect, authorize("admin", "manager", "receptionist"), removeCharge);
invoiceRoutes.patch("/:id/discount", protect, authorize("admin", "manager"), applyDiscount);
invoiceRoutes.patch("/:id/pay", protect, authorize("admin", "receptionist"), markPaid);
invoiceRoutes.patch("/:id/void", protect, authorize("admin"), voidInvoice);

export default invoiceRoutes;