import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { getOrders, updateOrderStatus } from "../../store/slices/ordersSlice";

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
  paymentMethod?: "CASH" | "CARD";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

interface PaymentDialogData {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod?: "CASH" | "CARD";
  cashReceived?: number;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentDialogData>({
    orderId: "",
    orderNumber: "",
    totalAmount: 0,
  });
  const [alertInfo, setAlertInfo] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  const handleAddOrder = () => {
    navigate("/orders/create");
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await dispatch(
        updateOrderStatus({
          id: orderId,
          status: newStatus as "PENDING" | "COMPLETED" | "CANCELLED",
        })
      ).unwrap();
      setAlertInfo({
        open: true,
        message: "Order status updated successfully",
        severity: "success",
      });
    } catch (error: any) {
      setAlertInfo({
        open: true,
        message: error.message || "Failed to update order status",
        severity: "error",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName &&
        order.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCloseAlert = () => {
    setAlertInfo((prev) => ({ ...prev, open: false }));
  };

  const handlePaymentClick = (order: Order) => {
    setPaymentData({
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });
    setOpenPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      if (!paymentData.paymentMethod) {
        setAlertInfo({
          open: true,
          message: "Please select a payment method",
          severity: "error",
        });
        return;
      }

      if (
        paymentData.paymentMethod === "CASH" &&
        (!paymentData.cashReceived ||
          paymentData.cashReceived < paymentData.totalAmount)
      ) {
        setAlertInfo({
          open: true,
          message:
            "Cash received must be greater than or equal to total amount",
          severity: "error",
        });
        return;
      }

      console.log("Processing payment:", paymentData);
      const result = await dispatch(
        updateOrderStatus({
          id: paymentData.orderId,
          status: "COMPLETED",
          paymentMethod: paymentData.paymentMethod,
        })
      ).unwrap();

      console.log("Payment processed successfully:", result);
      const change = paymentData.cashReceived
        ? paymentData.cashReceived - paymentData.totalAmount
        : 0;

      setAlertInfo({
        open: true,
        message:
          paymentData.paymentMethod === "CASH"
            ? `Payment successful. Change to return: $${change.toFixed(2)}`
            : "Card payment processed successfully",
        severity: "success",
      });

      setOpenPaymentDialog(false);
    } catch (error: any) {
      console.error("Payment processing failed:", error);
      setAlertInfo({
        open: true,
        message:
          error.message || "Failed to process payment. Please try again.",
        severity: "error",
      });
    }
  };

  if (loading && orders.length === 0) {
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
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alertInfo.severity}
          sx={{ width: "100%" }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Orders Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddOrder}
        >
          Create Order
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search orders"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number or customer name"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Order Status Guide:
                <Chip
                  label="PENDING"
                  color="warning"
                  size="small"
                  sx={{ mx: 1 }}
                />{" "}
                Awaiting approval
                <Chip
                  label="COMPLETED"
                  color="success"
                  size="small"
                  sx={{ mx: 1 }}
                />{" "}
                Order fulfilled
                <Chip
                  label="CANCELLED"
                  color="error"
                  size="small"
                  sx={{ mx: 1 }}
                />{" "}
                Order cancelled
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Order Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>
                  {order.customerName || "N/A"}
                  {order.customerPhone && <br />}
                  {order.customerPhone}
                </TableCell>
                <TableCell>{order.items.length} items</TableCell>
                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  {order.paymentMethod ? (
                    <Chip
                      label={order.paymentMethod}
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Chip label="UNPAID" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {!order.paymentMethod && order.status === "PENDING" && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handlePaymentClick(order)}
                    >
                      Process Payment
                    </Button>
                  )}
                  {order.status === "PENDING" && (
                    <IconButton
                      color="error"
                      onClick={() => handleStatusChange(order._id, "CANCELLED")}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body1">
                Order Number: {paymentData.orderNumber}
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Total Amount: ${paymentData.totalAmount.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Payment Method"
                fullWidth
                value={paymentData.paymentMethod || ""}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value as "CASH" | "CARD",
                    cashReceived: undefined,
                  }))
                }
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
              </TextField>
            </Grid>
            {paymentData.paymentMethod === "CASH" && (
              <Grid item xs={12}>
                <TextField
                  label="Cash Received"
                  type="number"
                  fullWidth
                  value={paymentData.cashReceived || ""}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      cashReceived: parseFloat(e.target.value),
                    }))
                  }
                  InputProps={{
                    startAdornment: <span>$</span>,
                  }}
                />
                {paymentData.cashReceived &&
                  paymentData.cashReceived >= paymentData.totalAmount && (
                    <Typography color="success.main" sx={{ mt: 1 }}>
                      Change to return: $
                      {(
                        paymentData.cashReceived - paymentData.totalAmount
                      ).toFixed(2)}
                    </Typography>
                  )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            color="primary"
          >
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
