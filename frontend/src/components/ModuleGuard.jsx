import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ModuleGuard - Route protection component for module-based access control
 * 
 * Checks if the required module is enabled for the user's hospital.
 * If disabled, redirects to the user's dashboard.
 * 
 * Usage:
 *   <Route path="/admin/ambulances" element={
 *     <ModuleGuard moduleCode="ambulance">
 *       <AmbulanceFleet />
 *     </ModuleGuard>
 *   } />
 */
const ModuleGuard = ({ moduleCode, children }) => {
    const { hasModule, getDashboardRoute, isAuthenticated } = useAuth();

    // If not authenticated, let ProtectedRoute handle the redirect
    if (!isAuthenticated) {
        return children;
    }

    // Check if module is enabled
    if (!hasModule(moduleCode)) {
        return <Navigate to={getDashboardRoute()} replace />;
    }

    return children;
};

export default ModuleGuard;
