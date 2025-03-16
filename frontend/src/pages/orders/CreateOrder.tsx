import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Chip,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  QrCodeScanner as ScannerIcon,
  Print as PrintIcon,
  ViewList as ViewListIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { getCategories } from "../../store/slices/categoriesSlice";
import { getParts } from "../../store/slices/partsSlice";
import {
  createOrder,
  CreateOrderRequest,
} from "../../store/slices/ordersSlice";
import BarcodeOrderScanner from "../../components/BarcodeOrderScanner";
import { formatCurrency } from "../../utils/formatters";
import receiptService from "../../services/receiptService";

interface Category {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiPart {
  _id: string;
  name: string;
  buyingPrice: number;
  sellingPrice: number;
  category: Category | string;
  quantity: number;
  minQuantity: number;
  barcode?: string;
}

interface SelectedPart {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchParts, setSearchParts] = useState("");
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [openPartsModal, setOpenPartsModal] = useState(false);
  const [tempQuantity, setTempQuantity] = useState<{ [key: string]: string }>(
    {}
  );
  const [alertInfo, setAlertInfo] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [tabValue, setTabValue] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState(false);

  const { categories, loading: categoriesLoading } = useAppSelector(
    (state) => state.categories
  );
  const { parts, loading: partsLoading } = useAppSelector(
    (state) => state.parts
  ) as { parts: ApiPart[]; loading: boolean };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data...");
        const partsResult = await dispatch(getParts()).unwrap();
        const categoriesResult = await dispatch(getCategories()).unwrap();
        console.log("Fetched parts:", partsResult);
        console.log("Fetched categories:", categoriesResult);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAlertInfo({
          open: true,
          message:
            "Error loading data. Please check if the backend server is running.",
          severity: "error",
        });
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    console.log("Current parts in store:", parts);
    console.log("Current categories in store:", categories);
  }, [parts, categories]);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchCategory.toLowerCase())
  );

  const filteredParts = parts.filter((part) => {
    console.log("Filtering part:", part);
    console.log("Selected category:", selectedCategory);
    console.log("Part category:", part.category);

    // Handle both cases where category might be an object or string
    const categoryId =
      typeof part.category === "string" ? part.category : part.category._id;

    const matches =
      selectedCategory &&
      categoryId === selectedCategory &&
      (searchParts === "" ||
        part.name.toLowerCase().includes(searchParts.toLowerCase()));
    console.log("Part matches filter:", matches);
    return matches;
  });

  const handleCategoryClick = (categoryId: string) => {
    console.log("Category clicked:", categoryId);
    console.log("All parts:", parts);
    console.log(
      "Parts for this category:",
      parts.filter((part) => part.category.toString() === categoryId)
    );

    setSelectedCategory(categoryId);
    setOpenPartsModal(true);
    setSearchParts("");
    setTempQuantity({});
  };

  const handleQuantityChange = (partId: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      const part = parts.find((p) => p._id === partId);
      if (part && parseInt(value) > part.quantity) {
        setAlertInfo({
          open: true,
          message: `Cannot add more than available stock (${part.quantity} available)`,
          severity: "warning",
        });
      }
      setTempQuantity((prev) => ({ ...prev, [partId]: value }));
    }
  };

  const handleAddParts = () => {
    const validParts = Object.entries(tempQuantity)
      .filter(([partId, quantity]) => {
        if (quantity === "" || parseInt(quantity) <= 0) return false;
        const part = parts.find((p) => p._id === partId);
        return part && parseInt(quantity) <= part.quantity;
      })
      .map(([partId, quantity]) => {
        const part = parts.find((p) => p._id === partId);
        return {
          _id: partId,
          name: part!.name,
          price: part!.sellingPrice,
          quantity: parseInt(quantity),
        };
      });

    if (validParts.length === 0) {
      setAlertInfo({
        open: true,
        message: "No valid parts selected or quantities exceed available stock",
        severity: "error",
      });
      return;
    }

    setSelectedParts((prev) => {
      const updatedParts = [...prev];
      validParts.forEach((newPart) => {
        const existingIndex = updatedParts.findIndex(
          (p) => p._id === newPart._id
        );
        if (existingIndex >= 0) {
          updatedParts[existingIndex] = newPart;
        } else {
          updatedParts.push(newPart);
        }
      });
      return updatedParts;
    });

    setOpenPartsModal(false);
  };

  const calculateTotal = () => {
    return selectedParts.reduce(
      (total, part) => total + part.price * part.quantity,
      0
    );
  };

  const handleSubmit = async () => {
    try {
      if (selectedParts.length === 0) {
        setAlertInfo({
          open: true,
          message: "Please select at least one part",
          severity: "error",
        });
        return;
      }

      const orderData: CreateOrderRequest = {
        items: selectedParts.map((part) => ({
          part: part._id,
          quantity: part.quantity,
          price: part.price,
        })),
        totalAmount: calculateTotal(),
        status: "PENDING" as const,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      setCreatedOrderId(result._id);
      setAlertInfo({
        open: true,
        message: "Order created successfully. You can now print the receipt.",
        severity: "success",
      });
    } catch (error: any) {
      setAlertInfo({
        open: true,
        message: error.message || "Failed to create order",
        severity: "error",
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeInput(e.target.value);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      addPartByBarcode(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  const handleBarcodeDetected = (detectedBarcode: string) => {
    console.log("Barcode detected:", detectedBarcode);
    addPartByBarcode(detectedBarcode);
  };

  const addPartByBarcode = (barcode: string) => {
    // Find the part with the matching barcode
    const part = parts.find((p) => p.barcode === barcode);

    if (!part) {
      setAlertInfo({
        open: true,
        message: `No part found with barcode: ${barcode}`,
        severity: "error",
      });
      return;
    }

    // Check if we have stock
    if (part.quantity <= 0) {
      setAlertInfo({
        open: true,
        message: `${part.name} is out of stock`,
        severity: "error",
      });
      return;
    }

    // Check if the part is already in the order
    const existingPartIndex = selectedParts.findIndex(
      (p) => p._id === part._id
    );

    if (existingPartIndex >= 0) {
      // Part already exists, increment quantity if stock allows
      const currentQuantity = selectedParts[existingPartIndex].quantity;

      if (currentQuantity + 1 > part.quantity) {
        setAlertInfo({
          open: true,
          message: `Cannot add more ${part.name} (only ${part.quantity} in stock)`,
          severity: "warning",
        });
        return;
      }

      // Update the quantity
      const updatedParts = [...selectedParts];
      updatedParts[existingPartIndex] = {
        ...updatedParts[existingPartIndex],
        quantity: currentQuantity + 1,
      };

      setSelectedParts(updatedParts);

      setAlertInfo({
        open: true,
        message: `Added another ${part.name} (Total: ${currentQuantity + 1})`,
        severity: "success",
      });
    } else {
      // Add new part to the order
      setSelectedParts([
        ...selectedParts,
        {
          _id: part._id,
          name: part.name,
          price: part.sellingPrice,
          quantity: 1,
        },
      ]);

      setAlertInfo({
        open: true,
        message: `Added ${part.name} to the order`,
        severity: "success",
      });
    }
  };

  const removeSelectedPart = (partId: string) => {
    setSelectedParts(selectedParts.filter((part) => part._id !== partId));
  };

  const updateSelectedPartQuantity = (partId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeSelectedPart(partId);
      return;
    }

    const part = parts.find((p) => p._id === partId);
    if (part && newQuantity > part.quantity) {
      setAlertInfo({
        open: true,
        message: `Cannot add more than available stock (${part.quantity} available)`,
        severity: "warning",
      });
      return;
    }

    setSelectedParts(
      selectedParts.map((part) =>
        part._id === partId ? { ...part, quantity: newQuantity } : part
      )
    );
  };

  // Add a handler for printing receipts
  const handlePrintReceipt = async () => {
    if (!createdOrderId) {
      setAlertInfo({
        open: true,
        message: "No order has been created yet",
        severity: "error",
      });
      return;
    }

    try {
      setPrintingReceipt(true);
      await receiptService.printReceipt(createdOrderId);
      setAlertInfo({
        open: true,
        message: "Receipt printed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error printing receipt:", error);
      setAlertInfo({
        open: true,
        message: "Failed to print receipt. Please try again.",
        severity: "error",
      });
    } finally {
      setPrintingReceipt(false);
    }
  };

  // Function to reset the form for a new order
  const resetForm = () => {
    setSelectedParts([]);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCategory(null);
    setBarcodeInput("");
    setCreatedOrderId(null);
    setTabValue(0);
  };

  if (categoriesLoading || partsLoading) {
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
        onClose={() => setAlertInfo((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setAlertInfo((prev) => ({ ...prev, open: false }))}
          severity={alertInfo.severity}
          sx={{ width: "100%" }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ mb: 3 }}>
        Create New Order
      </Typography>

      <Grid container spacing={3}>
        {/* Order Summary and Customer Info Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Browse Categories" />
                  <Tab label="Scan Barcode" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <Button
                  variant="contained"
                  onClick={() => setOpenPartsModal(true)}
                  disabled={!selectedCategory}
                  sx={{ mb: 2 }}
                >
                  Select Parts
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Select a category from the right panel, then click "Select
                  Parts" to add items to your order.
                </Typography>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <form onSubmit={handleBarcodeSubmit}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={7}>
                        <TextField
                          fullWidth
                          label="Scan Barcode"
                          variant="outlined"
                          value={barcodeInput}
                          onChange={handleBarcodeInputChange}
                          placeholder="Enter barcode or use scanner"
                        />
                      </Grid>
                      <Grid item xs={8} sm={3}>
                        <Button
                          fullWidth
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={!barcodeInput.trim()}
                        >
                          Add Item
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
                        />
                      </Grid>
                    </Grid>
                  </form>
                </Paper>
                <Typography variant="body2" color="text.secondary">
                  Scan a barcode or use the scanner button to add items directly
                  to your order.
                </Typography>
              </TabPanel>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected Parts
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Part Name</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedParts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No parts selected yet. Browse categories or scan
                          barcodes to add parts.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedParts.map((part) => (
                        <TableRow key={part._id}>
                          <TableCell>{part.name}</TableCell>
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
                                  updateSelectedPartQuantity(
                                    part._id,
                                    part.quantity - 1
                                  )
                                }
                              >
                                -
                              </IconButton>
                              <Typography sx={{ mx: 1 }}>
                                {part.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  updateSelectedPartQuantity(
                                    part._id,
                                    part.quantity + 1
                                  )
                                }
                              >
                                +
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(part.price)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(part.price * part.quantity)}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => removeSelectedPart(part._id)}
                            >
                              ×
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {selectedParts.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="h6">Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6">
                            {formatCurrency(calculateTotal())}
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Categories Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "calc(100vh - 200px)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Categories
              </Typography>
              <TextField
                fullWidth
                label="Search Categories"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <List
                sx={{
                  height: "calc(100vh - 350px)",
                  overflowY: "auto",
                  bgcolor: "background.paper",
                }}
              >
                {filteredCategories.map((category) => (
                  <React.Fragment key={category._id}>
                    <ListItemButton
                      onClick={() => handleCategoryClick(category._id)}
                      selected={selectedCategory === category._id}
                    >
                      <ListItemText primary={category.name} />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            {createdOrderId && (
              <>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={resetForm}
                >
                  Create New Order
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ViewListIcon />}
                  onClick={() => navigate("/orders")}
                >
                  View Orders
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PrintIcon />}
                  onClick={handlePrintReceipt}
                  disabled={printingReceipt}
                >
                  {printingReceipt ? "Printing..." : "Print Receipt"}
                </Button>
              </>
            )}
            <Button
              variant="contained"
              size="large"
              startIcon={<CartIcon />}
              onClick={handleSubmit}
              disabled={selectedParts.length === 0 || !!createdOrderId}
            >
              Create Order
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Parts Selection Modal */}
      <Dialog
        open={openPartsModal}
        onClose={() => setOpenPartsModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Select Parts from{" "}
          {categories.find((c) => c._id === selectedCategory)?.name}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Search Parts"
            value={searchParts}
            onChange={(e) => setSearchParts(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Part Name</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part._id}>
                    <TableCell>{part.name}</TableCell>
                    <TableCell>{formatCurrency(part.sellingPrice)}</TableCell>
                    <TableCell>
                      {part.quantity <= part.minQuantity ? (
                        <Chip
                          label={`${part.quantity} (Low)`}
                          size="small"
                          color="error"
                        />
                      ) : (
                        part.quantity
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={tempQuantity[part._id] || ""}
                        onChange={(e) =>
                          handleQuantityChange(part._id, e.target.value)
                        }
                        inputProps={{ min: 1, max: part.quantity }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPartsModal(false)}>Cancel</Button>
          <Button onClick={handleAddParts} variant="contained">
            Add Selected Parts
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateOrder;
