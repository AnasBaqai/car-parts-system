import React, { useEffect, useRef, useState } from "react";
import Quagga from "quagga";
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Slider,
  FormControlLabel,
  Switch,
  Collapse,
} from "@mui/material";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose?: () => void;
}

// Frequency map to track barcode occurrences
interface BarcodeFrequency {
  [key: string]: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onDetected,
  onClose,
}) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [frequencyThreshold, setFrequencyThreshold] = useState(9);
  const [detectionCount, setDetectionCount] = useState(0);

  // Barcode frequency tracking
  const barcodeFrequency = useRef<BarcodeFrequency>({});
  const lastDetectedCode = useRef<string | null>(null);
  const currentDetectedCode = useRef<string | null>(null);

  // Reset frequency map when component unmounts or when scanner is stopped
  const resetFrequencyMap = () => {
    barcodeFrequency.current = {};
    lastDetectedCode.current = null;
    currentDetectedCode.current = null;
    setDetectionCount(0);
  };

  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (initialized) {
        try {
          Quagga.stop();
          resetFrequencyMap();
        } catch (err) {
          console.error("Error stopping Quagga:", err);
        }
      }
    };
  }, [initialized]);

  const applyImageProcessing = () => {
    if (!initialized) return;

    try {
      // Get the active track
      const track = Quagga.CameraAccess.getActiveTrack();

      // Check if the track exists and supports constraints
      if (track && typeof track.applyConstraints === "function") {
        // Apply image processing settings
        track
          .applyConstraints({
            advanced: [
              {
                brightness: brightness / 100,
                contrast: contrast / 100,
              },
            ],
          })
          .catch((err) => {
            console.log(
              "Camera doesn't support these image processing settings:",
              err
            );
          });
      }
    } catch (err) {
      console.log("Camera doesn't support image processing settings:", err);
    }
  };

  const startScanner = () => {
    if (scannerRef.current) {
      setScanning(true);
      setError(null);
      resetFrequencyMap();

      try {
        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: scannerRef.current,
              constraints: {
                width: { min: 640 },
                height: { min: 480 },
                facingMode: "environment", // Use the rear camera if available
                aspectRatio: { min: 1, max: 2 },
              },
              area: {
                // Only analyze the center 80% of the video
                top: "10%",
                right: "10%",
                left: "10%",
                bottom: "10%",
              },
              singleChannel: false, // Use all color channels for better accuracy
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader",
              ],
              multiple: false, // Only detect one barcode at a time
              debug: {
                showCanvas: true,
                showPatches: true,
                showFoundPatches: true,
                showSkeleton: true,
                showLabels: true,
                showPatchLabels: true,
                showRemainingPatchLabels: true,
              },
              // Increase the number of scan lines for better accuracy
              drawBoundingBox: true,
              showFrequency: true,
              drawScanline: true,
              showPattern: true,
            },
            locate: true,
            frequency: 10, // Scan 10 frames per second
          },
          (err) => {
            if (err) {
              setError(`Scanner initialization error: ${err}`);
              setScanning(false);
              return;
            }

            setInitialized(true);
            Quagga.start();

            // Apply initial image processing settings
            setTimeout(applyImageProcessing, 1000);

            // When a barcode is detected
            Quagga.onDetected((result) => {
              if (result && result.codeResult) {
                const code = result.codeResult.code;
                if (code) {
                  // If we're detecting a new code, reset the counter
                  if (currentDetectedCode.current !== code) {
                    currentDetectedCode.current = code;
                    barcodeFrequency.current[code] = 1;
                    setDetectionCount(1);
                  } else {
                    // Increment the counter for this code
                    barcodeFrequency.current[code] =
                      (barcodeFrequency.current[code] || 0) + 1;
                    setDetectionCount((prev) => prev + 1);
                  }

                  console.log(
                    `Barcode detected: ${code}, count: ${barcodeFrequency.current[code]}, threshold: ${frequencyThreshold}`
                  );

                  // Only accept a barcode if it's been detected multiple times
                  if (barcodeFrequency.current[code] >= frequencyThreshold) {
                    // If this is a new code or different from the last one
                    if (lastDetectedCode.current !== code) {
                      lastDetectedCode.current = code;
                      console.log(
                        `Confirmed barcode: ${code} (frequency: ${barcodeFrequency.current[code]})`
                      );
                      onDetected(code);
                      stopScanner();
                    }
                  }
                }
              }
            });

            // Handle errors
            Quagga.onProcessed((result) => {
              const drawingCtx = Quagga.canvas.ctx.overlay;
              const drawingCanvas = Quagga.canvas.dom.overlay;

              if (result) {
                if (result.boxes) {
                  drawingCtx.clearRect(
                    0,
                    0,
                    parseInt(drawingCanvas.getAttribute("width") || "0"),
                    parseInt(drawingCanvas.getAttribute("height") || "0")
                  );
                  result.boxes
                    .filter((box) => box !== result.box)
                    .forEach((box) => {
                      Quagga.ImageDebug.drawPath(
                        box,
                        { x: 0, y: 1 },
                        drawingCtx,
                        {
                          color: "green",
                          lineWidth: 2,
                        }
                      );
                    });
                }

                if (result.box) {
                  Quagga.ImageDebug.drawPath(
                    result.box,
                    { x: 0, y: 1 },
                    drawingCtx,
                    {
                      color: "#00F",
                      lineWidth: 2,
                    }
                  );
                }

                if (result.codeResult && result.codeResult.code) {
                  Quagga.ImageDebug.drawPath(
                    result.line,
                    { x: "x", y: "y" },
                    drawingCtx,
                    { color: "red", lineWidth: 3 }
                  );
                }
              }
            });
          }
        );
      } catch (err) {
        console.error("Error initializing Quagga:", err);
        setError(`Failed to initialize scanner: ${err}`);
        setScanning(false);
      }
    }
  };

  const stopScanner = () => {
    if (initialized) {
      try {
        Quagga.stop();
        setInitialized(false);
        resetFrequencyMap();
      } catch (err) {
        console.error("Error stopping Quagga:", err);
      }
    }
    setScanning(false);
  };

  const handleBrightnessChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    const value = newValue as number;
    setBrightness(value);
    applyImageProcessing();
  };

  const handleContrastChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setContrast(value);
    applyImageProcessing();
  };

  const handleFrequencyThresholdChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    const value = newValue as number;
    setFrequencyThreshold(value);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Barcode Scanner
      </Typography>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box
        ref={scannerRef}
        sx={{
          position: "relative",
          width: "100%",
          height: scanning ? "320px" : "auto",
          overflow: "hidden",
          mb: 2,
          border: scanning ? "1px solid #ccc" : "none",
          borderRadius: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!scanning && !error && (
          <Typography variant="body2" color="text.secondary">
            Click "Start Scanner" to scan a barcode using your camera
          </Typography>
        )}

        {!scanning && error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}

        {scanning && (
          <>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10,
                pointerEvents: "none",
                border: "2px solid #f50057",
                boxSizing: "border-box",
              }}
            />
            {currentDetectedCode.current && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 10,
                  left: 0,
                  width: "100%",
                  zIndex: 20,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "5px 10px",
                  textAlign: "center",
                }}
              >
                <Typography variant="body2">
                  Scanning: {currentDetectedCode.current} ({detectionCount}/
                  {frequencyThreshold})
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={showAdvanced}
            onChange={(e) => setShowAdvanced(e.target.checked)}
            disabled={!scanning}
          />
        }
        label="Advanced Settings"
        sx={{ mb: 1 }}
      />

      <Collapse in={showAdvanced && scanning}>
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Brightness</Typography>
          <Slider
            value={brightness}
            onChange={handleBrightnessChange}
            min={-100}
            max={100}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>Contrast</Typography>
          <Slider
            value={contrast}
            onChange={handleContrastChange}
            min={-100}
            max={100}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>
            Detection Threshold (higher = more accurate)
          </Typography>
          <Slider
            value={frequencyThreshold}
            onChange={handleFrequencyThresholdChange}
            min={1}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Box>
      </Collapse>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {!scanning ? (
          <Button variant="contained" color="primary" onClick={startScanner}>
            Start Scanner
          </Button>
        ) : (
          <Button variant="contained" color="secondary" onClick={stopScanner}>
            Stop Scanner
          </Button>
        )}

        {onClose && (
          <Button
            variant="outlined"
            onClick={() => {
              stopScanner();
              onClose();
            }}
          >
            Close
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default BarcodeScanner;
