import User from "../models/User.js";
import { hashPassword } from "../utils/hashPassword.js";

export const seedAdmin = async () => {
  try {
    const username = process.env.SAMPLE_ADMIN_USERNAME;
    const email = process.env.SAMPLE_ADMIN_EMAIL;
    const password = process.env.SAMPLE_ADMIN_PASSWORD;

    if (!username || !email || !password) {
      console.warn("Sample admin seed skipped: missing env values.");
      return;
    }

    const existingAdmin = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingAdmin) {
      console.log("Sample admin already exists.");
      return;
    }

    const passwordHash = await hashPassword(password);

    await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      role: "admin",
      isActive: true
    });

    console.log("Sample admin created successfully.");
  } catch (error) {
    console.error("Failed to seed sample admin:", error.message);
  }
};