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
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CreateIcon from "@mui/icons-material/Create";
import { useAppSelector } from "../../hooks/redux";
import BarcodeScanner from "../BarcodeScanner";
import BarcodeGenerator from "../BarcodeGenerator";
import { Part as PartType, Category } from "../../store/slices/partsSlice";

// Define a simplified Part type for the form that only uses string for category
interface Part {
  _id: string;
  name: string;
  description: string;
  category: string; // Always use string ID for category in the form
  price: number;
  quantity: number;
  minQuantity: number;
  manufacturer: string;
  partNumber: string;
  barcode?: string;
}

interface PartFormData extends Omit<Part, "_id"> {}

interface PartDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (part: PartFormData) => void;
  initialData?: PartType | null;
  title: string;
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
      id={`barcode-tabpanel-${index}`}
      aria-labelledby={`barcode-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
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
  const [tabValue, setTabValue] = useState(0);

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
        description: initialData.description,
        category: categoryId,
        price: initialData.price,
        quantity: initialData.quantity,
        minQuantity: initialData.minQuantity,
        manufacturer: initialData.manufacturer,
        partNumber: initialData.partNumber,
        barcode: initialData.barcode || "",
      });
    } else {
      setFormData({
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
    }
    setShowBarcodeTools(false);
    setTabValue(0);
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
    onSubmit(formData);
  };

  const handleBarcodeDetected = (barcode: string) => {
    setFormData((prev) => ({
      ...prev,
      barcode,
    }));
    setShowBarcodeTools(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="barcode tabs"
                >
                  <Tab label="Scan Barcode" />
                  <Tab label="Generate Test Barcode" />
                </Tabs>
              </Box>
              <TabPanel value={tabValue} index={0}>
                <BarcodeScanner
                  onDetected={handleBarcodeDetected}
                  onClose={() => setShowBarcodeTools(false)}
                />
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <BarcodeGenerator
                  onGenerate={handleBarcodeDetected}
                  onClose={() => setShowBarcodeTools(false)}
                />
              </TabPanel>
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
                  required
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
                  required
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="partNumber"
                  label="Part Number"
                  fullWidth
                  required
                  value={formData.partNumber}
                  onChange={handleChange}
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
