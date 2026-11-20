import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  const { _id, name, email, role, phone, isActive, avatar, address, city, country, preferences } = req.user;
  res.json({ _id, name, email, role, phone, isActive, avatar, address, city, country, preferences });
};

const PREF_KEYS = ["roomType", "bedType", "smoking", "dietary", "notes"];

const parseObject = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, phone, address, city, country } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      user.name = name;
    }
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;

    const prefs = parseObject(req.body.preferences);
    if (prefs) {
      for (const key of PREF_KEYS) {
        if (prefs[key] === undefined) continue;
        user.set(`preferences.${key}`, prefs[key] === "" ? undefined : prefs[key]);
      }
    }

    let uploaded = null;
    let oldAvatarId = null;

    if (req.file) {
      uploaded = await uploadToCloudinary(req.file.buffer, "luxurystay/avatars", {
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      });
      oldAvatarId = user.avatar?.publicId;
      user.set("avatar", { url: uploaded.url, publicId: uploaded.publicId });
    } else if (req.body.removeAvatar === "true" || req.body.removeAvatar === true) {
      oldAvatarId = user.avatar?.publicId;
      user.set("avatar.url", undefined);
      user.set("avatar.publicId", undefined);
    }

    let updated;
    try {
      updated = await user.save();
    } catch (error) {
      if (uploaded) await deleteFromCloudinary(uploaded.publicId);
      throw error;
    }

    if (oldAvatarId) await deleteFromCloudinary(oldAvatarId);

    const { password, ...safe } = updated.toObject();
    res.json(safe);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  // JWT server par store nahi hota, asal logout frontend token delete karke karta hai
  res.json({ message: "Logged out successfully" });
};