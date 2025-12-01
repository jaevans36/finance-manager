import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiErrorResponse {
  message?: string;
  error?: string;
  title?: string;
  errors?: Record<string, string | string[]>;
}

const getDefaultErrorMessage = (status?: number): string => {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Invalid email or password.';
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
      // Log detailed error information
      console.error('API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';

      if (error.response?.status === 401) {
        // Clear tokens and redirect to login only if not already on login/register pages
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        if (!isAuthPage) {
          window.location.href = '/login';
        } else {
          // On auth pages, provide user-friendly error message
          const errorMessage = error.response?.data?.message || 
                              error.response?.data?.error ||
                              'Invalid email or password';
          const friendlyError = new Error(errorMessage);
          return Promise.reject(friendlyError);
        }
      }

      // Extract user-friendly error message from API response
      if (error.response?.data) {
        const apiError = error.response.data;
        let errorMessage: string;

        // Handle different API error response formats
        if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError.message && typeof apiError.message === 'string') {
          errorMessage = apiError.message;
        } else if (apiError.error && typeof apiError.error === 'string') {
          errorMessage = apiError.error;
        } else if (apiError.title && typeof apiError.title === 'string') {
          errorMessage = apiError.title;
        } else if (apiError.errors && typeof apiError.errors === 'object') {
          // Handle validation errors object
          const firstError = Object.values(apiError.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        } else {
          errorMessage = getDefaultErrorMessage(error.response.status);
        }

        const friendlyError = new Error(errorMessage);
        return Promise.reject(friendlyError);
      }

      // Fallback to default error message
      const defaultError = new Error(getDefaultErrorMessage(error.response?.status));
      return Promise.reject(defaultError);
    }
  );

  return client;
};

export const apiClient = createApiClient();
