import mongoose from "mongoose";
import User from "../models/User.js";
import { hashPassword } from "../utils/hashPassword.js";
import { createAuditLog } from "../services/auditService.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error("getUsers error:", error);
    return res.status(500).json({
      message: "Failed to fetch users."
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role, isActive } = req.body || {};

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        message: "Username, email, password, and role are required."
      });
    }

    if (!["admin", "manager", "user"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role."
      });
    }

    const existing = await User.findOne({
      $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }]
    });

    if (existing) {
      return res.status(409).json({
        message: "Username or email already exists."
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      isActive: typeof isActive === "boolean" ? isActive : true
    });

    await createAuditLog({
      userId: req.user?._id,
      action: "CREATE_USER",
      entityType: "User",
      entityId: user._id,
      details: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

    return res.status(201).json({
      message: "User created successfully.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({
      message: "Failed to create user."
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive, password } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (username) {
      const existingUsername = await User.findOne({
        username: username.trim(),
        _id: { $ne: id }
      });

      if (existingUsername) {
        return res.status(409).json({
          message: "Another user already uses this username."
        });
      }

      user.username = username.trim();
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();

      const existingEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id }
      });

      if (existingEmail) {
        return res.status(409).json({
          message: "Another user already uses this email."
        });
      }

      user.email = normalizedEmail;
    }

    if (role) {
      if (!["admin", "manager", "user"].includes(role)) {
        return res.status(400).json({ message: "Invalid role." });
      }

      user.role = role;
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    if (password) {
      user.passwordHash = await hashPassword(password);
    }

    await user.save();

    await createAuditLog({
      userId: req.user?._id,
      action: "UPDATE_USER",
      entityType: "User",
      entityId: user._id,
      details: {
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });

    return res.status(200).json({
      message: "User updated successfully.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("updateUser error:", error);
    return res.status(500).json({
      message: "Failed to update user."
    });
  }
};