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
} from "@mui/material";
import { useAppSelector } from "../../hooks/redux";

interface Part {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  minQuantity: number;
  manufacturer: string;
  partNumber: string;
}

interface PartFormData extends Omit<Part, "_id"> {}

interface PartDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (part: PartFormData) => void;
  initialData?: Part | null;
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
  });

  const { categories } = useAppSelector((state) => state.categories);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        category: initialData.category,
        price: initialData.price,
        quantity: initialData.quantity,
        minQuantity: initialData.minQuantity,
        manufacturer: initialData.manufacturer,
        partNumber: initialData.partNumber,
      });
    }
  }, [initialData]);

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {initialData ? "Update" : "Add"} Part
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PartDialog;
