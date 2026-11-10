import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = "admin@luxurystay.com";
    const exists = await User.findOne({ email });
    if (exists) {
      console.log("Admin already exists");
      process.exit(0);
    }

    await User.create({
      name: "Super Admin",
      email,
      password: await bcrypt.hash("Admin@123", 10),
      role: "admin",
    });

    console.log("Admin created: admin@luxurystay.com / Admin@123");
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

seedAdmin();