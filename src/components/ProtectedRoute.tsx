import { Navigate } from "react-router-dom";
import { getUser } from "../services/api";

type Props = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const user = getUser();
  const token = localStorage.getItem("token");

  // Se não estiver autenticado
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // Se requer admin mas o usuário não é admin
  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
