import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (user.isBlocked) {
    // User is blocked, redirect to blocked page
    return <Navigate to="/blocked" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // User's role is not authorized, redirect to appropriate dashboard
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  // Authorized, render component
  return children;
};

export default ProtectedRoute; 