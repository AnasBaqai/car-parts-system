import mongoose, { Document, Schema } from "mongoose";

export interface IPart extends Document {
  name: string;
  description: string;
  category: mongoose.Types.ObjectId;
  price: number;
  quantity: number;
  minQuantity: number;
  manufacturer: string;
  partNumber: string;
  barcode: string;
}

const partSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
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
      required: true,
    },
    partNumber: {
      type: String,
      required: true,
      unique: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values to not trigger uniqueness constraint
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searching
partSchema.index({
  name: "text",
  description: "text",
  partNumber: "text",
  barcode: "text",
});

export default mongoose.model<IPart>("Part", partSchema);
