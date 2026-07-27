import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { prestadorId, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;
  if (!prestadorId) return <Navigate to="/login" replace />;
  return children;
}
