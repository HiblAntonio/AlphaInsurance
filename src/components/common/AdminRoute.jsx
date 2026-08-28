import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../services/authService";

export default function AdminRoute({ children }) {
  const user = getCurrentUser();
  const isAdmin = String(user?.role ?? "").toLowerCase() === "admin";
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}
