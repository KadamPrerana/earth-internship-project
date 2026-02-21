/* ============================================================
   useAuth.js — Custom Hook for Authentication
   ============================================================
   Wraps the AuthContext for easy access in components.

   Returns:
     - user: { name, email } or null
     - isAuthenticated: boolean
     - loading: boolean
     - login(email, password): async
     - signup(name, email, password): async
     - logout(): void

   Usage:
     const { user, login, logout, isAuthenticated } = useAuth();
   ============================================================ */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';


export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return {
        user: context.user,
        isAuthenticated: context.isAuthenticated,
        loading: context.loading,
        login: context.loginUser,
        signup: context.signupUser,
        logout: context.logoutUser,
    };
}
