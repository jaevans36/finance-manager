import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * IMPORTANT: All services MUST use this apiClient instead of importing axios directly.
 * 
 * This client provides:
 * - Automatic authentication (Bearer token in headers)
 * - Centralized error handling
 * - Request/response logging
 * - Token refresh logic
 * 
 * See services/README.md for usage examples.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiErrorResponse {
  message?: string;
  error?: string | { message?: string };
  title?: string;
  errors?: Record<string, string | string[]>;
}

const extractApiErrorForLogging = (apiError: unknown): string => {
  // Extract technical error message from API for logging purposes
  if (typeof apiError === 'string') {
    return apiError;
  }

  if (typeof apiError === 'object' && apiError !== null) {
    const errorObj = apiError as ApiErrorResponse;

    // Handle nested error object: {error: {message: "..."}}
    if (errorObj.error && typeof errorObj.error === 'object' && 'message' in errorObj.error) {
      return errorObj.error.message || 'Unknown error';
    }

    // Handle direct message fields
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }

    if (typeof errorObj.error === 'string') {
      return errorObj.error;
    }

    if (typeof errorObj.title === 'string') {
      return errorObj.title;
    }

    // Handle validation errors object
    if (errorObj.errors && typeof errorObj.errors === 'object') {
      const firstError = Object.values(errorObj.errors)[0];
      return Array.isArray(firstError) ? firstError[0] : String(firstError);
    }
  }

  return 'Unknown error';
};

const getUserFriendlyErrorMessage = (status?: number): string => {
  // Frontend-controlled user-facing messages
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Invalid email or password. Please try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This resource already exists.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Log outgoing requests in development
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
        hasAuth: !!token,
      });
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status;
      const apiErrorMessage = extractApiErrorForLogging(error.response?.data);
      
      // Log technical details for debugging (backend message preserved)
      console.error('API Error:', {
        message: error.message,
        status: status,
        statusText: error.response?.statusText,
        apiError: apiErrorMessage, // Technical message from backend
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';

      if (status === 401) {
        // Clear tokens and redirect to login only if not already on login/register pages
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        if (!isAuthPage) {
          window.location.href = '/login';
        } else {
          // On auth pages, show user-friendly message (frontend-controlled)
          const userMessage = getUserFriendlyErrorMessage(401);
          return Promise.reject(new Error(userMessage));
        }
      }

      // Return user-friendly error message (frontend-controlled)
      const userMessage = getUserFriendlyErrorMessage(status);
      return Promise.reject(new Error(userMessage));
    }
  );

  return client;
};

export const apiClient = createApiClient();

/**
 * Helper to create full URL for endpoints that don't use /api/v1 prefix
 * (e.g., /api/admin/*, /api/version/*)
 */
export const getFullApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};
