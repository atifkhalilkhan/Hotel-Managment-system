import Invoice from "../models/Invoice.js";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function asDay(value) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function dateRange(field, from, toEnd) {
  return { [field]: { $gte: from, $lt: toEnd } };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

export const getAnalyticsReport = async (req, res, next) => {
  try {
    const today = asDay(new Date());
    const requestedFrom = req.query.from ? parseDay(req.query.from) : null;
    const requestedTo = req.query.to ? parseDay(req.query.to) : null;
    if ((req.query.from && !requestedFrom) || (req.query.to && !requestedTo)) {
      return res.status(400).json({ message: "Dates must use YYYY-MM-DD format" });
    }

    const from = requestedFrom || new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const to = requestedTo || today;
    if (from > to) {
      return res.status(400).json({ message: "Start date must be on or before end date" });
    }

    const days = Math.floor((to.getTime() - from.getTime()) / DAY_MS) + 1;
    if (days > 366) {
      return res.status(400).json({ message: "Analytics date range cannot exceed 366 days" });
    }
    const toEnd = new Date(to.getTime() + DAY_MS);
    const createdRange = dateRange("createdAt", from, toEnd);
    const paidRange = dateRange("paidAt", from, toEnd);

    const [
      reservationCounts,
      cancellationCount,
      checkInCount,
      checkOutCount,
      overlappingReservations,
      paidInvoices,
      unpaidTotals,
      roomCount,
    ] = await Promise.all([
      Reservation.aggregate([
        { $match: createdRange },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Reservation.countDocuments({ status: "cancelled", ...dateRange("cancelledAt", from, toEnd) }),
      Reservation.countDocuments(dateRange("checkedInAt", from, toEnd)),
      Reservation.countDocuments(dateRange("checkedOutAt", from, toEnd)),
      Reservation.find({
        status: { $ne: "cancelled" },
        checkIn: { $lt: toEnd },
        checkOut: { $gt: from },
      }).select("checkIn checkOut").lean(),
      Invoice.find({ status: "paid", ...paidRange })
        .select("paidAt total roomCharges reservation")
        .lean(),
      Invoice.aggregate([
        { $match: { status: "unpaid" } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$total" } } },
      ]),
      Room.countDocuments({}),
    ]);

    const dailyByDate = new Map();
    for (let timestamp = from.getTime(); timestamp < toEnd.getTime(); timestamp += DAY_MS) {
      const date = new Date(timestamp).toISOString().slice(0, 10);
      dailyByDate.set(date, { date, bookings: 0, revenue: 0, bookedRoomNights: 0 });
    }

    const countsByStatus = Object.fromEntries(reservationCounts.map((entry) => [entry._id, entry.count]));
    const reservationsCreated = await Reservation.find(createdRange).select("createdAt").lean();
    for (const reservation of reservationsCreated) {
      const date = asDay(reservation.createdAt).toISOString().slice(0, 10);
      const daily = dailyByDate.get(date);
      if (daily) daily.bookings += 1;
    }

    let bookedRoomNights = 0;
    for (const reservation of overlappingReservations) {
      const firstNight = Math.max(asDay(reservation.checkIn).getTime(), from.getTime());
      const lastNight = Math.min(asDay(reservation.checkOut).getTime(), toEnd.getTime());
      for (let timestamp = firstNight; timestamp < lastNight; timestamp += DAY_MS) {
        const daily = dailyByDate.get(new Date(timestamp).toISOString().slice(0, 10));
        if (daily) {
          daily.bookedRoomNights += 1;
          bookedRoomNights += 1;
        }
      }
    }

    const paidRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const roomRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.roomCharges || 0), 0);
    for (const invoice of paidInvoices) {
      const date = asDay(invoice.paidAt).toISOString().slice(0, 10);
      const daily = dailyByDate.get(date);
      if (daily) daily.revenue += Number(invoice.total || 0);
    }

    const paidReservations = paidInvoices.length
      ? await Reservation.find({ _id: { $in: paidInvoices.map((invoice) => invoice.reservation) } }).select("nights").lean()
      : [];
    const paidRoomNights = paidReservations.reduce((sum, reservation) => sum + Number(reservation.nights || 0), 0);
    const totalRoomNights = roomCount * days;
    const unpaid = unpaidTotals[0] || { count: 0, amount: 0 };

    return res.json({
      range: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        days,
      },
      bookings: {
        total: Object.values(countsByStatus).reduce((sum, count) => sum + count, 0),
        confirmed: countsByStatus.confirmed || 0,
        checkedIn: countsByStatus["checked-in"] || 0,
        checkedOut: countsByStatus["checked-out"] || 0,
        cancelled: countsByStatus.cancelled || 0,
        checkIns: checkInCount,
        checkOuts: checkOutCount,
      },
      cancellations: cancellationCount,
      occupancy: {
        rooms: roomCount,
        bookedRoomNights,
        totalRoomNights,
        rate: totalRoomNights ? round((bookedRoomNights / totalRoomNights) * 100) : 0,
      },
      revenue: {
        paid: round(paidRevenue),
        room: round(roomRevenue),
        outstanding: round(unpaid.amount || 0),
        unpaidInvoices: unpaid.count || 0,
        averageDailyRate: paidRoomNights ? round(roomRevenue / paidRoomNights) : 0,
        revPAR: totalRoomNights ? round(roomRevenue / totalRoomNights) : 0,
      },
      daily: [...dailyByDate.values()].map((entry) => ({
        ...entry,
        revenue: round(entry.revenue),
        occupancyRate: roomCount ? round((entry.bookedRoomNights / roomCount) * 100) : 0,
      })),
    });
  } catch (error) {
    return next(error);
  }
};
