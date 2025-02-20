import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  getParts,
  createPart,
  updatePart,
  deletePart,
} from "../../store/slices/partsSlice";
import { getCategories } from "../../store/slices/categoriesSlice";
import PartDialog from "../../components/parts/PartDialog";

interface Category {
  _id: string;
  name: string;
  description: string;
}

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

type PartFormData = Omit<Part, "_id">;

const Parts: React.FC = () => {
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);

  const dispatch = useAppDispatch();
  const { parts, loading } = useAppSelector((state) => state.parts);
  const { categories } = useAppSelector((state) => state.categories);

  useEffect(() => {
    dispatch(getParts());
    dispatch(getCategories());
  }, [dispatch]);

  const handleAddPart = () => {
    setSelectedPart(null);
    setOpenDialog(true);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart({
      ...part,
      category: part.category.toString(),
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (part: Part) => {
    setPartToDelete({
      ...part,
      category: part.category.toString(),
    });
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (partToDelete) {
      await dispatch(deletePart(partToDelete._id));
      setOpenDeleteDialog(false);
      setPartToDelete(null);
    }
  };

  const handleSubmit = async (formData: PartFormData) => {
    if (selectedPart) {
      await dispatch(updatePart({ id: selectedPart._id, partData: formData }));
    } else {
      await dispatch(createPart(formData));
    }
    setOpenDialog(false);
  };

  const filteredParts = parts.filter(
    (part) =>
      part.name.toLowerCase().includes(search.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      part.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c._id === categoryId);
    return category ? category.name : "Unknown";
  };

  if (loading && parts.length === 0) {
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Parts Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPart}
        >
          Add Part
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search parts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, part number, or manufacturer"
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Part Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParts.map((part) => (
              <TableRow key={part._id}>
                <TableCell>{part.partNumber}</TableCell>
                <TableCell>{part.name}</TableCell>
                <TableCell>{getCategoryName(part.category)}</TableCell>
                <TableCell>{part.manufacturer}</TableCell>
                <TableCell align="right">${part.price.toFixed(2)}</TableCell>
                <TableCell align="right">{part.quantity}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      part.quantity <= part.minQuantity
                        ? "Low Stock"
                        : "In Stock"
                    }
                    color={
                      part.quantity <= part.minQuantity ? "error" : "success"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditPart(part)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(part)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <PartDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        initialData={selectedPart}
        title={selectedPart ? "Edit Part" : "Add New Part"}
      />

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this part?
          {partToDelete && (
            <Typography color="error" sx={{ mt: 1 }}>
              {partToDelete.name} ({partToDelete.partNumber})
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Parts;
