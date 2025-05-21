import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
// import RegisterPage from "./pages/auth/RegisterPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import UserDashboard from "./pages/user/UserDashboard";
import BlockedUser from './pages/BlockedUser';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      {/* Root Route - Always redirect to login if not authenticated */}
      <Route 
        path="/" 
        element={<Navigate to="/login" replace />}
      />

      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          !user ? (
            <LoginPage />
          ) : user.role === 'admin' ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } 
      />
      
      {/* Registration route commented out
      <Route path="/register" element={<RegisterPage />} />
      */}
      
      <Route path="/blocked" element={<BlockedUser />} />

      {/* Protected User Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
