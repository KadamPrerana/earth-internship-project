import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import Pagination from '../components/Pagination';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
    FiUsers, FiClipboard, FiShield, FiActivity, FiPlus, FiDownload,
    FiUserX, FiUserCheck, FiTrash2
} from 'react-icons/fi';

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e'];
const PRIORITY_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('analytics');
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Users state
    const [userPagination, setUserPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

    // Tasks state
    const [taskFilters, setTaskFilters] = useState({ status: '', priority: '', search: '', page: 1 });
    const [taskPagination, setTaskPagination] = useState({ total: 0, totalPages: 0 });
    const [showAssignTask, setShowAssignTask] = useState(false);
    const [newAssignment, setNewAssignment] = useState({ title: '', description: '', assigned_to: '', status: 'Pending', priority: 'Medium', start_date: '', due_date: '' });

    // User-not-found resolution state
    const [userNotFound, setUserNotFound] = useState(false);
    const [showCreateInline, setShowCreateInline] = useState(false);
    const [inlineNewUser, setInlineNewUser] = useState({ name: '', password: '', role: 'user' });
    const [existingUsersList, setExistingUsersList] = useState([]);
    const [creatingUser, setCreatingUser] = useState(false);

    // Logs state
    const [logPage, setLogPage] = useState(1);
    const [logPagination, setLogPagination] = useState({ total: 0, totalPages: 0 });

    // ── Fetch Functions ──
    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/analytics/');
            setAnalytics(res.data);
        } catch { setError('Failed to load analytics'); }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/users/?page=${userPagination.page}&per_page=15`);
            setUsers(res.data.users);
            setUserPagination(p => ({ ...p, total: res.data.total, totalPages: res.data.total_pages }));
        } catch { setError('Failed to load users'); }
        finally { setLoading(false); }
    }, [userPagination.page]);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (taskFilters.status) params.append('status', taskFilters.status);
            if (taskFilters.priority) params.append('priority', taskFilters.priority);
            if (taskFilters.search) params.append('search', taskFilters.search);
            params.append('page', taskFilters.page);
            params.append('per_page', 10);
            const res = await api.get(`/api/admin/tasks/?${params}`);
            setTasks(res.data.tasks);
            setTaskPagination({ total: res.data.total, totalPages: res.data.total_pages });
        } catch { setError('Failed to load tasks'); }
        finally { setLoading(false); }
    }, [taskFilters]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/activity-logs/?page=${logPage}&per_page=20`);
            setLogs(res.data.logs);
            setLogPagination({ total: res.data.total, totalPages: res.data.total_pages });
        } catch { setError('Failed to load logs'); }
        finally { setLoading(false); }
    }, [logPage]);

    useEffect(() => {
        if (activeTab === 'analytics') fetchAnalytics();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'tasks') fetchTasks();
        if (activeTab === 'logs') fetchLogs();
    }, [activeTab, fetchAnalytics, fetchUsers, fetchTasks, fetchLogs]);

    // ── Admin Actions ──
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/users/create/', newUser);
            setNewUser({ name: '', email: '', password: '', role: 'user' });
            setShowCreateUser(false);
            fetchUsers();
        } catch (err) { setError(err.response?.data?.error || 'Failed to create user'); }
    };

    const handleBlockUser = async (userId) => {
        try {
            await api.patch(`/api/admin/users/${userId}/block/`);
            fetchUsers();
        } catch (err) { setError(err.response?.data?.error || 'Failed to toggle block'); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Delete this user and all their tasks? This cannot be undone.')) return;
        try {
            await api.delete(`/api/admin/users/${userId}/delete/`);
            fetchUsers();
        } catch (err) { setError(err.response?.data?.error || 'Failed to delete user'); }
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        setUserNotFound(false);
        try {
            await api.post('/api/admin/tasks/assign/', newAssignment);
            setNewAssignment({ title: '', description: '', assigned_to: '', status: 'Pending', priority: 'Medium', start_date: '', due_date: '' });
            setShowAssignTask(false);
            setUserNotFound(false);
            setShowCreateInline(false);
            fetchTasks();
        } catch (err) {
            const errMsg = err.response?.data?.error || '';
            if (errMsg === 'Target user not found') {
                setUserNotFound(true);
                // Pre-fetch existing users for the select dropdown
                try {
                    const res = await api.get('/api/admin/users/?per_page=100');
                    setExistingUsersList(res.data.users || []);
                } catch { /* ignore */ }
            } else {
                setError(errMsg || 'Failed to assign task');
            }
        }
    };

    // Create user inline, then auto-assign the task
    const handleCreateAndAssign = async (e) => {
        e.preventDefault();
        setCreatingUser(true);
        try {
            await api.post('/api/admin/users/create/', {
                name: inlineNewUser.name,
                email: newAssignment.assigned_to,
                password: inlineNewUser.password,
                role: inlineNewUser.role
            });
            // Now assign the task
            await api.post('/api/admin/tasks/assign/', newAssignment);
            setNewAssignment({ title: '', description: '', assigned_to: '', status: 'Pending', priority: 'Medium', start_date: '', due_date: '' });
            setShowAssignTask(false);
            setUserNotFound(false);
            setShowCreateInline(false);
            setInlineNewUser({ name: '', password: '', role: 'user' });
            fetchTasks();
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
        } finally {
            setCreatingUser(false);
        }
    };

    // Select an existing user and reassign
    const handleSelectExistingUser = (email) => {
        setNewAssignment(prev => ({ ...prev, assigned_to: email }));
        setUserNotFound(false);
    };

    const handleUpdateTask = async (taskId, data) => {
        try {
            await api.put(`/api/admin/tasks/${taskId}/update/`, data);
            fetchTasks();
        } catch { setError('Failed to update task'); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/api/admin/tasks/${taskId}/delete/`);
            fetchTasks();
        } catch { setError('Failed to delete task'); }
    };

    const handleExportCSV = async () => {
        try {
            const res = await api.get('/api/admin/tasks/export/csv/', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'all_tasks.csv';
            a.click();
        } catch { setError('Failed to export'); }
    };

    const tabs = [
        { id: 'analytics', label: 'Analytics', icon: <FiActivity /> },
        { id: 'users', label: 'Users', icon: <FiUsers /> },
        { id: 'tasks', label: 'Tasks', icon: <FiClipboard /> },
        { id: 'logs', label: 'Activity Logs', icon: <FiShield /> },
    ];

    const formatTimestamp = (ts) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="dashboard admin-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p className="subtitle">System Overview & Management 🛡️</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error} <button onClick={() => setError('')}>×</button></div>}

            {/* Tabs */}
            <div className="tab-bar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Analytics Tab ── */}
            {activeTab === 'analytics' && analytics && (
                <div className="analytics-tab">
                    <div className="stats-grid">
                        <div className="stat-card glass-card">
                            <div className="stat-icon" style={{ color: '#8b5cf6', background: '#8b5cf620' }}><FiUsers size={24} /></div>
                            <div className="stat-info"><span className="stat-value">{analytics.total_users}</span><span className="stat-label">Total Users</span></div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon" style={{ color: '#3b82f6', background: '#3b82f620' }}><FiClipboard size={24} /></div>
                            <div className="stat-info"><span className="stat-value">{analytics.total_tasks}</span><span className="stat-label">Total Tasks</span></div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon" style={{ color: '#ef4444', background: '#ef444420' }}><FiUserX size={24} /></div>
                            <div className="stat-info"><span className="stat-value">{analytics.blocked_users}</span><span className="stat-label">Blocked Users</span></div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-card glass-card">
                            <h3>Tasks by Status</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={Object.entries(analytics.status_distribution).map(([name, value]) => ({ name, value }))}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={100}
                                        paddingAngle={5} dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {Object.keys(analytics.status_distribution).map((_, i) => (
                                            <Cell key={i} fill={COLORS[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card glass-card">
                            <h3>Tasks by Priority</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={Object.entries(analytics.priority_distribution).map(([name, value]) => ({ name, value }))}
                                >
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ background: '#1e1e3f', border: 'none', borderRadius: '8px' }} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {Object.keys(analytics.priority_distribution).map((_, i) => (
                                            <Cell key={i} fill={PRIORITY_COLORS[i]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {analytics.top_users && analytics.top_users.length > 0 && (
                        <div className="top-users glass-card">
                            <h3>Top Users by Tasks</h3>
                            <div className="top-users-list">
                                {analytics.top_users.map((u, i) => (
                                    <div key={i} className="top-user-item">
                                        <span className="rank">#{i + 1}</span>
                                        <span className="email">{u.email}</span>
                                        <span className="count">{u.tasks} tasks</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Users Tab ── */}
            {activeTab === 'users' && (
                <div className="users-tab">
                    <div className="tab-actions">
                        <button className="btn-primary" onClick={() => setShowCreateUser(!showCreateUser)}>
                            <FiPlus /> Create User
                        </button>
                    </div>

                    {showCreateUser && (
                        <div className="admin-form glass-card">
                            <h3>Create New User</h3>
                            <form onSubmit={handleCreateUser}>
                                <div className="form-row">
                                    <input placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                                    <input placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                                    <input placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                                    <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button type="submit" className="btn-primary">Create</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-state"><div className="spinner"></div></div>
                    ) : (
                        <div className="users-table-wrap glass-card">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} className={u.is_blocked ? 'blocked-row' : ''}>
                                            <td>{u.name}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`role-badge ${u.role}-badge`}>{u.role.toUpperCase()}</span></td>
                                            <td>
                                                <span className={`status-dot ${u.is_blocked ? 'blocked' : 'active'}`}>
                                                    {u.is_blocked ? '🔴 Blocked' : '🟢 Active'}
                                                </span>
                                            </td>
                                            <td>{formatTimestamp(u.created_at)}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button
                                                        className={`btn-icon ${u.is_blocked ? 'btn-unblock' : 'btn-block'}`}
                                                        onClick={() => handleBlockUser(u._id)}
                                                        title={u.is_blocked ? 'Unblock' : 'Block'}
                                                    >
                                                        {u.is_blocked ? <FiUserCheck /> : <FiUserX />}
                                                    </button>
                                                    <button className="btn-icon btn-delete" onClick={() => handleDeleteUser(u._id)} title="Delete">
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <Pagination page={userPagination.page} totalPages={userPagination.totalPages}
                        onPageChange={(p) => setUserPagination(prev => ({ ...prev, page: p }))} />
                </div>
            )}

            {/* ── Tasks Tab ── */}
            {activeTab === 'tasks' && (
                <div className="tasks-tab">
                    <div className="tab-actions">
                        <button className="btn-primary" onClick={() => setShowAssignTask(!showAssignTask)}>
                            <FiPlus /> Assign Task
                        </button>
                        <button className="btn-secondary" onClick={handleExportCSV}>
                            <FiDownload /> Export CSV
                        </button>
                    </div>

                    {showAssignTask && (
                        <div className="admin-form glass-card">
                            <h3>Assign Task to User</h3>
                            <form onSubmit={handleAssignTask}>
                                <input placeholder="Task title" value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} required />
                                <textarea placeholder="Description" value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} rows={2} />
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Assign To</label>
                                        <input placeholder="User email" value={newAssignment.assigned_to}
                                            onChange={(e) => { setNewAssignment({ ...newAssignment, assigned_to: e.target.value }); setUserNotFound(false); }} required />
                                    </div>
                                    <div className="form-field">
                                        <label>Status</label>
                                        <select value={newAssignment.status}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, status: e.target.value })}>
                                            <option value="Pending">⏳ Pending</option>
                                            <option value="In Progress">🔄 In Progress</option>
                                            <option value="Completed">✅ Completed</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Priority</label>
                                        <select value={newAssignment.priority}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, priority: e.target.value })}>
                                            <option value="Low">🟢 Low</option>
                                            <option value="Medium">🟡 Medium</option>
                                            <option value="High">🔴 High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Start Date</label>
                                        <input type="date" value={newAssignment.start_date}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, start_date: e.target.value })} />
                                    </div>
                                    <div className="form-field">
                                        <label>Due Date</label>
                                        <input type="date" value={newAssignment.due_date}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })} />
                                    </div>
                                    <div className="form-field form-actions-row">
                                        <label>&nbsp;</label>
                                        <button type="submit" className="btn-primary">Assign</button>
                                    </div>
                                </div>
                            </form>

                            {/* ── User Not Found Resolution ─────────── */}
                            {userNotFound && (
                                <div className="user-resolve-panel">
                                    <div className="resolve-header">
                                        <span className="resolve-icon">⚠️</span>
                                        <div>
                                            <strong>User "{newAssignment.assigned_to}" does not exist</strong>
                                            <p>Choose an option below to continue:</p>
                                        </div>
                                    </div>

                                    <div className="resolve-options">
                                        {/* Option 1: Create New User */}
                                        <div className="resolve-option">
                                            <button
                                                className={`resolve-btn ${showCreateInline ? 'active' : ''}`}
                                                onClick={() => setShowCreateInline(!showCreateInline)}
                                                type="button"
                                            >
                                                <FiPlus /> Create "{newAssignment.assigned_to}" as new user
                                            </button>

                                            {showCreateInline && (
                                                <form className="inline-create-form" onSubmit={handleCreateAndAssign}>
                                                    <div className="form-row">
                                                        <div className="form-field">
                                                            <label>Full Name</label>
                                                            <input
                                                                placeholder="Enter name"
                                                                value={inlineNewUser.name}
                                                                onChange={(e) => setInlineNewUser({ ...inlineNewUser, name: e.target.value })}
                                                                required
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="form-field">
                                                            <label>Password</label>
                                                            <input
                                                                type="password"
                                                                placeholder="Set password"
                                                                value={inlineNewUser.password}
                                                                onChange={(e) => setInlineNewUser({ ...inlineNewUser, password: e.target.value })}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-field">
                                                            <label>Role</label>
                                                            <select
                                                                value={inlineNewUser.role}
                                                                onChange={(e) => setInlineNewUser({ ...inlineNewUser, role: e.target.value })}
                                                            >
                                                                <option value="user">User</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-field form-actions-row">
                                                            <label>&nbsp;</label>
                                                            <button type="submit" className="btn-primary" disabled={creatingUser}>
                                                                {creatingUser ? 'Creating...' : '✨ Create & Assign'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}
                                        </div>

                                        {/* Divider */}
                                        <div className="resolve-divider">
                                            <span>OR</span>
                                        </div>

                                        {/* Option 2: Select Existing User */}
                                        <div className="resolve-option">
                                            <p className="resolve-label">Assign to an existing user instead:</p>
                                            <div className="existing-users-grid">
                                                {existingUsersList.filter(u => u.role !== 'admin' || true).map(u => (
                                                    <button
                                                        key={u._id}
                                                        className="existing-user-btn"
                                                        onClick={() => handleSelectExistingUser(u.email)}
                                                        type="button"
                                                    >
                                                        <span className="eu-avatar">{u.name.charAt(0).toUpperCase()}</span>
                                                        <span className="eu-info">
                                                            <strong>{u.name}</strong>
                                                            <small>{u.email}</small>
                                                        </span>
                                                        <span className={`role-badge ${u.role}-badge`}>{u.role.toUpperCase()}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <TaskFilters filters={taskFilters} setFilters={setTaskFilters} />

                    {loading ? (
                        <div className="loading-state"><div className="spinner"></div></div>
                    ) : tasks.length === 0 ? (
                        <div className="empty-state glass-card">
                            <FiClipboard size={48} />
                            <h3>No tasks found</h3>
                        </div>
                    ) : (
                        <div className="task-list">
                            {tasks.map(task => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    isAdmin={true}
                                    onUpdate={handleUpdateTask}
                                    onDelete={handleDeleteTask}
                                />
                            ))}
                        </div>
                    )}
                    <Pagination page={taskFilters.page} totalPages={taskPagination.totalPages}
                        onPageChange={(p) => setTaskFilters({ ...taskFilters, page: p })} />
                </div>
            )}

            {/* ── Activity Logs Tab ── */}
            {activeTab === 'logs' && (
                <div className="logs-tab">
                    {loading ? (
                        <div className="loading-state"><div className="spinner"></div></div>
                    ) : (
                        <div className="logs-list glass-card">
                            <table className="logs-table">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log._id}>
                                            <td className="log-time">{formatTimestamp(log.timestamp)}</td>
                                            <td>{log.user_email}</td>
                                            <td><span className="log-action">{log.action.replace(/_/g, ' ')}</span></td>
                                            <td className="log-details">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <Pagination page={logPage} totalPages={logPagination.totalPages}
                        onPageChange={setLogPage} />
                </div>
            )}
        </div>
    );
}
