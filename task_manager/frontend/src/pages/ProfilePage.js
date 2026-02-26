import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { FiUser, FiMail, FiLock, FiSave, FiCalendar } from 'react-icons/fi';

export default function ProfilePage() {
    const { user, login } = useAuth();
    const [name, setName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) setName(user.name);
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword && newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const data = {};
            if (name !== user.name) data.name = name;
            if (newPassword) data.password = newPassword;

            if (Object.keys(data).length === 0) {
                setError('No changes to save');
                setLoading(false);
                return;
            }

            const res = await api.put('/api/auth/profile/update/', data);
            // Update local user data
            login(localStorage.getItem('token'), res.data.user);
            setMessage('Profile updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>My Profile</h1>
                    <p className="subtitle">Manage your account settings</p>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-card glass-card">
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <h2>{user?.name}</h2>
                        <span className={`role-badge ${user?.role}-badge`}>{user?.role?.toUpperCase()}</span>
                    </div>

                    <div className="profile-info">
                        <div className="info-row">
                            <FiMail /> <span>{user?.email}</span>
                        </div>
                        <div className="info-row">
                            <FiCalendar /> <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—'}</span>
                        </div>
                    </div>
                </div>

                <div className="profile-edit glass-card">
                    <h3>Edit Profile</h3>

                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                placeholder="Full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <FiMail className="input-icon" />
                            <input type="email" value={user?.email || ''} disabled className="disabled-input" />
                        </div>

                        <hr className="divider" />
                        <h4>Change Password</h4>

                        <div className="input-group">
                            <FiLock className="input-icon" />
                            <input
                                type="password"
                                placeholder="New password (leave blank to keep current)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <FiLock className="input-icon" />
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn-primary btn-full" disabled={loading}>
                            {loading ? 'Saving...' : <><FiSave /> Save Changes</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
