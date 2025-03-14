import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";

interface PrivateRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const { user } = useAppSelector((state) => state.auth);

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If admin route but user is not admin, redirect to dashboard
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // If user account is pending or rejected, redirect to pending verification page
  if (user.role !== "admin" && user.status !== "verified") {
    return <Navigate to="/pending-verification" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
