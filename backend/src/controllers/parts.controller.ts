import { Request, Response } from "express";
import Part, { IPart } from "../models/part.model";

// Get all parts
export const getParts = async (req: Request, res: Response): Promise<void> => {
  try {
    const parts = await Part.find().populate("category");
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single part
export const getPart = async (req: Request, res: Response): Promise<void> => {
  try {
    const part = await Part.findById(req.params.id).populate("category");
    if (!part) {
      res.status(404).json({ message: "Part not found" });
      return;
    }
    res.json(part);
  } catch (error) {
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
    const part = await Part.findOne({ barcode }).populate("category");

    if (!part) {
      res.status(404).json({ message: "Part not found with this barcode" });
      return;
    }

    res.json(part);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create part
export const createPart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const part = await Part.create(req.body);
    res.status(201).json(part);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update part
export const updatePart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!part) {
      res.status(404).json({ message: "Part not found" });
      return;
    }
    res.json(part);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete part
export const deletePart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const part = await Part.findByIdAndDelete(req.params.id);
    if (!part) {
      res.status(404).json({ message: "Part not found" });
      return;
    }
    res.json({ message: "Part removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Search parts
export const searchParts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.query;
    const parts = await Part.find(
      { $text: { $search: query as string } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .populate("category");
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get low stock parts
export const getLowStockParts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parts = await Part.find({
      $expr: { $lte: ["$quantity", "$minQuantity"] },
    }).populate("category");
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
