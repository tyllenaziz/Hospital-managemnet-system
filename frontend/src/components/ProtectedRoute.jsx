import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTenantAwareLoginPath } from '../utils/tenantContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={getTenantAwareLoginPath()} replace />;
  }

  if (requiredRole) {
    // Handle both string and array of roles
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={`/${user.role}/dashboard`} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
