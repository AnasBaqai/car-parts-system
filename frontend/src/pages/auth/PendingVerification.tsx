import React from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Alert,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logout } from "../../store/slices/authSlice";

const PendingVerification: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (user.status === "verified") {
    navigate("/dashboard");
    return null;
  }

  if (user.status === "rejected") {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Account Rejected
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Your account has been rejected by an administrator.
          </Alert>

          <Typography paragraph>
            We're sorry, but your account registration has been rejected. This
            could be due to various reasons, such as:
          </Typography>

          <ul>
            <li>Incomplete or incorrect registration information</li>
            <li>Violation of our terms of service</li>
            <li>Suspicious activity detected</li>
          </ul>

          <Typography paragraph>
            If you believe this is an error, please contact our support team for
            assistance.
          </Typography>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogout}
              sx={{ px: 4 }}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Account Pending Verification
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Your account is pending verification by an administrator.
        </Alert>

        <Typography paragraph>
          Thank you for registering! Your account has been created successfully,
          but it requires verification by an administrator before you can access
          the system.
        </Typography>

        <Typography paragraph>
          This process typically takes 1-2 business days. You will receive an
          email notification once your account has been verified.
        </Typography>

        <Typography paragraph>
          If you have any questions or need immediate assistance, please contact
          our support team.
        </Typography>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogout}
            sx={{ px: 4 }}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PendingVerification;
