import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className="main-content">
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={
                        user
                            ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
                            : <LoginPage />
                    } />
                    <Route path="/register" element={
                        user
                            ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
                            : <RegisterPage />
                    } />

                    {/* User routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute requiredRole="user">
                            <UserDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Admin routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Shared routes */}
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
