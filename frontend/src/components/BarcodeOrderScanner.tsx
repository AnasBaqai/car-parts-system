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
              Point your camera at a barcode to scan
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={handleClose}
          />
        </DialogContent>
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
