import axios from 'axios';
import { API_URL } from '../config';
import { getToken } from '../utils/storage';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

let onUnauthorized: (() => void) | null = null;

/** AuthContext registers this so a 401 clears the session and returns to Login. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // A 401 from /login just means wrong credentials, not an expired session.
    const isLogin = error?.config?.url === '/login';
    if (error?.response?.status === 401 && !isLogin) onUnauthorized?.();
    return Promise.reject(error);
  },
);
