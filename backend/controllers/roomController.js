import Room from "../models/Room.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";
import Reservation from "../models/Reservation.js";
const STATUSES = ["available", "occupied", "cleaning", "maintenance"];
const MAX_IMAGES = 5;

// ---------- Helper: form-data se list nikalna ----------
// Form-data mein list text ki shakal mein aati hai: "WiFi, AC, TV" ya '["WiFi","AC"]'
// Ye function dono ko asli array bana deta hai.
const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  const text = String(value).trim();
  if (text.startsWith("[")) {
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  }
  return text.split(",").map((item) => item.trim()).filter(Boolean);
};


// ============ 1. ROOM BANANA (tasveeron ke saath) ============
export const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, type, pricePerNight, floor, capacity, status, description } = req.body;

    if (!roomNumber || !type || !pricePerNight || !floor || !capacity) {
      return res.status(400).json({ message: "Room number, type, price, floor and capacity are required" });
    }

    // Tasveer upload karne se PEHLE duplicate check, taake bekaar upload na ho
    const exists = await Room.findOne({ roomNumber });
    if (exists) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    // Tasveerein Cloudinary par bhejo (req.files multer ne banai)
    let images = [];
    if (req.files?.length) {
      images = await Promise.all(req.files.map((file) => uploadToCloudinary(file.buffer)));
    }

    let room;
    try {
      room = await Room.create({
        roomNumber,
        type,
        pricePerNight,
        floor,
        capacity,
        status,
        description,
        amenities: toArray(req.body.amenities),
        images,
      });
    } catch (error) {
      // Room save fail hua to upload ki hui tasveerein wapas hata do (safai)
      await Promise.all(images.map((img) => deleteFromCloudinary(img.publicId)));
      throw error; // bahar wale catch ko bhej do
    }

    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};


// ============ 2. SAB ROOMS (search + filter + pagination) ============
// Misal: GET /api/rooms?search=101&type=suite&status=available&page=2&limit=8
export const getRooms = async (req, res, next) => {
  try {
    const { search, type, status, minPrice, maxPrice } = req.query;

    // Page aur limit ko number banao, aur hadd mein rakho
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 8, 1), 50);

    const filter = {};

    // Search: room number ya description mein lafz dhundo
    if (search) {
      // Khaas nishan (. * + ? etc.) ko normal text bana do, warna regex toot sakta hai
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i"); // "i" = capital/small ka farq nahi
      filter.$or = [{ roomNumber: regex }, { description: regex }];
    }

    if (type) filter.type = type;
    if (status) filter.status = status;

    // Price range
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    // Guest ko sirf available rooms dikhao (access matrix ke mutabiq)
    if (req.user.role === "guest") {
      filter.status = "available";
    }

    const total = await Room.countDocuments(filter);

    const rooms = await Room.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      rooms,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};


// ============ 3. AVAILABLE ROOMS (dates ke hisaab se) ============
// Misal: GET /api/rooms/available?checkIn=2026-12-01&checkOut=2026-12-05&guests=2&type=double
export const getAvailableRooms = async (req, res, next) => {
  try {
    const { type, guests, checkIn, checkOut } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (guests) filter.capacity = { $gte: Number(guests) };

    if (checkIn && checkOut) {
      // Tareekh saaf karo (sirf din, waqt nahi)
      const from = new Date(checkIn);
      const to = new Date(checkOut);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return res.status(400).json({ message: "Invalid dates" });
      }
      from.setUTCHours(0, 0, 0, 0);
      to.setUTCHours(0, 0, 0, 0);
      if (to <= from) {
        return res.status(400).json({ message: "Check-out must be after check-in" });
      }

      // In dates par jo rooms banay hue hain, un ki IDs nikalo (wahi overlap formula)
      const busyRoomIds = await Reservation.find({
        status: { $in: ["confirmed", "checked-in"] },
        checkIn: { $lt: to },
        checkOut: { $gt: from },
      }).distinct("room");

      // Busy rooms nikal do, aur maintenance wale bhi
      filter._id = { $nin: busyRoomIds };
      filter.status = { $ne: "maintenance" };
    } else {
      // Dates nahi di to sirf wo rooms jo abhi available hain
      filter.status = "available";
    }

    const rooms = await Room.find(filter).sort({ pricePerNight: 1 });
    res.json(rooms);
  } catch (error) {
    next(error);
  }
};


// ============ 4. EK ROOM ============
export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    next(error);
  }
};


// ============ 5. ROOM EDIT (naye images add + purane hatana) ============
export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const { roomNumber, type, pricePerNight, floor, capacity, description } = req.body;

    if (roomNumber !== undefined) room.roomNumber = roomNumber;
    if (type !== undefined) room.type = type;
    if (pricePerNight !== undefined) room.pricePerNight = pricePerNight;
    if (floor !== undefined) room.floor = floor;
    if (capacity !== undefined) room.capacity = capacity;
    if (description !== undefined) room.description = description;
    if (req.body.amenities !== undefined) room.amenities = toArray(req.body.amenities);

    // Jo tasveerein hatani hain (publicId ki list)
    const removeIds = toArray(req.body.removeImages);
    const newCount = req.files?.length || 0;
    const remaining = room.images.filter((img) => !removeIds.includes(img.publicId));

    if (remaining.length + newCount > MAX_IMAGES) {
      return res.status(400).json({ message: `A room can have at most ${MAX_IMAGES} images` });
    }

    // Naye images upload
    let added = [];
    if (newCount) {
      added = await Promise.all(req.files.map((file) => uploadToCloudinary(file.buffer)));
    }

    room.images = [...remaining, ...added];

    let updated;
    try {
      updated = await room.save();
    } catch (error) {
      await Promise.all(added.map((img) => deleteFromCloudinary(img.publicId)));
      throw error;
    }

    // Save kamyab hone ke BAAD purani tasveerein Cloudinary se hatao
    await Promise.all(removeIds.map((id) => deleteFromCloudinary(id)));

    res.json(updated);
  } catch (error) {
    next(error);
  }
};


// ============ 6. ROOM STATUS BADALNA ============
export const updateRoomStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(", ")}` });
    }

    // Housekeeping room ko "occupied" nahi kar sakti (wo reception ka kaam hai)
    if (req.user.role === "housekeeping" && status === "occupied") {
      return res.status(403).json({ message: "Housekeeping cannot mark a room as occupied" });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.status = status;
    await room.save();

    res.json({ message: "Room status updated", _id: room._id, status: room.status });
  } catch (error) {
    next(error);
  }
};


// ============ 7. ROOM DELETE (sirf admin) ============
export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status === "occupied") {
      return res.status(400).json({ message: "Cannot delete an occupied room" });
    }

    // Pehle Cloudinary se tasveerein hatao, phir room
    await Promise.all(room.images.map((img) => deleteFromCloudinary(img.publicId)));
    await room.deleteOne();

    res.json({ message: "Room deleted" });
  } catch (error) {
    next(error);
  }
};