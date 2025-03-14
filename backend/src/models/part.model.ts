import mongoose, { Document, Schema } from "mongoose";

export interface IPart extends Document {
  name: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  price: number;
  quantity: number;
  minQuantity: number;
  manufacturer?: string;
  partNumber: string;
  barcode?: string;
  user: mongoose.Types.ObjectId;
}

const partSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    minQuantity: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    manufacturer: {
      type: String,
      required: false,
    },
    partNumber: {
      type: String,
      required: true,
    },
    barcode: {
      type: String,
      sparse: true, // Allows null/undefined values to not trigger uniqueness constraint
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for uniqueness per user
partSchema.index({ partNumber: 1, user: 1 }, { unique: true });
partSchema.index({ barcode: 1, user: 1 }, { unique: true, sparse: true });

// Index for faster searching
partSchema.index({
  name: "text",
  description: "text",
  partNumber: "text",
  barcode: "text",
});

export default mongoose.model<IPart>("Part", partSchema);
