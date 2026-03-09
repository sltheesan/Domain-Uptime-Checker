import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;