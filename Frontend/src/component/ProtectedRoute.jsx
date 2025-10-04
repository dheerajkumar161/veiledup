import React from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { Outlet, Navigate } from "react-router-dom";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
}
