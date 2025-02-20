import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

interface OrderItem {
  part: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: "CASH" | "CARD";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  totalAmount: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: "CASH" | "CARD";
}

interface OrdersState {
  orders: Order[];
  order: Order | null;
  loading: boolean;
  error: string | null;
  salesReport: {
    totalSales: number;
    salesByPaymentMethod: {
      CASH: number;
      CARD: number;
    };
  } | null;
}

const initialState: OrdersState = {
  orders: [],
  order: null,
  loading: false,
  error: null,
  salesReport: null,
};

// Get all orders
export const getOrders = createAsyncThunk(
  "orders/getOrders",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as { auth: { user: { token: string } } };
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      const response = await axios.get(`${API_URL}/orders`, config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

// Create order
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData: CreateOrderRequest, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as { auth: { user: { token: string } } };
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      const response = await axios.post(`${API_URL}/orders`, orderData, config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async (
    {
      id,
      status,
      paymentMethod,
    }: {
      id: string;
      status: "PENDING" | "COMPLETED" | "CANCELLED";
      paymentMethod?: "CASH" | "CARD";
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: { token: string } } };
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      console.log("Sending update request:", {
        id,
        status,
        paymentMethod,
        config,
      });
      const response = await axios.put(
        `${API_URL}/orders/${id}`,
        { status, paymentMethod },
        config
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Update order status failed:",
        error.response?.data || error
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  }
);

// Get sales report
export const getSalesReport = createAsyncThunk(
  "orders/getSalesReport",
  async (
    { startDate, endDate }: { startDate: string; endDate: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: { token: string } } };
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      const response = await axios.get(
        `${API_URL}/orders/report?startDate=${startDate}&endDate=${endDate}`,
        config
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sales report"
      );
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOrder: (state) => {
      state.order = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get orders
      .addCase(getOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
        state.order = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.order?._id === action.payload._id) {
          state.order = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get sales report
      .addCase(getSalesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSalesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.salesReport = action.payload;
      })
      .addCase(getSalesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
