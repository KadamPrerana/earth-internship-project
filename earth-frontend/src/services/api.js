/* ============================================================
   api.js — Centralized Axios Instance with JWT Interceptors
   ============================================================
   This module creates a pre-configured Axios instance that:
     1. Adds the base URL for all API requests
     2. Automatically attaches JWT access tokens to requests
     3. Auto-refreshes expired tokens using the refresh token
     4. Handles 401 errors (logs out user if refresh fails)

   Usage:
     import api from '../services/api';
     const res = await api.get('/users/tasks/list/email@example.com/');
   ============================================================ */

import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : 'http://localhost:8000/api';

/* Create Axios instance with base URL */
const api = axios.create({
    baseURL: baseURL,
});

/* ---- Request Interceptor ----
   Automatically attach the JWT access token to every request.
   Token is read from localStorage.
*/
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/* ---- Response Interceptor ----
   If a request fails with 401 (token expired):
     1. Try to refresh the token using the refresh token
     2. Retry the original request with the new token
     3. If refresh fails, clear tokens and redirect to login
*/
let isRefreshing = false;
let failedQueue = [];

/* Process queued requests after token refresh */
const processQueue = (error, token = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,       // Success — pass through
    async (error) => {
        const originalRequest = error.config;

        // Only handle 401 errors (not login/refresh endpoints)
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/login') &&
            !originalRequest.url.includes('/token/refresh')
        ) {
            if (isRefreshing) {
                // Another refresh is in progress — queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                // No refresh token — force logout
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/';
                return Promise.reject(error);
            }

            try {
                // Request new tokens using the refresh token
                const res = await axios.post(
                    `${baseURL}/users/token/refresh/`,
                    { refresh: refreshToken }
                );

                const { access, refresh } = res.data;
                localStorage.setItem('access_token', access);
                localStorage.setItem('refresh_token', refresh);

                // Update the failed request and retry
                originalRequest.headers.Authorization = `Bearer ${access}`;
                processQueue(null, access);

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed — force logout
                processQueue(refreshError, null);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
