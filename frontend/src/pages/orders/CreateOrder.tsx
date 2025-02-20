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
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { getCategories } from "../../store/slices/categoriesSlice";
import { getParts } from "../../store/slices/partsSlice";
import {
  createOrder,
  CreateOrderRequest,
} from "../../store/slices/ordersSlice";

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
  price: number;
  category: Category | string;
  quantity: number;
}

interface SelectedPart {
  _id: string;
  name: string;
  price: number;
  quantity: number;
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
          price: part!.price,
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

      await dispatch(createOrder(orderData)).unwrap();
      setAlertInfo({
        open: true,
        message: "Order created successfully",
        severity: "success",
      });
      navigate("/orders");
    } catch (error: any) {
      setAlertInfo({
        open: true,
        message: error.message || "Failed to create order",
        severity: "error",
      });
    }
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
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedParts.map((part) => (
                      <TableRow key={part._id}>
                        <TableCell>{part.name}</TableCell>
                        <TableCell align="right">{part.quantity}</TableCell>
                        <TableCell align="right">
                          ${part.price.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ${(part.price * part.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="h6">Total</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6">
                          ${calculateTotal().toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
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
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CartIcon />}
              onClick={handleSubmit}
              disabled={selectedParts.length === 0}
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
                {filteredParts.map((part) => {
                  const isOverStock =
                    tempQuantity[part._id] &&
                    parseInt(tempQuantity[part._id]) > part.quantity;
                  return (
                    <TableRow
                      key={part._id}
                      sx={{
                        backgroundColor: isOverStock
                          ? "error.light"
                          : "inherit",
                      }}
                    >
                      <TableCell>{part.name}</TableCell>
                      <TableCell>${part.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Typography
                          color={part.quantity < 5 ? "error" : "inherit"}
                          sx={{
                            fontWeight: part.quantity < 5 ? "bold" : "normal",
                          }}
                        >
                          {part.quantity} in stock
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="text"
                          value={tempQuantity[part._id] || ""}
                          onChange={(e) =>
                            handleQuantityChange(part._id, e.target.value)
                          }
                          error={Boolean(isOverStock)}
                          helperText={
                            isOverStock ? "Exceeds available stock" : ""
                          }
                          inputProps={{
                            style: { textAlign: "right" },
                            max: part.quantity,
                          }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
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
