import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api';

export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('p2p_asset_auth');
      // Use app base path so redirect works when app is under e.g. /aiml/p2p_assetapp/
      const base = import.meta.env.BASE_URL || '/';
      window.location.href = base;
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'Request failed';
    return Promise.reject(new Error(message));
  }
);
