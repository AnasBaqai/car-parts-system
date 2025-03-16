import { Request, Response } from "express";
import Order, { IOrder } from "../models/order.model";
import Part from "../models/part.model";
import { generateReceipt } from "../utils/receiptGenerator";

// Get all orders
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Filter orders by the current user
    const orders = await Order.find({ user: req.user._id })
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
    // Find order by ID and user
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate({
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
    const {
      items,
      totalAmount,
      status,
      customerName,
      customerPhone,
      customerEmail,
      carRegistration,
      paymentMethod,
    } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Items are required" });
      return;
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

    // Add user ID to the order
    const orderData = {
      orderNumber,
      items,
      totalAmount,
      status,
      customerName,
      customerPhone,
      customerEmail,
      carRegistration,
      paymentMethod,
      user: req.user._id,
    };

    // Create the order
    const order = await Order.create(orderData);

    // Populate the order with part details
    const populatedOrder = await Order.findById(order._id).populate({
      path: "items.part",
      populate: { path: "category" },
    });

    // Update inventory
    for (const item of items) {
      // Only update parts that belong to the current user
      await Part.findOneAndUpdate(
        { _id: item.part, user: req.user._id },
        { $inc: { quantity: -item.quantity } }
      );
    }

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, paymentMethod, cashReceived } = req.body;

    // Calculate change amount if needed
    let changeAmount;
    if (cashReceived && paymentMethod === "CASH") {
      const existingOrder = await Order.findOne({
        _id: req.params.id,
        user: req.user._id,
      });
      if (existingOrder) {
        changeAmount = cashReceived - existingOrder.totalAmount;
      }
    }

    // Find and update order by ID and user
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        status,
        paymentMethod,
        ...(cashReceived && { cashReceived }),
        ...(changeAmount !== undefined && { changeAmount }),
      },
      { new: true }
    ).populate({
      path: "items.part",
      populate: { path: "category" },
    });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get sales report
export const getSalesReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { year, month } = req.query;

    // Validate year and month parameters
    const yearNum = year ? parseInt(year as string) : new Date().getFullYear();
    const monthNum = month
      ? parseInt(month as string)
      : new Date().getMonth() + 1;

    // Validate that year and month are valid numbers
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      res.status(400).json({
        message:
          "Invalid date parameters. Year must be a valid number and month must be between 1-12.",
      });
      return;
    }

    console.log(`Generating sales report for ${yearNum}-${monthNum}`);

    // Create date range for the specified month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month

    // Verify dates are valid before proceeding
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ message: "Invalid date range generated" });
      return;
    }

    console.log(
      `Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Get completed orders for the current user within the date range
    const orders = await Order.find({
      status: "COMPLETED",
      user: req.user._id,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate({
      path: "items.part",
      populate: { path: "category" },
    });

    console.log(`Found ${orders.length} orders in date range`);

    // Calculate total sales
    const totalSales = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Calculate sales by payment method
    const salesByPaymentMethod = {
      CASH: orders
        .filter((order) => order.paymentMethod === "CASH")
        .reduce((sum, order) => sum + order.totalAmount, 0),
      CARD: orders
        .filter((order) => order.paymentMethod === "CARD")
        .reduce((sum, order) => sum + order.totalAmount, 0),
    };

    res.json({
      totalSales,
      salesByPaymentMethod,
      orders,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Generate order receipt
export const generateOrderReceipt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Find order by ID and user
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate({
      path: "items.part",
      select: "name partNumber",
    });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const receipt = generateReceipt(order);
    res.json({ status: "success", data: { receipt } });
  } catch (error) {
    console.error("Error generating receipt:", error);
    res.status(500).json({ message: "Server error" });
  }
};
