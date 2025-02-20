import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

interface Category {
  _id: string;
  name: string;
  description: string;
}

interface CategoriesState {
  categories: Category[];
  category: Category | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  category: null,
  loading: false,
  error: null,
};

// Get all categories
export const getCategories = createAsyncThunk(
  "categories/getCategories",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as { auth: { user: { token: string } } };
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      const response = await axios.get(`${API_URL}/categories`, config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

// Create category
export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (
    categoryData: Omit<Category, "_id">,
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: { token: string } } };
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      const response = await axios.post(
        `${API_URL}/categories`,
        categoryData,
        config
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category"
      );
    }
  }
);

// Update category
export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async (
    { id, categoryData }: { id: string; categoryData: Partial<Category> },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: { token: string } } };
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      const response = await axios.put(
        `${API_URL}/categories/${id}`,
        categoryData,
        config
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category"
      );
    }
  }
);

// Delete category
export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as { auth: { user: { token: string } } };
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      await axios.delete(`${API_URL}/categories/${id}`, config);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category"
      );
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCategory: (state) => {
      state.category = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get categories
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(
          (c) => c._id !== action.payload
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;
