import axios from 'axios';
import { ApiResponse } from '../types';
import { clearStoredAuth, getStoredToken } from '../store/auth-storage';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export const unwrapResponse = <T>(payload: ApiResponse<T>): T => {
  if (payload.code !== 0) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
};
