import mongoose, { Document, Schema } from "mongoose";

export interface IOrderItem {
  part: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  paymentMethod?: "CASH" | "CARD";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  customerName?: string;
  customerPhone?: string;
  user: mongoose.Types.ObjectId;
}

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
    },
    items: [
      {
        part: {
          type: Schema.Types.ObjectId,
          ref: "Part",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "CARD"],
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    customerName: {
      type: String,
    },
    customerPhone: {
      type: String,
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

// Create a compound index for orderNumber and user
orderSchema.index({ orderNumber: 1, user: 1 }, { unique: true });

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

export default mongoose.model<IOrder>("Order", orderSchema);
