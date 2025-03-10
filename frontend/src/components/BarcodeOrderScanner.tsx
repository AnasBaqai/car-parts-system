import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import BarcodeScanner from "./BarcodeScanner";
import BarcodeGenerator from "./BarcodeGenerator";

interface BarcodeOrderScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  disabled?: boolean;
}

const BarcodeOrderScanner: React.FC<BarcodeOrderScannerProps> = ({
  onBarcodeDetected,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"scan" | "generate">("scan");
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleBarcodeDetected = (barcode: string) => {
    // Show feedback
    setFeedback({
      open: true,
      message: `Barcode detected: ${barcode}`,
      severity: "success",
    });

    // Call the parent handler
    onBarcodeDetected(barcode);

    // Close the dialog
    handleClose();
  };

  const handleCloseFeedback = () => {
    setFeedback({
      ...feedback,
      open: false,
    });
  };

  return (
    <>
      <Tooltip title="Scan Barcode">
        <span>
          <IconButton
            color="primary"
            onClick={handleOpen}
            disabled={disabled}
            size="large"
          >
            <QrCodeScannerIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Barcode Scanner</Typography>
            <Typography variant="body2" color="text.secondary">
              Scan a barcode to add an item to your order
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button
              variant={scannerMode === "scan" ? "contained" : "outlined"}
              onClick={() => setScannerMode("scan")}
              sx={{ mr: 1 }}
            >
              Scan with Camera
            </Button>
            <Button
              variant={scannerMode === "generate" ? "contained" : "outlined"}
              onClick={() => setScannerMode("generate")}
            >
              Generate Test Barcode
            </Button>
          </Box>

          {scannerMode === "scan" ? (
            <BarcodeScanner
              onDetected={handleBarcodeDetected}
              onClose={handleClose}
            />
          ) : (
            <BarcodeGenerator
              onGenerate={handleBarcodeDetected}
              onClose={handleClose}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={3000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity}
          variant="filled"
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BarcodeOrderScanner;
