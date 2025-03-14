import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model";
import readline from "readline";

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/car-parts-system"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to prompt for input
const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Create admin user
const createAdmin = async () => {
  try {
    console.log("\n=== Create Initial Admin User ===\n");

    // Get admin details
    const username = await prompt("Enter admin username: ");
    const email = await prompt("Enter admin email: ");
    const password = await prompt("Enter admin password: ");

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      console.error(
        `\nError: User already exists with ${
          existingUser.username === username ? "username" : "email"
        }`
      );
      process.exit(1);
    }

    // Create admin user
    const admin = await User.create({
      username,
      email,
      password,
      role: "admin",
      status: "verified",
    });

    console.log(`\nAdmin user created successfully!`);
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Status: ${admin.status}`);
    console.log(`\nYou can now log in with these credentials.`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Run the function
createAdmin();
