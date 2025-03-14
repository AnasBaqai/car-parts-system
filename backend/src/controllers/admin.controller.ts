import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import jwt from "jsonwebtoken";

// Get all users (for admin dashboard)
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Access denied. Admin only." });
      return;
    }

    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pending users (for admin dashboard)
export const getPendingUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Access denied. Admin only." });
      return;
    }

    const users = await User.find({ status: "pending" }).select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user status (verify or reject)
export const updateUserStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Access denied. Admin only." });
      return;
    }

    const { userId, status } = req.body;

    if (!userId || !status) {
      res.status(400).json({ message: "User ID and status are required" });
      return;
    }

    if (!["pending", "verified", "rejected"].includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      message: `User status updated to ${status}`,
      user,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create admin user (hidden route)
export const createAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, secretKey } = req.body;

    // Check if the secret key matches
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      res.status(401).json({ message: "Invalid secret key" });
      return;
    }

    if (!username || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      res.status(400).json({
        message: "User already exists",
        details:
          userExists.email === email
            ? "Email already in use"
            : "Username already taken",
      });
      return;
    }

    const user: IUser = await User.create({
      username,
      email,
      password,
      role: "admin",
      status: "verified", // Admin is automatically verified
    });

    const userId = user._id.toString();
    console.log(`Admin creation successful: ${username} (${userId})`);

    res.status(201).json({
      _id: userId,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token: jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
        expiresIn: "30d",
      }),
    });
  } catch (error) {
    console.error("Admin creation error:", error);
    res.status(500).json({
      message: "Server error during admin creation",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
