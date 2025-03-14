import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Collapse,
  IconButton,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { login, clearError } from "../../store/slices/authSlice";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, loading, error, errorDetails } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/dashboard");
      } else if (user.status === "verified") {
        navigate("/dashboard");
      } else {
        navigate("/pending-verification");
      }
    }
    return () => {
      dispatch(clearError());
    };
  }, [user, navigate, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting login form:", {
      email,
      apiUrl: process.env.REACT_APP_API_URL,
    });
    dispatch(login({ email, password }));
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Car Parts Management System
          </Typography>
          <Typography component="h2" variant="h6" gutterBottom>
            Login
          </Typography>

          {error && (
            <Box sx={{ width: "100%", mb: 2 }}>
              <Alert
                severity="error"
                action={
                  errorDetails && (
                    <IconButton
                      aria-label="show more"
                      color="inherit"
                      size="small"
                      onClick={toggleDetails}
                    >
                      {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )
                }
              >
                {error}
              </Alert>

              {errorDetails && (
                <Collapse in={showDetails}>
                  <Box
                    sx={{ mt: 1, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Error Details:
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "0.75rem",
                        mt: 1,
                      }}
                    >
                      {JSON.stringify(errorDetails, null, 2)}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      API URL:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                      {process.env.REACT_APP_API_URL || "Not configured"}
                    </Typography>
                  </Box>
                </Collapse>
              )}
            </Box>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 2, width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate("/register")}
            >
              Don't have an account? Register
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
