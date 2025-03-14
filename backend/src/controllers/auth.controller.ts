import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Login attempt:", {
      email: req.body.email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    const { email, password } = req.body;

    if (!email || !password) {
      console.error("Login failed: Missing email or password");
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user: IUser | null = await User.findOne({ email });

    if (!user) {
      console.error(`Login failed: User not found - ${email}`);
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.error(`Login failed: Invalid password for user - ${email}`);
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Check if user account is verified
    if (user.role !== "admin" && user.status !== "verified") {
      console.error(`Login failed: Account not verified - ${email}`);
      res.status(403).json({
        message:
          "Your account is pending verification. Please wait for admin approval.",
      });
      return;
    }

    const userId = user._id.toString();
    console.log(`Login successful: ${email} (${userId})`);

    res.json({
      _id: userId,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(userId),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Registration attempt:", {
      username: req.body.username,
      email: req.body.email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      console.error("Registration failed: Missing required fields");
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      console.error(
        `Registration failed: User already exists - ${username} / ${email}`
      );
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
      role: "user",
      status: "pending",
    });

    const userId = user._id.toString();
    console.log(`Registration successful: ${username} (${userId})`);

    res.status(201).json({
      _id: userId,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(userId),
      message:
        "Registration successful. Your account is pending verification by an admin.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
