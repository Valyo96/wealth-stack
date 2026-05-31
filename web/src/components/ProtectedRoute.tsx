import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";

export function ProtectedRoute() {
  const { loggedIn } = useAuth();
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
