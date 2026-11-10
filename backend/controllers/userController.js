import bcrypt from "bcryptjs";
import User from "../models/User.js";

const ROLES = ["admin", "manager", "receptionist", "housekeeping", "guest"];

// Staff banana (sirf admin)
export const createUser = async (req, res, next) => {
  try {
    let { name, email, password, phone, role } = req.body;

// Receptionist sirf guest bana sakti hai
if (req.user.role === "receptionist") role = "guest";

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, phone, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// Sab users, optional filter: /api/users?role=receptionist
export const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    // Receptionist sirf active guests dekh sakti hai
    if (req.user.role === "receptionist") {
      filter.role = "guest";
      filter.isActive = true;
    }

    if (req.query.search) {
      const safe = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Ek user
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// User edit (naam, phone, role)
export const updateUser = async (req, res, next) => {
  try {
    const { name, phone, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;

    const updated = await user.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone,
      isActive: updated.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// Activate / Deactivate
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: user.isActive ? "User activated" : "User deactivated",
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};