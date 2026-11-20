import HousekeepingTask from "../models/HousekeepingTask.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { notifyRoles, notifyUsers } from "../utils/notifications.js";

const OPEN_STATUSES = ["pending", "in-progress"];   // "khule" tasks

const POPULATE_ROOM = { path: "room", select: "roomNumber type floor status" };
const POPULATE_ASSIGNEE = { path: "assignedTo", select: "name phone" };

// ---------- Helper: task sirf us ka jise assign hua (ya admin/manager) ----------
const canWorkOn = (task, user) =>
  ["admin", "manager"].includes(user.role) ||
  (task.assignedTo && task.assignedTo.toString() === user._id.toString());


// ============ 1. TASK BANANA (admin, manager) ============
export const createTask = async (req, res, next) => {
  try {
    const { room: roomId, type, priority, assignedTo, notes } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room is required" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Agar kisi ko assign kar rahe ho to wo asli, active housekeeping staff ho
    if (assignedTo) {
      const staff = await User.findById(assignedTo);
      if (!staff || staff.role !== "housekeeping" || !staff.isActive) {
        return res.status(400).json({ message: "Assigned user must be an active housekeeping staff" });
      }
    }

    const task = await HousekeepingTask.create({
      room: room._id,
      type,
      priority,
      assignedTo: assignedTo || undefined,
      notes,
      createdBy: req.user._id,
    });

    await task.populate([POPULATE_ROOM, POPULATE_ASSIGNEE]);
    const notification = {
      type: "housekeeping",
      title: "New housekeeping task",
      message: `Room ${task.room.roomNumber} has a ${task.type.replaceAll("-", " ")} task.`,
      link: "/housekeeping",
    };
    if (task.assignedTo?._id) {
      await notifyUsers([task.assignedTo._id], notification, req.user._id);
    } else {
      await notifyRoles(["housekeeping"], notification, req.user._id);
    }
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};


// ============ 2. SAB TASKS (admin, manager, receptionist) ============
// GET /api/housekeeping?status=pending&priority=high&assignedTo=<id>&search=101&page=1&limit=10
export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, type, assignedTo, search } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Room number se dhundna: pehle matching rooms nikalo, phir un ke tasks
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rooms = await Room.find({ roomNumber: new RegExp(safe, "i") }).select("_id");
      filter.room = { $in: rooms.map((r) => r._id) };
    }

    const total = await HousekeepingTask.countDocuments(filter);

    const tasks = await HousekeepingTask.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_ROOM)
      .populate(POPULATE_ASSIGNEE);

    res.json({ tasks, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};


// ============ 3. MERE TASKS (housekeeping) ============
export const getMyTasks = async (req, res, next) => {
  try {
    const filter = { assignedTo: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const tasks = await HousekeepingTask.find(filter)
      .sort({ createdAt: -1 })
      .populate(POPULATE_ROOM);

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};


// ============ 4. KHULE TASKS JO KISI KO ASSIGN NAHI (housekeeping, admin, manager) ============
export const getOpenTasks = async (req, res, next) => {
  try {
    const tasks = await HousekeepingTask.find({
      status: "pending",
      assignedTo: { $exists: false },
    })
      .sort({ createdAt: 1 })
      .populate(POPULATE_ROOM);

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};


// ============ 5. ASSIGN KARNA (admin, manager) ============
// body: { assignedTo }
export const assignTask = async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (!OPEN_STATUSES.includes(task.status)) {
      return res.status(400).json({ message: `Cannot assign a ${task.status} task` });
    }

    const staff = await User.findById(req.body.assignedTo);
    if (!staff || staff.role !== "housekeeping" || !staff.isActive) {
      return res.status(400).json({ message: "Assigned user must be an active housekeeping staff" });
    }

    task.assignedTo = staff._id;
    await task.save();
    await task.populate([POPULATE_ROOM, POPULATE_ASSIGNEE]);
    await notifyUsers([staff._id], {
      type: "housekeeping",
      title: "Task assigned to you",
      message: `Room ${task.room.roomNumber} task has been assigned to you.`,
      link: "/housekeeping",
    }, req.user._id);

    res.json(task);
  } catch (error) {
    next(error);
  }
};


// ============ 6. KHUD LENA (housekeeping: jo task kisi ka nahi) ============
export const claimTask = async (req, res, next) => {
  try {
    // Ek hi query mein "dhundo aur lo": do log ek saath claim karein to sirf ek ko mile
    const task = await HousekeepingTask.findOneAndUpdate(
      { _id: req.params.id, status: "pending", assignedTo: { $exists: false } },
      { assignedTo: req.user._id },
      { new: true }
    )
      .populate(POPULATE_ROOM)
      .populate(POPULATE_ASSIGNEE);

    if (!task) {
      return res.status(400).json({ message: "Task is not available (already taken or not pending)" });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};


// ============ 7. SHURU KARNA ============
export const startTask = async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (!canWorkOn(task, req.user)) {
      return res.status(403).json({ message: "This task is not assigned to you" });
    }
    if (task.status !== "pending") {
      return res.status(400).json({ message: `Cannot start a ${task.status} task` });
    }

    task.status = "in-progress";
    task.startedAt = new Date();
    await task.save();
    await task.populate([POPULATE_ROOM, POPULATE_ASSIGNEE]);

    res.json(task);
  } catch (error) {
    next(error);
  }
};


// ============ 8. MUKAMMAL KARNA (room khud available ho sakta hai) ============
export const completeTask = async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (!canWorkOn(task, req.user)) {
      return res.status(403).json({ message: "This task is not assigned to you" });
    }
    if (!OPEN_STATUSES.includes(task.status)) {
      return res.status(400).json({ message: `Cannot complete a ${task.status} task` });
    }

    task.status = "completed";
    task.completedAt = new Date();
    if (!task.startedAt) task.startedAt = task.completedAt;
    await task.save();

    // Room "cleaning" mein hai aur is room ke koi aur khule task nahi, to available kar do
    const room = await Room.findById(task.room);
    let roomStatus = room ? room.status : null;

    if (room && room.status === "cleaning") {
      const otherOpen = await HousekeepingTask.countDocuments({
        room: room._id,
        status: { $in: OPEN_STATUSES },
        _id: { $ne: task._id },
      });

      if (otherOpen === 0) {
        room.status = "available";
        await room.save();
        roomStatus = room.status;
      }
    }

    await task.populate([POPULATE_ROOM, POPULATE_ASSIGNEE]);
    res.json({ message: "Task completed", task, roomStatus });
  } catch (error) {
    next(error);
  }
};


// ============ 9. CANCEL (admin, manager) ============
export const cancelTask = async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (!OPEN_STATUSES.includes(task.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${task.status} task` });
    }

    task.status = "cancelled";
    await task.save();

    res.json({ message: "Task cancelled", status: task.status });
  } catch (error) {
    next(error);
  }
};