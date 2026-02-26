import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import Pagination from '../components/Pagination';
import { FiPlus, FiDownload, FiCheckCircle, FiClock, FiAlertCircle, FiList } from 'react-icons/fi';

export default function UserDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', start_date: '', due_date: '' });
    const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [error, setError] = useState('');

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.search) params.append('search', filters.search);
            params.append('page', filters.page);
            params.append('per_page', 10);

            const res = await api.get(`/api/tasks/list/?${params}`);
            setTasks(res.data.tasks);
            setPagination({ total: res.data.total, totalPages: res.data.total_pages });
        } catch (err) {
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;

        const today = new Date().toISOString().split('T')[0];
        if (newTask.start_date && newTask.start_date < today) {
            setError('Start date cannot be in the past');
            return;
        }
        if (newTask.due_date && newTask.due_date < (newTask.start_date || today)) {
            setError('Due date must be after start date');
            return;
        }

        try {
            await api.post('/api/tasks/', newTask);
            setNewTask({ title: '', description: '', priority: 'Medium', start_date: '', due_date: '' });
            setShowAddForm(false);
            fetchTasks();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create task');
        }
    };

    const handleUpdateTask = async (taskId, data) => {
        try {
            await api.put(`/api/tasks/${taskId}/update/`, data);
            fetchTasks();
        } catch (err) {
            setError('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/api/tasks/${taskId}/delete/`);
            fetchTasks();
        } catch (err) {
            setError('Failed to delete task');
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await api.patch(`/api/tasks/${taskId}/complete/`);
            fetchTasks();
        } catch (err) {
            setError('Failed to complete task');
        }
    };

    const handleExportCSV = async () => {
        try {
            const res = await api.get('/api/tasks/export/csv/', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my_tasks.csv';
            a.click();
        } catch (err) {
            setError('Failed to export CSV');
        }
    };

    // Stats
    const stats = [
        { label: 'Total', value: pagination.total, icon: <FiList />, color: '#8b5cf6' },
        { label: 'Pending', value: tasks.filter(t => t.status === 'Pending').length, icon: <FiClock />, color: '#f59e0b' },
        { label: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, icon: <FiAlertCircle />, color: '#3b82f6' },
        { label: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, icon: <FiCheckCircle />, color: '#22c55e' },
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>My Tasks</h1>
                    <p className="subtitle">Welcome back, {user?.name}! 👋</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={handleExportCSV}>
                        <FiDownload /> Export CSV
                    </button>
                    <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        <FiPlus /> New Task
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.map(stat => (
                    <div key={stat.label} className="stat-card glass-card">
                        <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}20` }}>
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {error && <div className="alert alert-error">{error} <button onClick={() => setError('')}>×</button></div>}

            {/* Add Task Form */}
            {showAddForm && (
                <div className="add-task-form glass-card">
                    <h3>Create New Task</h3>
                    <form onSubmit={handleCreateTask}>
                        <input
                            type="text"
                            placeholder="Task title..."
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            required
                            autoFocus
                        />
                        <textarea
                            placeholder="Description (optional)"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            rows={2}
                        />
                        <div className="form-row">
                            <div className="form-field">
                                <label>Priority</label>
                                <select value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                                    <option value="Low">🟢 Low</option>
                                    <option value="Medium">🟡 Medium</option>
                                    <option value="High">🔴 High</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Start Date</label>
                                <input type="date" value={newTask.start_date} min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })} />
                            </div>
                            <div className="form-field">
                                <label>Due Date</label>
                                <input type="date" value={newTask.due_date} min={newTask.start_date || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                            </div>
                            <div className="form-field form-actions-row">
                                <label>&nbsp;</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="submit" className="btn-primary">Create</button>
                                    <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                        <p className="form-hint">⏳ Status will be <strong>Pending</strong> by default</p>
                    </form>
                </div>
            )}

            {/* Filters */}
            <TaskFilters filters={filters} setFilters={setFilters} />

            {/* Task List */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading tasks...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="empty-state glass-card">
                    <FiCheckCircle size={48} />
                    <h3>No tasks found</h3>
                    <p>Create your first task or adjust your filters</p>
                    <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                        <FiPlus /> Create Task
                    </button>
                </div>
            ) : (
                <div className="task-list">
                    {tasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onUpdate={handleUpdateTask}
                            onDelete={handleDeleteTask}
                            onComplete={handleCompleteTask}
                        />
                    ))}
                </div>
            )}

            <Pagination
                page={filters.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setFilters({ ...filters, page: p })}
            />
        </div>
    );
}
