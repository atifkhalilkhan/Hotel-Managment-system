import MaintenanceRequest from "../models/MaintenanceRequest.js";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import { notifyRoles, notifyUsers } from "../utils/notifications.js";

const OPEN_STATUSES = ["open", "in-progress"];
const STAFF_ROLES = ["admin", "manager"];

const POPULATE_ROOM = { path: "room", select: "roomNumber type floor status" };
const POPULATE_REPORTER = { path: "reportedBy", select: "name role phone" };

// MNT-0001, MNT-0002 ...
const generateTicketNumber = async () => {
  const count = await MaintenanceRequest.countDocuments();
  return `MNT-${String(count + 1).padStart(4, "0")}`;
};

// Room "maintenance" mein hai aur us ke koi aur khule blocking tickets nahi, to available kar do
const releaseRoomIfFree = async (roomId, excludeId) => {
  if (!roomId) return;

  const room = await Room.findById(roomId);
  if (!room || room.status !== "maintenance") return;

  const stillBlocked = await MaintenanceRequest.countDocuments({
    room: roomId,
    blocksRoom: true,
    status: { $in: OPEN_STATUSES },
    _id: { $ne: excludeId },
  });

  if (stillBlocked === 0) {
    room.status = "available";
    await room.save();
  }
};


// ============ 1. REPORT KARNA (sab roles) ============
// body: { room?, location?, title, description?, blocksRoom? }
export const createRequest = async (req, res, next) => {
  try {
    const { room: roomId, location, title, description } = req.body;
    let blocksRoom = req.body.blocksRoom === true || req.body.blocksRoom === "true";

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!roomId && !location) {
      return res.status(400).json({ message: "Please provide a room or a location" });
    }

    let room = null;
    if (roomId) {
      room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
    }

    // Guest sirf apne current (checked-in) kamray ka masla report kar sakta hai
    if (req.user.role === "guest") {
      if (!room) {
        return res.status(400).json({ message: "Please select your room" });
      }
      const staying = await Reservation.findOne({
        guest: req.user._id,
        room: room._id,
        status: "checked-in",
      });
      if (!staying) {
        return res.status(403).json({ message: "You can only report issues for the room you are staying in" });
      }
      blocksRoom = false;   // guest room band nahi kar sakta, ye staff ka faisla hai
    }

    const request = await MaintenanceRequest.create({
      ticketNumber: await generateTicketNumber(),
      room: room?._id,
      location,
      title,
      description,
      blocksRoom: room ? blocksRoom : false,
      reportedBy: req.user._id,
    });

    // Room ko maintenance mein bhejna: sirf jab khali ho (guest andar ho to nahi)
    if (room && request.blocksRoom && ["available", "cleaning"].includes(room.status)) {
      room.status = "maintenance";
      await room.save();
    }

    await request.populate([POPULATE_ROOM, POPULATE_REPORTER]);
    if (["guest", "housekeeping"].includes(req.user.role)) {
      await notifyRoles(["admin", "manager", "receptionist"], {
        type: "maintenance",
        title: "New maintenance report",
        message: `${request.ticketNumber}: ${request.title}`,
        link: "/maintenance",
      }, req.user._id);
    }
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};


// ============ 2. SAB REQUESTS (admin, manager, receptionist) ============
// GET /api/maintenance?status=open&room=<id>&search=MNT-00&page=1&limit=10
export const getRequests = async (req, res, next) => {
  try {
    const { status, room, search } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const filter = {};
    if (status) filter.status = status;
    if (room) filter.room = room;

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i");
      filter.$or = [{ ticketNumber: regex }, { title: regex }];
    }

    const total = await MaintenanceRequest.countDocuments(filter);

    const requests = await MaintenanceRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_ROOM)
      .populate(POPULATE_REPORTER);

    res.json({ requests, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};


// ============ 3. MERI REPORTS (guest, housekeeping) ============
export const getMyRequests = async (req, res, next) => {
  try {
    const filter = { reportedBy: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const requests = await MaintenanceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate(POPULATE_ROOM);

    res.json(requests);
  } catch (error) {
    next(error);
  }
};


// ============ 4. EK REQUEST ============
export const getRequestById = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate(POPULATE_ROOM)
      .populate(POPULATE_REPORTER);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Guest aur housekeeping sirf apni report dekh sakte hain
    const isOwner = request.reportedBy._id.toString() === req.user._id.toString();
    const canSeeAll = ["admin", "manager", "receptionist"].includes(req.user.role);
    if (!isOwner && !canSeeAll) {
      return res.status(403).json({ message: "You can only view your own requests" });
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};


// ============ 5. STATUS BADLANA (admin, manager) ============
// body: { status: "in-progress" | "resolved" | "cancelled", resolutionNotes? }
const ALLOWED_NEXT = {
  open: ["in-progress", "resolved", "cancelled"],
  "in-progress": ["resolved", "cancelled"],
  resolved: [],
  cancelled: [],
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, resolutionNotes } = req.body;

    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (!ALLOWED_NEXT[request.status].includes(status)) {
      return res.status(400).json({ message: `Cannot change a ${request.status} request to ${status}` });
    }

    request.status = status;
    if (resolutionNotes) request.resolutionNotes = resolutionNotes;
    if (status === "in-progress") request.startedAt = new Date();
    if (status === "resolved") request.resolvedAt = new Date();
    await request.save();

    // Kaam khatam (ya radd) to room wapas available (agar koi aur blocking ticket na ho)
    if (["resolved", "cancelled"].includes(status)) {
      await releaseRoomIfFree(request.room, request._id);
    }

    await request.populate([POPULATE_ROOM, POPULATE_REPORTER]);
    await notifyUsers([request.reportedBy._id], {
      type: "maintenance",
      title: "Maintenance report updated",
      message: `Report ${request.ticketNumber} is now ${status}.`,
      link: ["guest", "housekeeping"].includes(request.reportedBy.role) ? "/my-issues" : "/maintenance",
    }, req.user._id);
    res.json(request);
  } catch (error) {
    next(error);
  }
};


// ============ 6. CANCEL (apni report, jab tak "open" ho; ya admin/manager) ============
export const cancelRequest = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isOwner = request.reportedBy.toString() === req.user._id.toString();
    if (!isOwner && !STAFF_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "You can only cancel your own requests" });
    }
    if (request.status !== "open") {
      return res.status(400).json({ message: `Cannot cancel a ${request.status} request` });
    }

    request.status = "cancelled";
    await request.save();
    await releaseRoomIfFree(request.room, request._id);
    if (["guest", "housekeeping"].includes(req.user.role)) {
      await notifyRoles(["admin", "manager", "receptionist"], {
        type: "maintenance",
        title: "Maintenance report cancelled",
        message: `${request.ticketNumber} was cancelled by the reporter.`,
        link: "/maintenance",
      }, req.user._id);
    } else {
      await notifyUsers([request.reportedBy], {
        type: "maintenance",
        title: "Maintenance report cancelled",
        message: `Report ${request.ticketNumber} was cancelled.`,
        link: "/my-issues",
      }, req.user._id);
    }

    res.json({ message: "Request cancelled", status: request.status });
  } catch (error) {
    next(error);
  }
};