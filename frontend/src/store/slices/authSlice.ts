import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

interface User {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  status: "pending" | "verified" | "rejected";
  token: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  errorDetails: any | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  loading: false,
  error: null,
  errorDetails: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      console.log("Login attempt:", {
        email: credentials.email,
        apiUrl: process.env.REACT_APP_API_URL,
        timestamp: new Date().toISOString(),
      });

      const response = await api.post("/auth/login", credentials);
      console.log("Login successful:", response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      console.error("Login error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
      });

      return rejectWithValue({
        message: error.response?.data?.message || "Login failed",
        details: error.response?.data || error.message,
        status: error.response?.status,
      });
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    userData: { username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      console.log("Registration attempt:", {
        username: userData.username,
        email: userData.email,
        apiUrl: process.env.REACT_APP_API_URL,
        timestamp: new Date().toISOString(),
      });

      const response = await api.post("/auth/register", userData);
      console.log("Registration successful:", response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      console.error("Registration error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
      });

      return rejectWithValue({
        message: error.response?.data?.message || "Registration failed",
        details: error.response?.data || error.message,
        status: error.response?.status,
      });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
    clearError: (state) => {
      state.error = null;
      state.errorDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.errorDetails = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.error = payload?.message || "Login failed";
        state.errorDetails = payload?.details || null;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.errorDetails = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.error = payload?.message || "Registration failed";
        state.errorDetails = payload?.details || null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
