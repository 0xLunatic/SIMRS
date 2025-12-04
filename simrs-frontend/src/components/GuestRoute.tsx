import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface GuestRouteProps {
  children: ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const token = localStorage.getItem("token");

  // kalau sudah login, jangan biarkan ke halaman login lagi
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
