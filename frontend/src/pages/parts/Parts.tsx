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
  Tooltip,
  TablePagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  getParts,
  getLowStockParts,
  createPart,
  updatePart,
  deletePart,
  Part,
  Category,
} from "../../store/slices/partsSlice";
import { getCategories } from "../../store/slices/categoriesSlice";
import PartDialog, {
  PartFormData as PartDialogFormData,
} from "../../components/parts/PartDialog";
import { formatCurrency } from "../../utils/formatters";

// Keep this for backward compatibility but don't use it for the handleSubmit function
// type PartFormData = Omit<Part, "_id">;

const Parts: React.FC = () => {
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    // Extract the category ID from the populated category object
    const categoryId =
      typeof part.category === "object" && part.category !== null
        ? part.category._id
        : part.category;

    setSelectedPart({
      ...part,
      category: categoryId,
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (part: Part) => {
    // Extract the category ID from the populated category object
    const categoryId =
      typeof part.category === "object" && part.category !== null
        ? part.category._id
        : part.category;

    setPartToDelete({
      ...part,
      category: categoryId,
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

  const handleSubmit = async (formData: PartDialogFormData) => {
    // Create a properly typed object for the API
    const apiData = {
      name: formData.name,
      description: formData.description,
      category:
        typeof formData.category === "object" && formData.category !== null
          ? formData.category._id
          : formData.category,
      price:
        typeof formData.price === "string"
          ? formData.price === ""
            ? 0
            : Number(formData.price)
          : formData.price,
      quantity:
        typeof formData.quantity === "string"
          ? formData.quantity === ""
            ? 0
            : Number(formData.quantity)
          : formData.quantity,
      minQuantity:
        typeof formData.minQuantity === "string"
          ? formData.minQuantity === ""
            ? 0
            : Number(formData.minQuantity)
          : formData.minQuantity,
      manufacturer: formData.manufacturer,
      partNumber: formData.partNumber,
      barcode: formData.barcode,
    };

    if (selectedPart) {
      // Access the _id property using bracket notation to avoid TypeScript errors
      const id = selectedPart["_id"];
      await dispatch(updatePart({ id, partData: apiData }));
    } else {
      await dispatch(createPart(apiData));
    }
    setOpenDialog(false);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredParts = parts.filter(
    (part) =>
      part.name.toLowerCase().includes(search.toLowerCase()) ||
      part.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      (part.barcode &&
        part.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  // Apply pagination to filtered parts
  const paginatedParts = filteredParts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getCategoryName = (category: string | Category): string => {
    if (typeof category === "object" && category !== null) {
      return category.name;
    }

    const foundCategory = categories.find((c) => c._id === category);
    return foundCategory ? foundCategory.name : "Unknown";
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
            placeholder="Search by name, manufacturer, or barcode"
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedParts.map((part) => (
              <TableRow key={part._id}>
                <TableCell>{part.name}</TableCell>
                <TableCell>{getCategoryName(part.category)}</TableCell>
                <TableCell>{part.manufacturer}</TableCell>
                <TableCell align="right">
                  {formatCurrency(part.price)}
                </TableCell>
                <TableCell align="right">{part.quantity}</TableCell>
                <TableCell>
                  {part.barcode ? (
                    <Tooltip title={part.barcode}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <QrCodeIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 100 }}
                        >
                          {part.barcode}
                        </Typography>
                      </Box>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No barcode
                    </Typography>
                  )}
                </TableCell>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredParts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
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
