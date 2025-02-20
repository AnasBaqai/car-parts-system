import { Request, Response } from "express";
import Order, { IOrder } from "../models/order.model";
import Part from "../models/part.model";

// Get all orders
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate({
        path: "items.part",
        populate: { path: "category" },
      })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single order
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: "items.part",
      populate: { path: "category" },
    });
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create order
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Creating new order with data:", req.body);
    const { items, paymentMethod, customerName, customerPhone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("Order creation failed: No items provided");
      res.status(400).json({ message: "Order must contain at least one item" });
      return;
    }

    // Calculate total amount and validate inventory
    let totalAmount = 0;
    const inventoryUpdates = [];
    for (const item of items) {
      console.log(`Processing item: ${item.part}`);
      const part = await Part.findById(item.part);

      if (!part) {
        console.error(`Order creation failed: Part ${item.part} not found`);
        res.status(404).json({ message: `Part ${item.part} not found` });
        return;
      }

      if (part.quantity < item.quantity) {
        console.error(
          `Order creation failed: Insufficient stock for part ${part.name}. ` +
            `Requested: ${item.quantity}, Available: ${part.quantity}`
        );
        res.status(400).json({
          message: `Insufficient stock for part ${part.name}. Available: ${part.quantity}`,
        });
        return;
      }

      totalAmount += part.price * item.quantity;
      inventoryUpdates.push({
        partId: part._id,
        quantity: item.quantity,
      });
    }

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    const orderNumber = `ORD-${year}${month}${day}-${random}`;

    console.log("Creating order with total amount:", totalAmount);
    const order = await Order.create({
      orderNumber,
      items: items.map((item: any) => ({
        ...item,
        price: item.price,
      })),
      totalAmount,
      paymentMethod,
      customerName,
      customerPhone,
      status: "PENDING",
    });

    // Update inventory only after order is successfully created
    for (const update of inventoryUpdates) {
      await Part.findByIdAndUpdate(update.partId, {
        $inc: { quantity: -update.quantity },
      });
      console.log(`Updated inventory for part ${update.partId}`);
    }

    console.log("Order created successfully:", order._id);
    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation failed with error:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, paymentMethod } = req.body;
    console.log("Update order request received:", {
      orderId: req.params.id,
      status,
      paymentMethod,
      headers: req.headers,
    });

    if (!req.headers.authorization) {
      console.error("No authorization header found");
      res.status(401).json({ message: "Authorization header missing" });
      return;
    }

    const updateData: any = { status };
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    console.log("Updating order with data:", updateData);

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate({
      path: "items.part",
      populate: { path: "category" },
    });

    if (!order) {
      console.error(`Order ${req.params.id} not found`);
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // If order is cancelled, restore inventory
    if (status === "CANCELLED") {
      console.log(`Restoring inventory for cancelled order ${order._id}`);
      for (const item of order.items) {
        await Part.findByIdAndUpdate(item.part, {
          $inc: { quantity: item.quantity },
        });
        console.log(`Restored ${item.quantity} units to part ${item.part}`);
      }
    }

    console.log(`Order ${order._id} updated successfully:`, order);
    res.json(order);
  } catch (error) {
    console.error("Order status update failed:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get sales report
export const getSalesReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const query: any = { status: "COMPLETED" };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const orders = await Order.find(query).populate({
      path: "items.part",
      populate: { path: "category" },
    });

    const totalSales = orders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    const salesByPaymentMethod = orders.reduce((acc: any, order) => {
      if (order.paymentMethod) {
        acc[order.paymentMethod] =
          (acc[order.paymentMethod] || 0) + order.totalAmount;
      } else {
        acc["UNPAID"] = (acc["UNPAID"] || 0) + order.totalAmount;
      }
      return acc;
    }, {});

    res.json({
      orders,
      totalSales,
      salesByPaymentMethod,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
