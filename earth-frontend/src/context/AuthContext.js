/* ============================================================
   AuthContext.js — Global Authentication State (React Context)
   ============================================================
   Provides authentication state to the entire app using
   React Context API. Persists auth state to localStorage
   so users stay logged in on page refresh.

   Provides:
     - user: { name, email } or null
     - isAuthenticated: boolean
     - loading: boolean (true while checking stored auth)
     - loginUser(email, password): async
     - signupUser(name, email, password): async
     - logoutUser(): void

   Usage:
     // In App.js:
     import { AuthProvider } from './context/AuthContext';
     <AuthProvider> <App /> </AuthProvider>

     // In any component:
     import { useAuth } from '../hooks/useAuth';
     const { user, loginUser, logoutUser } = useAuth();
   ============================================================ */

import { createContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

/* Create the context */
export const AuthContext = createContext(null);

/* ---- AuthProvider Component ---- */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);    // Check stored auth on mount

    /* ---- Check for existing auth on mount ---- */
    useEffect(() => {
        const storedUser = authService.getStoredUser();
        const tokens = authService.getStoredTokens();

        if (storedUser && tokens.access) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    /* ---- Login ---- */
    const loginUser = async (email, password) => {
        const data = await authService.login(email, password);
        setUser(data.user);
        return data;
    };

    /* ---- Sign Up ---- */
    const signupUser = async (name, email, password) => {
        const data = await authService.signup(name, email, password);
        setUser(data.user);
        return data;
    };

    /* ---- Logout ---- */
    const logoutUser = () => {
        authService.logout();
        setUser(null);
    };

    /* ---- Context Value ---- */
    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        loginUser,
        signupUser,
        logoutUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
