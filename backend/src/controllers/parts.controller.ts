import { Request, Response } from "express";
import Part, { IPart } from "../models/part.model";

// Get all parts
export const getParts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Filter parts by the current user
    const parts = await Part.find({ user: req.user._id }).populate("category");
    res.json(parts);
  } catch (error: any) {
    console.error("Error fetching parts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single part
export const getPart = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find part by ID and user
    const part = await Part.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("category");

    if (!part) {
      res.status(404).json({ message: "Part not found" });
      return;
    }
    res.json(part);
  } catch (error: any) {
    console.error(`Error fetching part with ID ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get part by barcode
export const getPartByBarcode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { barcode } = req.params;
    // Find part by barcode and user
    const part = await Part.findOne({
      barcode,
      user: req.user._id,
    }).populate("category");

    if (!part) {
      res.status(404).json({ message: "Part not found with this barcode" });
      return;
    }

    res.json(part);
  } catch (error: any) {
    console.error(
      `Error fetching part with barcode ${req.params.barcode}:`,
      error
    );
    res.status(500).json({ message: "Server error" });
  }
};

// Create part
export const createPart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Creating part with data:", req.body);
    // Add user ID to the part
    const partData = {
      ...req.body,
      user: req.user._id,
    };
    const part = await Part.create(partData);
    res.status(201).json(part);
  } catch (error: any) {
    console.error("Error creating part:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update part
export const updatePart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Updating part with ID:", req.params.id);
    console.log("Update data:", JSON.stringify(req.body, null, 2));

    // Find and update part by ID and user
    const part = await Part.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("category");

    if (!part) {
      console.error(`Part with ID ${req.params.id} not found for update`);
      res.status(404).json({ message: "Part not found" });
      return;
    }

    console.log("Part updated successfully:", part);
    res.json(part);
  } catch (error: any) {
    console.error(`Error updating part with ID ${req.params.id}:`, error);
    console.error("Error details:", error.message);
    if (error.name === "ValidationError") {
      console.error("Validation error details:", error.errors);
    }
    if (error.name === "CastError") {
      console.error("Cast error details:", error);
    }
    res.status(500).json({
      message: "Server error during update",
      error: error.message,
      details: error.name,
    });
  }
};

// Delete part
export const deletePart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Deleting part with ID:", req.params.id);
    // Find and delete part by ID and user
    const part = await Part.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!part) {
      console.error(`Part with ID ${req.params.id} not found for deletion`);
      res.status(404).json({ message: "Part not found" });
      return;
    }
    console.log("Part deleted successfully");
    res.json({ message: "Part removed" });
  } catch (error: any) {
    console.error(`Error deleting part with ID ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Search parts
export const searchParts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.query;
    console.log("Searching parts with query:", query);
    // Search parts by text and filter by user
    const parts = await Part.find(
      {
        $text: { $search: query as string },
        user: req.user._id,
      },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .populate("category");
    res.json(parts);
  } catch (error: any) {
    console.error("Error searching parts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get low stock parts
export const getLowStockParts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get low stock parts filtered by user
    const parts = await Part.find({
      $expr: { $lte: ["$quantity", "$minQuantity"] },
      user: req.user._id,
    }).populate("category");
    res.json(parts);
  } catch (error: any) {
    console.error("Error fetching low stock parts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
