import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import User from "../models/User.js";

const DAY_MS = 24 * 60 * 60 * 1000;                    // ek din = itne milliseconds
const ACTIVE_STATUSES = ["confirmed", "checked-in"];   // "zinda" bookings (jo room rokti hain)
const STATUSES = ["confirmed", "checked-in", "checked-out", "cancelled"];

// populate mein sirf kaam ki fields mangwate hain (password jaisi cheezein kabhi nahi)
const POPULATE_GUEST = { path: "guest", select: "name email phone" };
const POPULATE_ROOM = { path: "room", select: "roomNumber type floor pricePerNight images" };


// ---------- Helper 1: tareekh ko saaf karna ----------
// "2026-12-01" ko Date banata hai aur time (ghanta/minute) hata deta hai.
// Galat tareekh ho to null deta hai.
const parseDate = (value) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// ---------- Helper 2: booking code (RES-0001, RES-0002...) ----------
const generateBookingCode = async () => {
  const count = await Reservation.countDocuments();
  return `RES-${String(count + 1).padStart(4, "0")}`;
};

// ---------- Helper 3: OVERLAP CHECK (sab se zaroori) ----------
// Is room ki koi zinda booking in dates se takra rahi hai? Mile to wo booking wapas deta hai.
const findConflict = (roomId, checkIn, checkOut, excludeId = null) => {
  const filter = {
    room: roomId,
    status: { $in: ACTIVE_STATUSES },
    checkIn: { $lt: checkOut },    // purani ka check-in < nayi ka check-out
    checkOut: { $gt: checkIn },    // purani ka check-out > nayi ka check-in
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Reservation.findOne(filter);
};


// ============ 1. BOOKING BANANA ============
export const createReservation = async (req, res, next) => {
  try {
    const { room: roomId, checkIn, checkOut, guestsCount, specialRequests } = req.body;

    if (!roomId || !checkIn || !checkOut || !guestsCount) {
      return res.status(400).json({ message: "Room, check-in, check-out and guests count are required" });
    }

    // --- Guest kaun hai? ---
    let guestId;
    if (req.user.role === "guest") {
      guestId = req.user._id;                       // guest sirf apne liye booking kar sakta hai
    } else {
      if (!req.body.guest) {
        return res.status(400).json({ message: "Guest is required" });
      }
      const guestUser = await User.findById(req.body.guest);
      if (!guestUser || guestUser.role !== "guest" || !guestUser.isActive) {
        return res.status(400).json({ message: "Guest not found or inactive" });
      }
      guestId = guestUser._id;
    }

    // --- Tareekhein check ---
    const checkInDate = parseDate(checkIn);
    const checkOutDate = parseDate(checkOut);

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Invalid dates" });
    }
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: "Check-out must be after check-in" });
    }
    const today = parseDate(new Date());
    if (checkInDate < today) {
      return res.status(400).json({ message: "Check-in cannot be in the past" });
    }

    // --- Room check ---
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (room.status === "maintenance") {
      return res.status(400).json({ message: "This room is under maintenance" });
    }
    if (Number(guestsCount) > room.capacity) {
      return res.status(400).json({ message: `This room allows at most ${room.capacity} guests` });
    }

    // --- Overlap check ---
    const conflict = await findConflict(room._id, checkInDate, checkOutDate);
    if (conflict) {
      return res.status(409).json({ message: "Room is already booked for these dates" });
    }

    // --- Hisaab ---
    const nights = Math.round((checkOutDate - checkInDate) / DAY_MS);
    const totalAmount = nights * room.pricePerNight;

    const reservation = await Reservation.create({
      bookingCode: await generateBookingCode(),
      guest: guestId,
      room: room._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestsCount,
      nights,
      pricePerNight: room.pricePerNight,   // price ki copy (snapshot)
      totalAmount,
      specialRequests,
      createdBy: req.user._id,
    });

    // ID ki jagah guest aur room ki details bhar do
    await reservation.populate([POPULATE_GUEST, POPULATE_ROOM]);

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
};


// ============ 2. SAB BOOKINGS (staff) ============
// Misal: GET /api/reservations?status=confirmed&search=RES-00&from=2026-12-01&to=2026-12-31&page=1&limit=10
export const getReservations = async (req, res, next) => {
  try {
    const { status, room, guest, search, from, to } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const filter = {};
    if (status) filter.status = status;
    if (room) filter.room = room;
    if (guest) filter.guest = guest;

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.bookingCode = new RegExp(safe, "i");
    }

    // Tareekh ki range: jo bookings [from, to] se takrati hain
    const fromDate = from ? parseDate(from) : null;
    const toDate = to ? parseDate(to) : null;
    if (fromDate) filter.checkOut = { $gt: fromDate };
    if (toDate) filter.checkIn = { $lt: toDate };

    const total = await Reservation.countDocuments(filter);

    const reservations = await Reservation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_GUEST)
      .populate(POPULATE_ROOM);

    res.json({ reservations, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};


// ============ 3. GUEST KI APNI BOOKINGS ============
export const getMyReservations = async (req, res, next) => {
  try {
    const filter = { guest: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const reservations = await Reservation.find(filter)
      .sort({ checkIn: -1 })
      .populate(POPULATE_ROOM);

    res.json(reservations);
  } catch (error) {
    next(error);
  }
};


// ============ 4. EK BOOKING ============
export const getReservationById = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate(POPULATE_GUEST)
      .populate(POPULATE_ROOM);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Guest sirf apni booking dekh sakta hai ("Own" wala usool)
    if (req.user.role === "guest" && reservation.guest._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view your own reservations" });
    }

    res.json(reservation);
  } catch (error) {
    next(error);
  }
};


// ============ 5. CANCEL ============
export const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (req.user.role === "guest" && reservation.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only cancel your own reservations" });
    }

    if (reservation.status !== "confirmed") {
      return res.status(400).json({ message: `Cannot cancel a ${reservation.status} reservation` });
    }

    reservation.status = "cancelled";
    reservation.cancelledAt = new Date();
    await reservation.save();

    res.json({ message: "Reservation cancelled", status: reservation.status });
  } catch (error) {
    next(error);
  }
};


// ============ 6. CHECK-IN ============
export const checkIn = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    if (reservation.status !== "confirmed") {
      return res.status(400).json({ message: `Cannot check in a ${reservation.status} reservation` });
    }

    const room = await Room.findById(reservation.room);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    // Room abhi tayyar (available) hona chahiye
    if (room.status !== "available") {
      return res.status(400).json({ message: `Room is ${room.status}, cannot check in now` });
    }

    reservation.status = "checked-in";
    reservation.checkedInAt = new Date();
    room.status = "occupied";

    await reservation.save();
    await room.save();

    await reservation.populate([POPULATE_GUEST, POPULATE_ROOM]);
    res.json({ message: "Checked in", reservation });
  } catch (error) {
    next(error);
  }
};


// ============ 7. CHECK-OUT ============
export const checkOut = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    if (reservation.status !== "checked-in") {
      return res.status(400).json({ message: `Cannot check out a ${reservation.status} reservation` });
    }

    const room = await Room.findById(reservation.room);

    reservation.status = "checked-out";
    reservation.checkedOutAt = new Date();
    await reservation.save();

    // Room safai ke liye (housekeeping baad mein "available" karegi)
    if (room) {
      room.status = "cleaning";
      await room.save();
    }

    await reservation.populate([POPULATE_GUEST, POPULATE_ROOM]);
    res.json({ message: "Checked out", reservation });
  } catch (error) {
    next(error);
  }
};