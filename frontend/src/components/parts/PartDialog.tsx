import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CreateIcon from "@mui/icons-material/Create";
import { useAppSelector } from "../../hooks/redux";
import BarcodeScanner from "../BarcodeScanner";
import { Part as PartType, Category } from "../../store/slices/partsSlice";

// Define a simplified Part type for the form that only uses string for category
interface Part {
  _id: string;
  name: string;
  description?: string;
  category: string; // Always use string ID for category in the form
  price: number | string;
  quantity: number | string;
  minQuantity: number | string;
  manufacturer?: string;
  partNumber: string;
  barcode?: string;
}

export interface PartFormData {
  name: string;
  description?: string;
  category: string | Category;
  price: number | string;
  quantity: number | string;
  minQuantity: number | string;
  manufacturer?: string;
  partNumber: string;
  barcode?: string;
}

interface PartDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (part: PartFormData) => void;
  initialData?: PartType | null;
  title: string;
}

const PartDialog: React.FC<PartDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  title,
}) => {
  const [formData, setFormData] = useState<PartFormData>({
    name: "",
    description: "",
    category: "",
    price: 0,
    quantity: 0,
    minQuantity: 5,
    manufacturer: "",
    partNumber: "",
    barcode: "",
  });
  const [showBarcodeTools, setShowBarcodeTools] = useState(false);

  const { categories } = useAppSelector((state) => state.categories);

  useEffect(() => {
    if (initialData) {
      // Extract the category ID from the populated category object
      const categoryId =
        typeof initialData.category === "object" &&
        initialData.category !== null
          ? initialData.category._id
          : initialData.category;

      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        category: categoryId,
        price: initialData.price,
        quantity: initialData.quantity,
        minQuantity: initialData.minQuantity,
        manufacturer: initialData.manufacturer || "",
        partNumber: initialData.partNumber,
        barcode: initialData.barcode || "",
      });
    } else {
      // Generate a random part number for new parts
      const randomPartNumber = `P${Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")}`;

      setFormData({
        name: "",
        description: "",
        category: "",
        price: 0,
        quantity: 0,
        minQuantity: 5,
        manufacturer: "",
        partNumber: randomPartNumber,
        barcode: "",
      });
    }
    setShowBarcodeTools(false);
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Allow empty values for number fields
    if (
      (name === "price" || name === "quantity" || name === "minQuantity") &&
      value === ""
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("price") || name.includes("quantity")
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert any empty string values to 0 before submitting
    const submissionData = {
      ...formData,
      price: formData.price === "" ? 0 : Number(formData.price),
      quantity: formData.quantity === "" ? 0 : Number(formData.quantity),
      minQuantity:
        formData.minQuantity === "" ? 0 : Number(formData.minQuantity),
    };

    onSubmit(submissionData);
  };

  const handleBarcodeDetected = (barcode: string) => {
    setFormData((prev) => ({
      ...prev,
      barcode,
    }));
    setShowBarcodeTools(false);
  };

  const handleDialogClose = () => {
    setShowBarcodeTools(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {showBarcodeTools ? (
            <Box sx={{ width: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Scan Barcode
              </Typography>
              <BarcodeScanner
                onDetected={handleBarcodeDetected}
                onClose={() => setShowBarcodeTools(false)}
              />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <TextField
                    name="barcode"
                    label="Barcode"
                    fullWidth
                    value={formData.barcode}
                    onChange={handleChange}
                    sx={{ mr: 1 }}
                  />
                  <Tooltip title="Barcode Tools">
                    <IconButton
                      color="primary"
                      onClick={() => setShowBarcodeTools(true)}
                      sx={{ mt: 1 }}
                    >
                      <QrCodeScannerIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Part Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="category"
                  label="Category"
                  fullWidth
                  required
                  select
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="price"
                  label="Price"
                  type="number"
                  fullWidth
                  required
                  value={formData.price}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="quantity"
                  label="Quantity"
                  type="number"
                  fullWidth
                  required
                  value={formData.quantity}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="minQuantity"
                  label="Minimum Quantity"
                  type="number"
                  fullWidth
                  required
                  value={formData.minQuantity}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="manufacturer"
                  label="Manufacturer"
                  fullWidth
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="partNumber"
                  label="Part Number"
                  fullWidth
                  value={formData.partNumber}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={showBarcodeTools}>
            {initialData ? "Update" : "Add"} Part
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PartDialog;
