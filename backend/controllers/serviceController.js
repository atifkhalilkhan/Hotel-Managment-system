import ServiceRequest from "../models/ServiceRequest.js";
import Reservation from "../models/Reservation.js";
import Invoice from "../models/Invoice.js";
import { notifyRoles, notifyUsers } from "../utils/notifications.js";

const TYPES = ["room-service", "wake-up-call", "transportation", "other"];

const ALLOWED_NEXT = {
  pending: ["in-progress", "completed", "cancelled"],
  "in-progress": ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const LABEL = {
  "room-service": "Room service",
  "wake-up-call": "Wake-up call",
  transportation: "Transportation",
  other: "Service",
};
const CHARGE_CATEGORY = {
  "room-service": "room-service",
  transportation: "transport",
  "wake-up-call": "other",
  other: "other",
};

const POPULATE_ROOM = { path: "room", select: "roomNumber type floor" };
const POPULATE_GUEST = { path: "guest", select: "name phone avatar" };

const generateRequestNumber = async () => {
  const count = await ServiceRequest.countDocuments();
  return `SRV-${String(count + 1).padStart(4, "0")}`;
};

export const createRequest = async (req, res, next) => {
  try {
    const { reservation: reservationId, type, details, scheduledFor } = req.body;

    if (!reservationId || !type) {
      return res.status(400).json({ message: "Reservation and service type are required" });
    }
    if (!TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (req.user.role === "guest" && reservation.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only request services for your own stay" });
    }
    if (reservation.status !== "checked-in") {
      return res.status(400).json({ message: "Services can only be requested during an active stay" });
    }

    let when;
    if (scheduledFor) {
      when = new Date(scheduledFor);
      if (Number.isNaN(when.getTime())) {
        return res.status(400).json({ message: "Invalid date/time" });
      }
      if (when < new Date()) {
        return res.status(400).json({ message: "The requested time must be in the future" });
      }
    }
    if (["wake-up-call", "transportation"].includes(type) && !when) {
      return res.status(400).json({ message: "Please choose a date and time" });
    }
    if (["room-service", "transportation", "other"].includes(type) && !details?.trim()) {
      return res.status(400).json({ message: "Please describe your request" });
    }

    const request = await ServiceRequest.create({
      requestNumber: await generateRequestNumber(),
      reservation: reservation._id,
      room: reservation.room,
      guest: reservation.guest,
      type,
      details,
      scheduledFor: when,
      requestedBy: req.user._id,
    });

    await request.populate([POPULATE_ROOM, POPULATE_GUEST]);
    if (req.user.role === "guest") {
      await notifyRoles(["admin", "manager", "receptionist"], {
        type: "service",
        title: "New service request",
        message: `${request.requestNumber}: ${LABEL[request.type]} for Room ${request.room.roomNumber}.`,
        link: "/services",
      }, req.user._id);
    } else {
      await notifyUsers([request.guest._id], {
        type: "service",
        title: "Service requested",
        message: `A ${LABEL[request.type].toLowerCase()} request was created for your stay.`,
        link: "/my-services",
      }, req.user._id);
    }
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const { status, type, search } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.requestNumber = new RegExp(safe, "i");
    }

    const total = await ServiceRequest.countDocuments(filter);
    const requests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_ROOM)
      .populate(POPULATE_GUEST);

    res.json({ requests, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const filter = { guest: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const requests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate(POPULATE_ROOM);

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getRequestById = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate(POPULATE_ROOM)
      .populate(POPULATE_GUEST);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (req.user.role === "guest" && request.guest._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view your own requests" });
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, staffNotes } = req.body;

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (!ALLOWED_NEXT[request.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot change a ${request.status} request to ${status}` });
    }

    let invoice = null;
    let amount = 0;
    if (status === "completed" && req.body.amount !== undefined && req.body.amount !== "") {
      amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ message: "Amount must be a number, 0 or more" });
      }
      if (amount > 0) {
        invoice = await Invoice.findOne({ reservation: request.reservation });
        if (!invoice) {
          return res.status(400).json({ message: "Create the invoice first to add this charge (or complete without an amount)" });
        }
        if (invoice.status !== "unpaid") {
          return res.status(400).json({ message: `The invoice is already ${invoice.status}, the charge cannot be added` });
        }
      }
    }

    request.status = status;
    if (staffNotes) request.staffNotes = staffNotes;
    if (status === "in-progress") request.startedAt = new Date();
    if (status === "completed") request.completedAt = new Date();

    if (invoice && amount > 0) {
      invoice.charges.push({
        description: `${LABEL[request.type]} (${request.requestNumber})`,
        category: CHARGE_CATEGORY[request.type],
        quantity: 1,
        unitPrice: amount,
        amount,
        addedBy: req.user._id,
      });
      invoice.recalculate();
      await invoice.save();

      request.amount = amount;
      request.chargedToInvoice = true;
    }

    await request.save();
    await request.populate([POPULATE_ROOM, POPULATE_GUEST]);
    await notifyUsers([request.guest._id], {
      type: "service",
      title: "Service request updated",
      message: `Your request ${request.requestNumber} is now ${status}.`,
      link: "/my-services",
    }, req.user._id);

    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const cancelRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (req.user.role === "guest") {
      if (request.guest.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only cancel your own requests" });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ message: "You can only cancel a request that is still pending" });
      }
    } else if (!["pending", "in-progress"].includes(request.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${request.status} request` });
    }

    request.status = "cancelled";
    await request.save();
    if (req.user.role === "guest") {
      await notifyRoles(["admin", "manager", "receptionist"], {
        type: "service",
        title: "Service request cancelled",
        message: `${request.requestNumber} was cancelled by the guest.`,
        link: "/services",
      }, req.user._id);
    } else {
      await notifyUsers([request.guest], {
        type: "service",
        title: "Service request cancelled",
        message: `Your request ${request.requestNumber} was cancelled.`,
        link: "/my-services",
      }, req.user._id);
    }

    res.json({ message: "Request cancelled", status: request.status });
  } catch (error) {
    next(error);
  }
};
