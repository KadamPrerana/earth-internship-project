import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiLogOut, FiUser, FiLayout, FiShield } from 'react-icons/fi';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) return null;

    const isAdmin = user.role === 'admin';
    const navLinks = isAdmin
        ? [
            { path: '/admin', label: 'Dashboard', icon: <FiLayout /> },
            { path: '/profile', label: 'Profile', icon: <FiUser /> },
        ]
        : [
            { path: '/dashboard', label: 'Dashboard', icon: <FiLayout /> },
            { path: '/profile', label: 'Profile', icon: <FiUser /> },
        ];

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <FiShield className="brand-icon" />
                <span>TaskManager</span>
                {isAdmin && <span className="role-badge admin-badge">ADMIN</span>}
            </div>

            <div className="nav-links">
                {navLinks.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>

            <div className="nav-user">
                <span className="user-greeting">Hi, {user.name}</span>
                <button onClick={handleLogout} className="btn-logout">
                    <FiLogOut />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
}
