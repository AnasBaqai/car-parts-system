import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import PrintIcon from "@mui/icons-material/Print";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  getPartByBarcode,
  createBarcodeOrder,
  clearItems,
  removeItem,
  updateItemQuantity,
  setCurrentBarcode,
} from "../../store/slices/barcodeSlice";
import BarcodeOrderScanner from "../../components/BarcodeOrderScanner";

const BarcodeOrderPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error, totalAmount } = useAppSelector(
    (state) => state.barcode
  );
  const [barcode, setBarcode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [openCheckout, setOpenCheckout] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus on barcode input when component mounts
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Handle barcode input
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  // Handle barcode submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      dispatch(getPartByBarcode(barcode.trim()));
      setBarcode("");
      // Refocus on the input field
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };

  // Handle barcode detected from scanner
  const handleBarcodeDetected = (detectedBarcode: string) => {
    console.log("Barcode detected:", detectedBarcode);

    // Check if the item is already in the cart
    const existingItem = items.find(
      (item) => item.part.barcode === detectedBarcode
    );

    if (existingItem) {
      // If the item is already in the cart, increment its quantity
      dispatch(
        updateItemQuantity({
          partId: existingItem.part._id,
          quantity: existingItem.quantity + 1,
        })
      );

      // Show a success message or notification
      setAlertInfo({
        open: true,
        message: `Added another ${existingItem.part.name} (Total: ${
          existingItem.quantity + 1
        })`,
        severity: "success",
      });
    } else {
      // If the item is not in the cart, add it
      dispatch(getPartByBarcode(detectedBarcode));
    }
  };

  // Handle quantity change
  const handleQuantityChange = (partId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      dispatch(updateItemQuantity({ partId, quantity: newQuantity }));
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    setOpenCheckout(true);
  };

  // Handle order creation
  const handleCreateOrder = async () => {
    try {
      const orderItems = items.map((item) => ({
        part: item.part._id,
        quantity: item.quantity,
        price: item.part.price,
      }));

      await dispatch(
        createBarcodeOrder({
          items: orderItems,
          totalAmount,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          paymentMethod,
        })
      ).unwrap();

      setAlertInfo({
        open: true,
        message: "Order created successfully!",
        severity: "success",
      });

      setOpenCheckout(false);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("CASH");
    } catch (error: any) {
      setAlertInfo({
        open: true,
        message: error.message || "Failed to create order",
        severity: "error",
      });
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    const receiptContent = document.getElementById("receipt-content");
    if (receiptContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .receipt { padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .items { width: 100%; border-collapse: collapse; }
                .items th, .items td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
                .total { margin-top: 20px; text-align: right; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="receipt">
                ${receiptContent.innerHTML}
                <div class="footer">
                  <p>Thank you for your purchase!</p>
                  <p>Date: ${new Date().toLocaleString()}</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Clear all items
  const handleClearItems = () => {
    dispatch(clearItems());
  };

  // Close alert
  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Barcode Scanner
      </Typography>

      {/* Barcode Input */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleBarcodeSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth
                label="Scan Barcode"
                variant="outlined"
                value={barcode}
                onChange={handleBarcodeChange}
                inputRef={barcodeInputRef}
                autoFocus
                disabled={loading}
                placeholder="Enter barcode or use scanner"
              />
            </Grid>
            <Grid item xs={8} sm={3}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !barcode.trim()}
              >
                {loading ? <CircularProgress size={24} /> : "Add Item"}
              </Button>
            </Grid>
            <Grid
              item
              xs={4}
              sm={2}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <BarcodeOrderScanner
                onBarcodeDetected={handleBarcodeDetected}
                disabled={loading}
              />
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Items Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Part</TableCell>
                <TableCell>Price</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No items added yet. Scan a barcode to add items.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.part._id}>
                    <TableCell>
                      <Typography variant="body1">{item.part.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.part.partNumber}
                      </Typography>
                      {item.part.barcode && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          display="block"
                        >
                          Barcode: {item.part.barcode}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>£{item.part.price.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleQuantityChange(
                              item.part._id,
                              item.quantity - 1
                            )
                          }
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleQuantityChange(
                              item.part._id,
                              item.quantity + 1
                            )
                          }
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      £{(item.part.price * item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => dispatch(removeItem(item.part._id))}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {items.length > 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="h6">Total:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6">
                      £{totalAmount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearItems}
          disabled={items.length === 0}
        >
          Clear All
        </Button>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mr: 2 }}
            onClick={handlePrintReceipt}
            disabled={items.length === 0}
            startIcon={<PrintIcon />}
          >
            Print Receipt
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckout}
            disabled={items.length === 0}
          >
            Checkout
          </Button>
        </Box>
      </Box>

      {/* Hidden Receipt Content for Printing */}
      <div id="receipt-content" style={{ display: "none" }}>
        <div className="header">
          <h2>Car Parts System</h2>
          <p>Receipt</p>
        </div>
        <table className="items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.part._id}>
                <td>{item.part.name}</td>
                <td>£{item.part.price.toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>£{(item.part.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="total">
          <p>Total: £{totalAmount.toFixed(2)}</p>
        </div>
        {customerName && <p>Customer: {customerName}</p>}
        {customerPhone && <p>Phone: {customerPhone}</p>}
        <p>Payment Method: {paymentMethod}</p>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={openCheckout} onClose={() => setOpenCheckout(false)}>
        <DialogTitle>Complete Order</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Customer Name (Optional)"
              variant="outlined"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Customer Phone (Optional)"
              variant="outlined"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                label="Payment Method"
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "CASH" | "CARD")
                }
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="h6" align="right">
              Total: £{totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckout(false)}>Cancel</Button>
          <Button
            onClick={handleCreateOrder}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Complete Order"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alertInfo.severity}
          sx={{ width: "100%" }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BarcodeOrderPage;
