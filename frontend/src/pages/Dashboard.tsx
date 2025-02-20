import React, { useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  ShoppingCart as OrderIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { getParts, getLowStockParts } from "../store/slices/partsSlice";
import { getCategories } from "../store/slices/categoriesSlice";
import { getOrders } from "../store/slices/ordersSlice";

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    parts,
    lowStockParts,
    loading: partsLoading,
  } = useAppSelector((state) => state.parts);
  const { categories, loading: categoriesLoading } = useAppSelector(
    (state) => state.categories
  );
  const { orders, loading: ordersLoading } = useAppSelector(
    (state) => state.orders
  );

  useEffect(() => {
    dispatch(getParts());
    dispatch(getLowStockParts());
    dispatch(getCategories());
    dispatch(getOrders());
  }, [dispatch]);

  const loading = partsLoading || categoriesLoading || ordersLoading;

  const totalInventoryValue = parts.reduce(
    (total, part) => total + part.price * part.quantity,
    0
  );

  const recentOrders = orders
    .slice(0, 5)
    .filter((order) => order.status === "COMPLETED");

  const summaryCards = [
    {
      title: "Total Parts",
      value: parts.length,
      icon: <InventoryIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    },
    {
      title: "Categories",
      value: categories.length,
      icon: <CategoryIcon sx={{ fontSize: 40, color: "secondary.main" }} />,
    },
    {
      title: "Recent Orders",
      value: recentOrders.length,
      icon: <OrderIcon sx={{ fontSize: 40, color: "success.main" }} />,
    },
    {
      title: "Low Stock Items",
      value: lowStockParts.length,
      icon: <WarningIcon sx={{ fontSize: 40, color: "error.main" }} />,
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4">{card.value}</Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Low Stock Items
              </Typography>
              {lowStockParts.length > 0 ? (
                lowStockParts.map((part) => (
                  <Box
                    key={part._id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography>{part.name}</Typography>
                    <Typography color="error">
                      Stock: {part.quantity}/{part.minQuantity}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary">
                  No items with low stock
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Box
                    key={order._id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography>{order.orderNumber}</Typography>
                    <Typography>${order.totalAmount.toFixed(2)}</Typography>
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary">No recent orders</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory Summary
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography>Total Inventory Value:</Typography>
                <Typography variant="h6">
                  ${totalInventoryValue.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
