/* ============================================================
   authService.js — Authentication API Service
   ============================================================
   Handles all authentication-related API calls:
     - login(email, password)
     - signup(name, email, password)
     - refreshToken()
     - logout()
     - getStoredUser()
     - getStoredTokens()

   Stores tokens and user data in localStorage.
   ============================================================ */

import api from './api';

/* Storage keys */
const KEYS = {
    ACCESS: 'access_token',
    REFRESH: 'refresh_token',
    USER: 'user',
};


/**
 * Login a user with email and password.
 * Stores tokens and user data in localStorage on success.
 *
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {object} { user, access, refresh }
 */
export const login = async (email, password) => {
    const res = await api.post('/users/login/', { email, password });

    // Store tokens and user in localStorage
    localStorage.setItem(KEYS.ACCESS, res.data.access);
    localStorage.setItem(KEYS.REFRESH, res.data.refresh);
    localStorage.setItem(KEYS.USER, JSON.stringify(res.data.user));

    return res.data;
};


/**
 * Sign up a new user, then auto-login.
 *
 * @param {string} name - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {object} { user, access, refresh }
 */
export const signup = async (name, email, password) => {
    // Step 1: Create the user
    await api.post('/users/create/', { name, email, password });

    // Step 2: Auto-login to get tokens
    const loginRes = await login(email, password);

    return loginRes;
};


/**
 * Refresh the access token using the stored refresh token.
 *
 * @returns {object} { access, refresh }
 */
export const refreshToken = async () => {
    const refresh = localStorage.getItem(KEYS.REFRESH);
    if (!refresh) throw new Error('No refresh token available');

    const res = await api.post('/users/token/refresh/', { refresh });

    localStorage.setItem(KEYS.ACCESS, res.data.access);
    localStorage.setItem(KEYS.REFRESH, res.data.refresh);

    return res.data;
};


/**
 * Logout — clear all stored auth data.
 */
export const logout = () => {
    localStorage.removeItem(KEYS.ACCESS);
    localStorage.removeItem(KEYS.REFRESH);
    localStorage.removeItem(KEYS.USER);
};


/**
 * Get the currently stored user from localStorage.
 *
 * @returns {object|null} User object or null
 */
export const getStoredUser = () => {
    const userStr = localStorage.getItem(KEYS.USER);
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};


/**
 * Get stored tokens.
 *
 * @returns {object} { access, refresh }
 */
export const getStoredTokens = () => ({
    access: localStorage.getItem(KEYS.ACCESS),
    refresh: localStorage.getItem(KEYS.REFRESH),
});
