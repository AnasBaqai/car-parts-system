import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useAppSelector } from "../../hooks/redux";
import api from "../../services/api";

interface User {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  status: "pending" | "verified" | "rejected";
  createdAt: string;
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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    userId: "",
    username: "",
    action: "" as "verify" | "reject",
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/users");
      setUsers(response.data);
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/users/pending");
      setPendingUsers(response.data);
      setError(null);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to fetch pending users"
      );
      console.error("Error fetching pending users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleVerifyClick = (userId: string, username: string) => {
    setConfirmDialog({
      open: true,
      userId,
      username,
      action: "verify",
    });
  };

  const handleRejectClick = (userId: string, username: string) => {
    setConfirmDialog({
      open: true,
      userId,
      username,
      action: "reject",
    });
  };

  const handleConfirmAction = async () => {
    try {
      setLoading(true);
      const status =
        confirmDialog.action === "verify" ? "verified" : "rejected";
      await api.put("/admin/users/status", {
        userId: confirmDialog.userId,
        status,
      });

      // Refresh user lists
      fetchUsers();
      fetchPendingUsers();

      setError(null);
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update user status");
      console.error("Error updating user status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "pending":
        return <Chip label="Pending" color="warning" size="small" />;
      case "verified":
        return <Chip label="Verified" color="success" size="small" />;
      case "rejected":
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getRoleChip = (role: string) => {
    switch (role) {
      case "admin":
        return <Chip label="Admin" color="primary" size="small" />;
      case "user":
        return <Chip label="User" color="default" size="small" />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  // If user is not an admin, show access denied
  if (user?.role !== "admin") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. This page is only accessible to administrators.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: "100%", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin tabs"
          centered
        >
          <Tab label="Pending Approvals" />
          <Tab label="All Users" />
        </Tabs>

        {/* Pending Approvals Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Pending User Approvals
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
              <CircularProgress />
            </Box>
          ) : pendingUsers.length === 0 ? (
            <Alert severity="info">No pending user approvals.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Registration Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusChip(user.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() =>
                              handleVerifyClick(user._id, user.username)
                            }
                          >
                            Verify
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() =>
                              handleRejectClick(user._id, user.username)
                            }
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* All Users Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            All Users
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Alert severity="info">No users found.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Registration Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleChip(user.role)}</TableCell>
                      <TableCell>{getStatusChip(user.status)}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.role !== "admin" && (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {user.status !== "verified" && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() =>
                                  handleVerifyClick(user._id, user.username)
                                }
                              >
                                Verify
                              </Button>
                            )}
                            {user.status !== "rejected" && (
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() =>
                                  handleRejectClick(user._id, user.username)
                                }
                              >
                                Reject
                              </Button>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to{" "}
            {confirmDialog.action === "verify" ? "verify" : "reject"} the
            account for user <strong>{confirmDialog.username}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmDialog.action === "verify" ? "success" : "error"}
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
