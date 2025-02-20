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
    const { username, password } = req.body;

    const user: IUser | null = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const userId = user._id.toString();

    res.json({
      _id: userId,
      username: user.username,
      email: user.email,
      token: generateToken(userId),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user: IUser = await User.create({
      username,
      email,
      password,
    });

    const userId = user._id.toString();

    res.status(201).json({
      _id: userId,
      username: user.username,
      email: user.email,
      token: generateToken(userId),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};
