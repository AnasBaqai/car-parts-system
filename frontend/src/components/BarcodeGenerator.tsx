import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";

interface BarcodeGeneratorProps {
  onGenerate: (barcode: string) => void;
  onClose?: () => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  onGenerate,
  onClose,
}) => {
  const [barcodeType, setBarcodeType] = useState("EAN-13");
  const [customValue, setCustomValue] = useState("");
  const [randomValue, setRandomValue] = useState("");

  // Generate a random EAN-13 barcode
  const generateRandomEAN13 = () => {
    // Generate first 12 digits
    let code = "";
    for (let i = 0; i < 12; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }

    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    // Add check digit to code
    code += checkDigit;

    setRandomValue(code);
    return code;
  };

  // Generate a random UPC-A barcode
  const generateRandomUPCA = () => {
    // Generate first 11 digits
    let code = "";
    for (let i = 0; i < 11; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }

    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 3 : 1);
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    // Add check digit to code
    code += checkDigit;

    setRandomValue(code);
    return code;
  };

  // Generate a random Code 128 barcode
  const generateRandomCode128 = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRandomValue(code);
    return code;
  };

  const handleGenerateRandom = () => {
    let barcode = "";

    switch (barcodeType) {
      case "EAN-13":
        barcode = generateRandomEAN13();
        break;
      case "UPC-A":
        barcode = generateRandomUPCA();
        break;
      case "CODE-128":
        barcode = generateRandomCode128();
        break;
      default:
        barcode = generateRandomEAN13();
    }

    onGenerate(barcode);
  };

  const handleUseCustom = () => {
    if (customValue.trim()) {
      onGenerate(customValue.trim());
    }
  };

  const handleUseGenerated = () => {
    if (randomValue) {
      onGenerate(randomValue);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Barcode Generator (For Testing)
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Since you don't have a physical barcode scanner, you can use this tool
        to generate test barcodes.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Barcode Type</InputLabel>
            <Select
              value={barcodeType}
              label="Barcode Type"
              onChange={(e) => setBarcodeType(e.target.value)}
            >
              <MenuItem value="EAN-13">EAN-13</MenuItem>
              <MenuItem value="UPC-A">UPC-A</MenuItem>
              <MenuItem value="CODE-128">CODE-128</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleGenerateRandom}
            sx={{ mb: 2 }}
          >
            Generate Random {barcodeType}
          </Button>
        </Grid>

        {randomValue && (
          <Grid item xs={12}>
            <Box
              sx={{ p: 2, border: "1px solid #ccc", borderRadius: 1, mb: 2 }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Generated Barcode:
              </Typography>
              <Typography variant="h5" sx={{ fontFamily: "monospace" }}>
                {randomValue}
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={handleUseGenerated}
              >
                Use This Barcode
              </Button>
            </Box>
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Or enter a custom barcode:
          </Typography>
          <TextField
            fullWidth
            label="Custom Barcode"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="outlined"
            onClick={handleUseCustom}
            disabled={!customValue.trim()}
          >
            Use Custom Barcode
          </Button>
        </Grid>
      </Grid>

      {onClose && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Close</Button>
        </Box>
      )}
    </Paper>
  );
};

export default BarcodeGenerator;
