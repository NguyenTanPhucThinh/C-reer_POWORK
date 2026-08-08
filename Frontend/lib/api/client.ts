import axios, { AxiosError, AxiosResponse } from 'axios';
import type { ApiErrorBody, ApiSuccess } from '@/lib/types/api';

/**
 * Client cho resource nghiệp vụ đi qua BFF same-origin. BFF đọc cookie httpOnly
 * và gắn Bearer token khi gọi Backend; token không bao giờ lộ cho JavaScript.
 */
export const apiClient = axios.create({
  baseURL: '/api/backend',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Client cho auth, trỏ tới BFF same-origin (Next Route Handlers tại /api/auth).
 * Các route này set/clear cookie httpOnly và trả về user (không kèm token).
 */
export const authClient = axios.create({
  baseURL: '/api/auth',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export async function unwrap<T>(promise: Promise<AxiosResponse<ApiSuccess<T>>>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

export default apiClient;
