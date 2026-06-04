import axios from 'axios';

const baseURL = import.meta.env.VITE_FINANCE_API_URL ?? 'http://localhost:5002';

const financeApiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT token from localStorage on every request
financeApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default financeApiClient;
