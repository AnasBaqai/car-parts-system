import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
