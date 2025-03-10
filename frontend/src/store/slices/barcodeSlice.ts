import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

interface Part {
  _id: string;
  name: string;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  price: number;
  quantity: number;
  manufacturer: string;
  partNumber: string;
  barcode: string;
}

interface BarcodeItem {
  part: Part;
  quantity: number;
}

interface BarcodeState {
  items: BarcodeItem[];
  loading: boolean;
  error: string | null;
  currentBarcode: string | null;
  totalAmount: number;
}

const initialState: BarcodeState = {
  items: [],
  loading: false,
  error: null,
  currentBarcode: null,
  totalAmount: 0,
};

// Get part by barcode
export const getPartByBarcode = createAsyncThunk(
  "barcode/getPartByBarcode",
  async (barcode: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/parts/barcode/${barcode}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch part by barcode"
      );
    }
  }
);

// Create order from barcode items
export const createBarcodeOrder = createAsyncThunk(
  "barcode/createOrder",
  async (
    {
      items,
      totalAmount,
      customerName,
      customerPhone,
      paymentMethod,
    }: {
      items: { part: string; quantity: number; price: number }[];
      totalAmount: number;
      customerName?: string;
      customerPhone?: string;
      paymentMethod: "CASH" | "CARD";
    },
    { rejectWithValue }
  ) => {
    try {
      const orderData = {
        items,
        totalAmount,
        status: "COMPLETED",
        customerName,
        customerPhone,
        paymentMethod,
      };
      const response = await api.post("/orders", orderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }
);

const barcodeSlice = createSlice({
  name: "barcode",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearItems: (state) => {
      state.items = [];
      state.totalAmount = 0;
    },
    removeItem: (state, action) => {
      const index = state.items.findIndex(
        (item) => item.part._id === action.payload
      );
      if (index !== -1) {
        state.totalAmount -=
          state.items[index].part.price * state.items[index].quantity;
        state.items.splice(index, 1);
      }
    },
    updateItemQuantity: (state, action) => {
      const { partId, quantity } = action.payload;
      const item = state.items.find((item) => item.part._id === partId);
      if (item) {
        // Subtract the old total for this item
        state.totalAmount -= item.part.price * item.quantity;
        // Update quantity
        item.quantity = quantity;
        // Add the new total for this item
        state.totalAmount += item.part.price * item.quantity;
      }
    },
    setCurrentBarcode: (state, action) => {
      state.currentBarcode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPartByBarcode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPartByBarcode.fulfilled, (state, action) => {
        state.loading = false;
        // Check if the item already exists in the cart
        const existingItemIndex = state.items.findIndex(
          (item) => item.part._id === action.payload._id
        );

        if (existingItemIndex !== -1) {
          // Increment quantity if item already exists
          state.items[existingItemIndex].quantity += 1;
          // Update total amount
          state.totalAmount += action.payload.price;
        } else {
          // Add new item if it doesn't exist
          state.items.push({
            part: action.payload,
            quantity: 1,
          });
          // Update total amount
          state.totalAmount += action.payload.price;
        }
        state.currentBarcode = null;
      })
      .addCase(getPartByBarcode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentBarcode = null;
      })
      .addCase(createBarcodeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBarcodeOrder.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalAmount = 0;
      })
      .addCase(createBarcodeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearItems,
  removeItem,
  updateItemQuantity,
  setCurrentBarcode,
} = barcodeSlice.actions;
export default barcodeSlice.reducer;
