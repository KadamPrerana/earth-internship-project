/* ============================================================
   App.js — Main Application Component with Routing
   ============================================================
   Uses AuthContext for global auth state management.
   Routes:
     /       → LoginPage (login or sign up)
     /tasks  → Task Manager (Header + Greeting + TaskList)
   ============================================================ */

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Greeting from './components/Greeting';
import TaskList from './components/TaskList';
import LoginPage from './components/LoginPage';
import './App.css';

/* ============================================================
   TaskManagerPage — The main app page shown after login
   ============================================================ */
function TaskManagerPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* Handle logout: clear auth state and redirect to login */
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* Header with app title and logout button */}
        <Header onLogout={handleLogout} />

        {/* Personalized greeting showing user's name */}
        <Greeting userName={user?.name} />

        {/* Task list — fetches and manages tasks for this user */}
        <TaskList userEmail={user?.email} />
      </div>
    </div>
  );
}

/* ============================================================
   AppRoutes — Routes wrapped with AuthContext
   ============================================================ */
function AppRoutes() {
  const { user, loading } = useAuth();

  /* Show nothing while checking stored auth */
  if (loading) return null;

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/"
        element={
          user
            ? <Navigate to="/tasks" />
            : <LoginPage />
        }
      />

      {/* Tasks Route */}
      <Route
        path="/tasks"
        element={
          user
            ? <TaskManagerPage />
            : <Navigate to="/" />
        }
      />
    </Routes>
  );
}

/* ============================================================
   App — Root Component
   ============================================================ */
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
