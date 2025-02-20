import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import partsReducer from "./slices/partsSlice";
import ordersReducer from "./slices/ordersSlice";
import categoriesReducer from "./slices/categoriesSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    parts: partsReducer,
    orders: ordersReducer,
    categories: categoriesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
