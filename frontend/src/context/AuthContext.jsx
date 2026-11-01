import { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../config/appConfig';
import {
  clearStoredHospitalContext,
  getStoredHospitalContext,
  getTenantAwareLoginPath,
  resolveHospitalCode,
  setStoredHospitalContext,
} from '../utils/tenantContext';

export { API_BASE_URL };

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/users/login`,
  LOGOUT: `${API_BASE_URL}/users/logout`,
  PROFILE: `${API_BASE_URL}/users/profile`,
  REFRESH_TOKEN: `${API_BASE_URL}/users/refresh-token`,

  // Admin endpoints
  ADMIN_DASHBOARD_STATS: `${API_BASE_URL}/admin/dashboard/stats`,
  ADMIN_REVENUE_STATS: `${API_BASE_URL}/admin/revenue/stats`,
  ADMIN_PATIENT_STATS: `${API_BASE_URL}/admin/patients/stats`,
  ADMIN_DEPARTMENT_STATS: `${API_BASE_URL}/admin/department/stats`,
  ADMIN_INVENTORY_STATS: `${API_BASE_URL}/admin/inventory/stats`,

  // Attendance endpoints
  ATTENDANCE_RECORDS: `${API_BASE_URL}/attendance/records`,
  ATTENDANCE_PRESENT: `${API_BASE_URL}/attendance/present`,
  ATTENDANCE_ABSENT: `${API_BASE_URL}/attendance/absent`,
  ATTENDANCE_LATE: `${API_BASE_URL}/attendance/late`,
  SEND_REMINDER: `${API_BASE_URL}/attendance/send-reminder`,

  // Staff endpoints
  STAFF: `${API_BASE_URL}/users`,
  STAFF_STATS: `${API_BASE_URL}/admin/staff/stats`,
  ADD_STAFF: `${API_BASE_URL}/users/register`,
  GET_STAFF: `${API_BASE_URL}/users/`,

  // Patient endpoints
  PATIENTS: `${API_BASE_URL}/patients`,
  PATIENT_REGISTER: `${API_BASE_URL}/patients/register`,
  PATIENT_BY_ID: (id) => `${API_BASE_URL}/patients/${id}`,

  // Queue endpoints
  QUEUE: `${API_BASE_URL}/queue`,
  QUEUE_TODAY: `${API_BASE_URL}/queue/today`,
  QUEUE_STATUS: `${API_BASE_URL}/queue/status`,
  QUEUE_BY_ID: (id) => `${API_BASE_URL}/queue/${id}`,

  // Inventory endpoints
  INVENTORY: {
    // Medicines
    MEDICINES: `${API_BASE_URL}/medicines`,
    MEDICINE_BY_ID: (id) => `${API_BASE_URL}/medicines/${id}`,
    MEDICINE_BY_BARCODE: (barcode) => `${API_BASE_URL}/medicines/barcode/${barcode}`,
    ADD_MEDICINE: `${API_BASE_URL}/medicines/add`,
    UPDATE_MEDICINE: (id) => `${API_BASE_URL}/medicines/update/${id}`,
    DELETE_MEDICINE: (id) => `${API_BASE_URL}/medicines/delete/${id}`,
    UPDATE_STOCK: (id) => `${API_BASE_URL}/medicines/stock/${id}`,
    MEDICINE_SEARCH: `${API_BASE_URL}/medicines/search`,
    MEDICINE_LOW_STOCK: `${API_BASE_URL}/medicines/low-stock`,
    MEDICINE_EXPIRING: `${API_BASE_URL}/medicines/expiring-soon`,

    // Equipment
    EQUIPMENT: `${API_BASE_URL}/equipment`,
    EQUIPMENT_BY_ID: (id) => `${API_BASE_URL}/equipment/${id}`,
    ADD_EQUIPMENT: `${API_BASE_URL}/equipment/add`,
    UPDATE_EQUIPMENT: (id) => `${API_BASE_URL}/equipment/update/${id}`,
    DELETE_EQUIPMENT: (id) => `${API_BASE_URL}/equipment/delete/${id}`,

    // Inventory Dashboard
    INVENTORY_STATS: `${API_BASE_URL}/inventory/stats`,
    INVENTORY_ALERTS: `${API_BASE_URL}/inventory/alerts`,
    INVENTORY_CATEGORIES: `${API_BASE_URL}/inventory/categories`,
    INVENTORY_ACTIVITY: `${API_BASE_URL}/inventory/activity`,
  },

  // Bill endpoints
  BILLS: `${API_BASE_URL}/bills`,
  BILLS_PENDING: `${API_BASE_URL}/bills/pending`,
  BILLS_PATIENT: (patientId) => `${API_BASE_URL}/bills/patient/${patientId}`,
  BILLS_PAYMENT: (billId) => `${API_BASE_URL}/bills/${billId}/payment`,

  // Report endpoints
  REPORTS: `${API_BASE_URL}/reports`,
  REPORTS_GENERATE: `${API_BASE_URL}/reports/generate`,

  // Ambulance endpoints
  AMBULANCE: {
    // Ambulances
    AMBULANCES: `${API_BASE_URL}/ambulances`,
    AMBULANCE_BY_ID: (id) => `${API_BASE_URL}/ambulances/${id}`,
    AMBULANCE_AVAILABLE: `${API_BASE_URL}/ambulances/available`,
    UPDATE_AMBULANCE_STATUS: (id) => `${API_BASE_URL}/ambulances/${id}/status`,

    // Ambulance Requests
    AMBULANCE_REQUESTS: `${API_BASE_URL}/ambulance-requests`,
    REQUEST_BY_ID: (id) => `${API_BASE_URL}/ambulance-requests/${id}`,
    PENDING_REQUESTS: `${API_BASE_URL}/ambulance-requests/pending`,
    APPROVE_REQUEST: (id) => `${API_BASE_URL}/ambulance-requests/${id}/approve`,
    ASSIGN_AMBULANCE: (id) => `${API_BASE_URL}/ambulance-requests/${id}/assign`,
    UPDATE_REQUEST_STATUS: (id) => `${API_BASE_URL}/ambulance-requests/${id}/status`,
    PRINT_REQUEST: (id) => `${API_BASE_URL}/ambulance-requests/${id}/print`,
    CREATE_INCOMING_REQUEST: `${API_BASE_URL}/ambulance-requests/incoming`,

    // History
    AMBULANCE_HISTORY: `${API_BASE_URL}/ambulance-requests/history`,
    PATIENT_AMBULANCE_HISTORY: (patientId) => `${API_BASE_URL}/ambulance-requests/patient/${patientId}`,
  }
};

export const AuthContext = createContext(null);

const buildRequestHeaders = (options = {}) => {
  const headers = { ...(options.headers || {}) };
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = window.localStorage?.getItem('bensmma_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return window.localStorage?.getItem('bensmma_token') || null;
  });

  const [modules, setModules] = useState(() => {
    const stored = window.localStorage?.getItem('bensmma_modules');
    return stored ? JSON.parse(stored) : [];
  });

  // Function to refresh access token using refresh token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = window.localStorage?.getItem('bensmma_refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        window.localStorage?.setItem('bensmma_token', data.token);
        setToken(data.token);
        return data.token;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const authenticatedFetch = async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = buildRequestHeaders(options);

    let response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`
      },
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      try {
        const responseData = await response.json();

        if (responseData.tokenExpired) {
          try {
            const newToken = await refreshAccessToken();

            // Retry the original request with new token
            response = await fetch(url, {
              ...options,
              headers: {
                ...headers,
                Authorization: `Bearer ${newToken}`
              },
            });
          } catch (error) {
            logout();
            throw new Error('Session expired. Please login again.');
          }
        } else {
          logout();
          throw new Error('Session expired. Please login again.');
        }
      } catch (parseError) {
        logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  };

  // Update login to store refresh token
  const login = async (username, password, options = {}) => {
    try {
      const hospitalCode = resolveHospitalCode(options.hospitalCode);

      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          hospital_code: hospitalCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        window.localStorage?.setItem('bensmma_token', data.token);
        window.localStorage?.setItem('bensmma_refresh_token', data.refreshToken);
        setToken(data.token);

        // Store enabled modules
        const enabledModules = data.modules || [];
        window.localStorage?.setItem('bensmma_modules', JSON.stringify(enabledModules));
        setModules(enabledModules);

        const userWithLogin = {
          ...data.user,
          lastLogin: new Date().toISOString()
        };

        const preferredHospitalContext =
          userWithLogin.hospital_slug || userWithLogin.hospital_code;

        if (preferredHospitalContext) {
          setStoredHospitalContext(preferredHospitalContext);
        } else if (!hospitalCode) {
          clearStoredHospitalContext();
        }

        window.localStorage?.setItem('bensmma_user', JSON.stringify(userWithLogin));
        setUser(userWithLogin);

        return { success: true, user: userWithLogin, token: data.token };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Connection error. Please check your network and try again.'
      };
    }
  };

  // Update logout to clear refresh token
  const logout = async () => {
    const redirectUrl = getTenantAwareLoginPath(
      user?.hospital_slug || user?.hospital_code || getStoredHospitalContext()
    );

    try {
      if (token) {
        await fetch(API_ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      window.localStorage?.removeItem('bensmma_user');
      window.localStorage?.removeItem('bensmma_token');
      window.localStorage?.removeItem('bensmma_refresh_token');
      window.localStorage?.removeItem('bensmma_modules');
      clearStoredHospitalContext();
      setModules([]);

      window.location.href = redirectUrl;
    }
  };

  const isAdmin = () => user?.role === 'admin';
  const isDoctor = () => user?.role === 'doctor';
  const isReceptionist = () => user?.role === 'receptionist' || user?.role === 'reception';
  const isPharmacy = () => user?.role === 'pharmacy';
  const isLab = () => user?.role === 'lab';
  const isBilling = () => user?.role === 'billing';

  // Get user's dashboard route based on role
  const getDashboardRoute = () => {
    switch (user?.role) {
      case 'superadmin': return '/superadmin/dashboard';
      case 'admin': return '/admin/dashboard';
      case 'supervisor': return '/admin/dashboard';
      case 'doctor': return '/doctor/dashboard';
      case 'nurse': return '/nurse/dashboard';
      case 'receptionist':
      case 'reception': return '/receptionist/dashboard';
      case 'pharmacy': return '/pharmacy/dashboard';
      case 'lab': return '/lab/dashboard';
      case 'radiologist': return '/radiologist/dashboard';
      default: return '/login';
    }
  };

  // Check if user has permission for a specific feature
  const hasPermission = (requiredRole) => {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'admin') return true;

    // Check specific role
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }

    return user.role === requiredRole;
  };

  // Check if a module is enabled for the current hospital
  const hasModule = (moduleCode) => {
    if (!modules || modules.length === 0) return true; // If no modules loaded, allow access
    return modules.includes(moduleCode);
  };

  // Auto-logout on token expiration check
  useEffect(() => {
    const checkTokenExpiration = () => {
      if (token) {
        try {
          // Decode JWT token to check expiration
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
          if (Date.now() >= expirationTime) {
            logout();
          }
        } catch (error) {
          console.error('Error checking token expiration:', error);
          // If token is invalid, logout user
          logout();
        }
      }
    };

    // Check token expiration every minute
    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const value = {
    user,
    token,
    login,
    logout,
    authenticatedFetch,
    isAdmin,
    isDoctor,
    isReceptionist,
    isPharmacy,
    isLab,
    isBilling,
    isAuthenticated: !!user && !!token,
    getDashboardRoute,
    hasPermission,
    hasModule,
    modules,
    API_BASE_URL,
    API_ENDPOINTS,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthProvider;
