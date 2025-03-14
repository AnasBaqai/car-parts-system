import { Request, Response } from "express";
import Category, { ICategory } from "../models/category.model";

// Get all categories
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Filter categories by the current user
    const categories = await Category.find({ user: req.user._id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single category
export const getCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Find category by ID and user
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create category
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    // Check if category exists for this user
    const categoryExists = await Category.findOne({
      name,
      user: req.user._id,
    });

    if (categoryExists) {
      res.status(400).json({ message: "Category already exists" });
      return;
    }

    // Add user ID to the category
    const category = await Category.create({
      name,
      description,
      user: req.user._id,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update category
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Find and update category by ID and user
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete category
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Find and delete category by ID and user
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json({ message: "Category removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
