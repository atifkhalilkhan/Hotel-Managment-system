import Feedback from "../models/Feedback.js";
import Reservation from "../models/Reservation.js";
import { notifyRoles, notifyUsers } from "../utils/notifications.js";

const PUBLIC_FIELDS = "displayName rating message verifiedStay createdAt";

const normalizePage = (value) => Math.max(parseInt(value, 10) || 1, 1);
const normalizeLimit = (value) => Math.min(Math.max(parseInt(value, 10) || 10, 1), 50);

const validateFeedback = (rating, message) => {
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return { error: "Rating must be a whole number from 1 to 5" };
  }
  if (typeof message !== "string" || !message.trim()) {
    return { error: "Feedback is required" };
  }
  if (message.trim().length > 1000) {
    return { error: "Feedback must be 1000 characters or fewer" };
  }
  return { rating: numericRating, message: message.trim() };
};

export const createGuestFeedback = async (req, res, next) => {
  try {
    const { reservation: reservationId, rating, message } = req.body;
    if (!reservationId) {
      return res.status(400).json({ message: "Reservation is required" });
    }

    const validation = validateFeedback(rating, message);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    if (reservation.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only leave feedback for your own stay" });
    }
    if (reservation.status !== "checked-out") {
      return res.status(400).json({ message: "Feedback can be submitted after checkout" });
    }
    if (await Feedback.exists({ reservation: reservation._id })) {
      return res.status(409).json({ message: "Feedback has already been submitted for this stay" });
    }

    const feedback = await Feedback.create({
      reservation: reservation._id,
      guest: req.user._id,
      displayName: req.user.name,
      rating: validation.rating,
      message: validation.message,
      source: "guest-app",
      verifiedStay: true,
    });

    await notifyRoles(["admin", "manager"], {
      type: "feedback",
      title: "Guest feedback submitted",
      message: `${req.user.name} submitted a ${validation.rating}-star stay review.`,
      link: "/feedback",
    }, req.user._id);
    res.status(201).json(feedback);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Feedback has already been submitted for this stay" });
    }
    next(error);
  }
};

export const createWebsiteFeedback = async (req, res, next) => {
  try {
    const { rating, message } = req.body;
    const displayName = typeof req.body.displayName === "string" ? req.body.displayName.trim() : "";
    const validation = validateFeedback(rating, message);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }
    if (!displayName || displayName.length > 80) {
      return res.status(400).json({ message: "Name is required and must be 80 characters or fewer" });
    }

    const feedback = await Feedback.create({
      displayName,
      rating: validation.rating,
      message: validation.message,
      source: "website",
      verifiedStay: false,
    });

    await notifyRoles(["admin", "manager"], {
      type: "feedback",
      title: "Website feedback submitted",
      message: `${displayName} submitted a ${validation.rating}-star review for moderation.`,
      link: "/feedback",
    });
    res.status(201).json({
      message: "Thank you. Your feedback has been submitted for review.",
      status: feedback.status,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicFeedback = async (req, res, next) => {
  try {
    const page = normalizePage(req.query.page);
    const limit = normalizeLimit(req.query.limit);
    const filter = { status: "approved" };
    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .select(PUBLIC_FIELDS)
        .sort({ reviewedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    res.json({ feedback, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

export const getFeedback = async (req, res, next) => {
  try {
    const page = normalizePage(req.query.page);
    const limit = normalizeLimit(req.query.limit);
    const filter = {};
    if (["pending", "approved", "rejected"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "guest", select: "name email" })
        .populate({ path: "reservation", select: "bookingCode room checkIn checkOut", populate: { path: "room", select: "roomNumber" } })
        .populate({ path: "reviewedBy", select: "name" }),
      Feedback.countDocuments(filter),
    ]);

    res.json({ feedback, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

export const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ guest: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "reservation", select: "bookingCode" })
      .lean();
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

export const moderateFeedback = async (req, res, next) => {
  try {
    const { status, moderationNotes } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }
    if (moderationNotes !== undefined && (typeof moderationNotes !== "string" || moderationNotes.trim().length > 300)) {
      return res.status(400).json({ message: "Moderation notes must be 300 characters or fewer" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.status = status;
    feedback.reviewedBy = req.user._id;
    feedback.reviewedAt = new Date();
    if (moderationNotes !== undefined) feedback.moderationNotes = moderationNotes.trim();
    await feedback.save();
    if (feedback.guest) {
      await notifyUsers([feedback.guest], {
        type: "feedback",
        title: "Feedback review complete",
        message: `Your feedback has been ${status}.`,
        link: "/my-bookings",
      }, req.user._id);
    }
    await feedback.populate([
      { path: "guest", select: "name email" },
      { path: "reservation", select: "bookingCode room checkIn checkOut", populate: { path: "room", select: "roomNumber" } },
      { path: "reviewedBy", select: "name" },
    ]);

    res.json(feedback);
  } catch (error) {
    next(error);
  }
};
