import { IOrder } from "../models/order.model";
import { Document } from "mongoose";

// Type that accepts both a plain object and a Mongoose document
export type GenerateReceiptInput = {
  _id: string;
  orderNumber: string;
  items: {
    part: {
      name: string;
      partNumber?: string;
    };
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paymentMethod?: "CASH" | "CARD";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  carRegistration?: string;
  createdAt: string | Date;
  cashReceived?: number;
  changeAmount?: number;
};

// Helper function to check if the order is a GenerateReceiptInput
const isGenerateReceiptInput = (order: any): order is GenerateReceiptInput => {
  return (
    order.items &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items[0].part &&
    typeof order.items[0].part === "object" &&
    "name" in order.items[0].part
  );
};

export const generateReceipt = (
  order: (Document & IOrder) | GenerateReceiptInput
): string => {
  console.log("Starting receipt generation with order:", {
    orderNumber: order.orderNumber,
    itemCount: order.items?.length,
  });

  try {
    // Handle createdAt for both types
    const createdAt =
      "createdAt" in order
        ? order.createdAt
        : (order as any).createdAt || new Date();

    const date = new Date(createdAt).toLocaleString();

    console.log("Processing order items");
    const items = order.items.map((item) => {
      // Handle different part structures
      let partName = "";
      let partNumber = "N/A";

      if (isGenerateReceiptInput(order)) {
        // For GenerateReceiptInput type
        const part = item.part as { name: string; partNumber?: string };
        partName = part.name;
        partNumber = part.partNumber || "N/A";
      } else {
        // For Document & IOrder type
        // Assume part is populated or has been transformed
        const part = item.part as any;
        partName = part.name || "Unknown Part";
        partNumber = part.partNumber || "N/A";
      }

      if (!partName) {
        console.error("Invalid part item:", item);
        throw new Error("Part name is missing");
      }

      return {
        name: partName,
        partNumber: partNumber,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      };
    });

    // Calculate tax (assuming 20% VAT)
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.2; // 20% VAT
    const total = order.totalAmount;

    // Create the receipt with manual formatting
    const receiptContent = [
      "                CAR PARTS SYSTEM                ",
      "                123 Auto Parts Street                ",
      "                   City, Country                    ",
      "                Tel: (123) 456-7890                 ",
      "------------------------------------------------",
      `Order #: ${order.orderNumber}`,
      `Date: ${date}`,
      `Customer: ${order.customerName || "Walk-in Customer"}`,
      ...(order.customerPhone ? [`Phone: ${order.customerPhone}`] : []),
      ...(order.customerEmail ? [`Email: ${order.customerEmail}`] : []),
      ...(order.carRegistration
        ? [`Car Registration: ${order.carRegistration}`]
        : []),
      "------------------------------------------------",
      "ITEM                  QTY   PRICE   TOTAL",
      "------------------------------------------------",
      ...items.map((item) => {
        const name = item.name.substring(0, 20).padEnd(22);
        const qty = item.quantity.toString().padStart(5);
        const price = item.price.toFixed(2).padStart(7);
        const total = item.subtotal.toFixed(2).padStart(8);
        return `${name}${qty}${price}${total}`;
      }),
      "------------------------------------------------",
      `Subtotal:${subtotal.toFixed(2).padStart(32)}`,
      `VAT (20%):${tax.toFixed(2).padStart(31)}`,
      "------------------------------------------------",
      `TOTAL:${total.toFixed(2).padStart(35)}`,
      "------------------------------------------------",
      "",
      `                Payment Method: ${order.paymentMethod || "N/A"}`,
      `                Payment Status: ${
        order.status === "COMPLETED" ? "PAID" : "UNPAID"
      }`,
      ...(order.paymentMethod === "CASH" && (order as any).cashReceived
        ? [
            `                Cash Amount: £${(
              order as any
            ).cashReceived.toFixed(2)}`,
            `                Change Due: £${(
              (order as any).changeAmount || 0
            ).toFixed(2)}`,
          ]
        : []),
      "",
      "            Thank you for your business!",
      "                Please come again",
      "------------------------------------------------",
    ].join("\n");

    return receiptContent;
  } catch (error) {
    console.error("Error generating receipt:", {
      error: error instanceof Error ? error.message : error,
      orderData: {
        orderNumber: order.orderNumber,
        items: order.items,
        customerName: order.customerName,
      },
    });
    throw error;
  }
};
