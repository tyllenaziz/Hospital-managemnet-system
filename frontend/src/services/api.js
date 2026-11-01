import { API_BASE_URL } from '../config/appConfig';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/users/login`,
  
  // Patients
  PATIENTS: `${API_BASE_URL}/patients`,
  REGISTER_PATIENT: `${API_BASE_URL}/patients/register`,
  SEARCH_PATIENTS: `${API_BASE_URL}/patients/search`,
  PATIENT_BY_ID: (id) => `${API_BASE_URL}/patients/${id}`, // Add this
  
  // Queue
  QUEUE: `${API_BASE_URL}/queue`,
  QUEUE_BY_DEPT: (dept) => `${API_BASE_URL}/queue/${dept}`,
  
  // Dashboard Stats
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard/reception`,
};

// Helper function for API calls
export const apiCall = async (url, options = {}, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};
