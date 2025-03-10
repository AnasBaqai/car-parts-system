import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface Category {
  _id: string;
  name: string;
  description?: string;
}

export interface Part {
  _id: string;
  name: string;
  description?: string;
  category: string | Category; // Can be either a string ID or a populated Category object
  price: number;
  quantity: number;
  minQuantity: number;
  manufacturer?: string;
  partNumber: string;
  barcode?: string;
}

interface PartsState {
  parts: Part[];
  lowStockParts: Part[];
  loading: boolean;
  error: string | null;
}

const initialState: PartsState = {
  parts: [],
  lowStockParts: [],
  loading: false,
  error: null,
};

export const getParts = createAsyncThunk("parts/getParts", async () => {
  const response = await api.get("/parts");
  return response.data;
});

export const getLowStockParts = createAsyncThunk(
  "parts/getLowStockParts",
  async () => {
    const response = await api.get("/parts/low-stock");
    return response.data;
  }
);

export const createPart = createAsyncThunk(
  "parts/createPart",
  async (partData: Omit<Part, "_id">) => {
    // Ensure category is a string ID
    const updatedPartData = {
      ...partData,
      category:
        typeof partData.category === "object" && partData.category !== null
          ? (partData.category as Category)._id
          : partData.category,
    };

    const response = await api.post("/parts", updatedPartData);
    return response.data;
  }
);

export const updatePart = createAsyncThunk(
  "parts/updatePart",
  async ({ id, partData }: { id: string; partData: Partial<Part> }) => {
    // Ensure category is a string ID
    const updatedPartData = {
      ...partData,
      category:
        typeof partData.category === "object" && partData.category !== null
          ? (partData.category as Category)._id
          : partData.category,
    };

    const response = await api.put(`/parts/${id}`, updatedPartData);
    return response.data;
  }
);

export const deletePart = createAsyncThunk(
  "parts/deletePart",
  async (id: string) => {
    await api.delete(`/parts/${id}`);
    return id;
  }
);

export const getPartByBarcode = createAsyncThunk(
  "parts/getPartByBarcode",
  async (barcode: string) => {
    const response = await api.get(`/parts/barcode/${barcode}`);
    return response.data;
  }
);

const partsSlice = createSlice({
  name: "parts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getParts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getParts.fulfilled, (state, action) => {
        state.loading = false;
        state.parts = action.payload;
      })
      .addCase(getParts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch parts";
      })
      .addCase(getLowStockParts.fulfilled, (state, action) => {
        state.lowStockParts = action.payload;
      })
      .addCase(createPart.fulfilled, (state, action) => {
        state.parts.push(action.payload);
      })
      .addCase(updatePart.fulfilled, (state, action) => {
        const index = state.parts.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.parts[index] = action.payload;
        }
      })
      .addCase(deletePart.fulfilled, (state, action) => {
        state.parts = state.parts.filter((p) => p._id !== action.payload);
      });
  },
});

export default partsSlice.reducer;
