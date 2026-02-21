/* ============================================================
   TaskList.js — Professional Task Manager with Status & Dates
   ============================================================ */

import { useState } from 'react';
import {
    FiPlus, FiTrash2, FiEdit2, FiSave, FiX,
    FiLoader, FiCalendar, FiFilter, FiSearch, FiRefreshCcw
} from 'react-icons/fi';
import { useTasks } from '../hooks/useTasks';

/* ============================================================
   Status Configuration — colors and icons for each status
   ============================================================ */
const STATUS_CONFIG = {
    'Pending': {
        color: '#f59e0b',       // Amber
        bg: '#fef3c7',
        icon: '⏳',
    },
    'In Progress': {
        color: '#3b82f6',       // Blue
        bg: '#dbeafe',
        icon: '🔄',
    },
    'Completed': {
        color: '#22c55e',       // Green
        bg: '#dcfce7',
        icon: '✅',
    },
};

const PRIORITY_CONFIG = {
    'High': { color: '#ef4444', bg: '#fee2e2' },
    'Medium': { color: '#f59e0b', bg: '#fef3c7' },
    'Low': { color: '#22c55e', bg: '#dcfce7' },
};

function TaskList({ userEmail }) {
    /* ---- Custom Hook for Task CRUD ---- */
    const { tasks, loading, fetchTasks, addTask, editTask, removeTask, changeStatus } = useTasks(userEmail);

    /* ---- Local UI State ---- */
    const [showAddForm, setShowAddForm] = useState(false);

    /* ---- Filters State ---- */
    const [filterSearch, setFilterSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterDate, setFilterDate] = useState('');

    /* ---- New Task Form State ---- */
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newPriority, setNewPriority] = useState('Medium');
    const [newStartDate, setNewStartDate] = useState('');
    const [newDueDate, setNewDueDate] = useState('');

    /* ---- Edit Task State ---- */
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPriority, setEditPriority] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editDueDate, setEditDueDate] = useState('');

    /* ---- Today's date for validation ---- */
    const today = new Date().toISOString().split('T')[0];

    /* ---- Fetch with Filters ---- */
    const applyFilters = () => {
        fetchTasks({
            search: filterSearch,
            status: filterStatus,
            priority: filterPriority,
            date: filterDate
        });
    };

    const clearFilters = () => {
        setFilterSearch('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterDate('');
        fetchTasks({});
    };

    /* ---- CREATE — Add a New Task ---- */
    const handleAddTask = async () => {
        if (newTitle.trim() === '') return;

        try {
            await addTask({
                title: newTitle,
                description: newDescription,
                priority: newPriority,
                status: 'Pending',
                start_date: newStartDate,
                due_date: newDueDate,
            });

            /* Reset form fields */
            setNewTitle('');
            setNewDescription('');
            setNewPriority('Medium');
            setNewStartDate('');
            setNewDueDate('');
            setShowAddForm(false);
        } catch (err) {
            console.error('Error adding task:', err);
        }
    };

    /* ---- UPDATE — Save Edited Task ---- */
    const saveEdit = async (id) => {
        if (editTitle.trim() === '') return;

        try {
            await editTask(id, {
                title: editTitle.trim(),
                description: editDescription.trim(),
                priority: editPriority,
                status: editStatus,
                start_date: editStartDate,
                due_date: editDueDate,
            });
            setEditingId(null);
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    /* ---- UPDATE — Quick Status Change ---- */
    const handleStatusChange = async (id, newStatusValue) => {
        try {
            await changeStatus(id, newStatusValue);
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    /* ---- DELETE — Remove a Task ---- */
    const handleDelete = async (id) => {
        try {
            await removeTask(id);
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    /* ---- Start Editing a Task ---- */
    const startEdit = (task) => {
        setEditingId(task._id);
        setEditTitle(task.title || task.text || '');
        setEditDescription(task.description || '');
        setEditPriority(task.priority || 'Medium');
        setEditStatus(task.status || 'Pending');
        setEditStartDate(task.start_date || '');
        setEditDueDate(task.due_date || '');
    };

    /* ---- Cancel Editing ---- */
    const cancelEdit = () => {
        setEditingId(null);
    };

    /* ---- Format Date for Display ---- */
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    /* ---- Task Count Summary ---- */
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter(t => !t.status || t.status === 'Pending').length;

    return (
        <div>
            {/* ===== Task Summary Dashboard ===== */}
            {!loading && totalTasks > 0 && (
                <div className="summary-bar animate-fade-in">
                    <div className="summary-card">
                        <span className="summary-num" style={{ color: '#667eea' }}>{totalTasks}</span>
                        <span className="summary-label">Total</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-num" style={{ color: '#f59e0b' }}>{pendingTasks}</span>
                        <span className="summary-label">Pending</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-num" style={{ color: '#3b82f6' }}>{inProgressTasks}</span>
                        <span className="summary-label">In Progress</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-num" style={{ color: '#22c55e' }}>{completedTasks}</span>
                        <span className="summary-label">Completed</span>
                    </div>
                </div>
            )}

            {/* ===== Search & Filter Bar ===== */}
            <div className="filter-bar animate-fade-in">
                <div className="filter-group">
                    <FiSearch className="filter-icon" />
                    <input
                        className="filter-input"
                        placeholder="Search keyword..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    />
                </div>
                <div className="filter-group">
                    <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                <div className="filter-group">
                    <select className="filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                        <option value="">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                <div className="filter-group">
                    <input
                        className="filter-date"
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        title="Filter by due date"
                    />
                </div>
                <button className="filter-btn" onClick={applyFilters}>
                    <FiFilter /> Apply
                </button>
                <button className="filter-clear-btn" onClick={clearFilters}>
                    <FiRefreshCcw /> Clear
                </button>
            </div>

            {/* ===== Add Task Button / Form ===== */}
            {!showAddForm ? (
                <button className="add-task-btn animate-fade-in" onClick={() => setShowAddForm(true)}>
                    <FiPlus style={{ marginRight: '8px' }} />
                    Add New Task
                </button>
            ) : (
                <div className="form-card animate-fade-in">
                    <h3 className="form-title">
                        <FiPlus style={{ marginRight: '6px' }} /> New Task
                    </h3>

                    {/* Task Title */}
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Task Title (What needs to be done?)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        autoFocus
                    />

                    {/* Task Description */}
                    <textarea
                        className="form-textarea"
                        placeholder="Detailed description (optional)"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows="3"
                    />

                    {/* Dates & Priority */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select
                                className="form-select"
                                value={newPriority}
                                onChange={(e) => setNewPriority(e.target.value)}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input
                                className="form-date"
                                type="date"
                                min={today}
                                value={newStartDate}
                                onChange={(e) => setNewStartDate(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Due Date</label>
                            <input
                                className="form-date"
                                type="date"
                                min={newStartDate || today}
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Default status indicator */}
                    <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#94a3b8' }}>
                        ⏳ Status will be set to <strong style={{ color: '#f59e0b' }}>Pending</strong> by default
                    </p>

                    {/* Form Action Buttons */}
                    <div className="form-actions">
                        <button className="create-btn" onClick={handleAddTask}>
                            <FiPlus style={{ marginRight: '6px' }} /> Create Task
                        </button>
                        <button className="cancel-form-btn" onClick={() => { setShowAddForm(false); setNewTitle(''); setNewDescription(''); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Loading State ===== */}
            {loading && (
                <p className="empty-state">
                    <FiLoader className="spin-icon" style={{ animation: 'spin 1s linear infinite', marginRight: '8px', display: 'inline-block' }} /> Loading tasks...
                </p>
            )}

            {/* ===== Empty State ===== */}
            {!loading && tasks.length === 0 && (
                <div className="empty-state animate-fade-in">
                    <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</p>
                    <p style={{ color: '#64748b', fontWeight: 600, fontSize: '1.2rem' }}>No tasks found</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Try adjusting your filters or add a new task!</p>
                </div>
            )}

            {/* ===== Task Cards ===== */}
            <div className="task-list-container">
                {tasks.map((task) => {
                    const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG['Pending'];
                    const priorityConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['Medium'];
                    const isEditing = editingId === task._id;

                    return (
                        <div key={task._id} className="task-card animate-fade-in" style={{
                            borderLeft: `5px solid ${statusConf.color}`,
                        }}>
                            {isEditing ? (
                                /* ===== EDIT MODE ===== */
                                <div className="edit-container">
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Task Title"
                                        autoFocus
                                    />
                                    <textarea
                                        className="form-textarea"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Detailed description"
                                        rows="2"
                                    />

                                    <div className="form-row-4">
                                        <div className="form-group">
                                            <label className="form-label">Priority</label>
                                            <select
                                                className="form-select"
                                                value={editPriority}
                                                onChange={(e) => setEditPriority(e.target.value)}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Status</label>
                                            <select
                                                className="form-select"
                                                value={editStatus}
                                                onChange={(e) => setEditStatus(e.target.value)}
                                            >
                                                <option value="Pending">⏳ Pending</option>
                                                <option value="In Progress">🔄 In Progress</option>
                                                <option value="Completed">✅ Completed</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Start Date</label>
                                            <input
                                                className="form-date"
                                                type="date"
                                                min={today}
                                                value={editStartDate}
                                                onChange={(e) => setEditStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Due Date</label>
                                            <input
                                                className="form-date"
                                                type="date"
                                                min={editStartDate || today}
                                                value={editDueDate}
                                                onChange={(e) => setEditDueDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-actions" style={{ marginTop: '12px' }}>
                                        <button className="save-edit-btn" onClick={() => saveEdit(task._id)}>
                                            <FiSave style={{ marginRight: '6px' }} /> Save Changes
                                        </button>
                                        <button className="cancel-form-btn" onClick={cancelEdit}>
                                            <FiX style={{ marginRight: '6px' }} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ===== DISPLAY MODE ===== */
                                <>
                                    <div className="task-top-row">
                                        <div className="task-header-info">
                                            <span className={`task-title ${task.status === 'Completed' ? 'completed-text' : ''}`}>
                                                {task.title || task.text}
                                            </span>
                                            <span className="priority-badge" style={{
                                                backgroundColor: priorityConf.bg,
                                                color: priorityConf.color,
                                                border: `1px solid ${priorityConf.color}40`
                                            }}>
                                                {task.priority || 'Medium'}
                                            </span>
                                        </div>

                                        <div className="task-actions">
                                            <button className="icon-btn edit-btn" onClick={() => startEdit(task)} title="Edit Task">
                                                <FiEdit2 />
                                            </button>
                                            <button className="icon-btn delete-btn" onClick={() => handleDelete(task._id)} title="Delete Task">
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>

                                    {task.description && (
                                        <div className={`task-description ${task.status === 'Completed' ? 'completed-text' : ''}`}>
                                            {task.description}
                                        </div>
                                    )}

                                    <div className="task-bottom-row">
                                        <select
                                            className="status-select-inline"
                                            style={{
                                                color: statusConf.color,
                                                background: statusConf.bg,
                                                border: `1px solid ${statusConf.color}40`
                                            }}
                                            value={task.status || 'Pending'}
                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                        >
                                            <option value="Pending">⏳ Pending</option>
                                            <option value="In Progress">🔄 In Progress</option>
                                            <option value="Completed">✅ Completed</option>
                                        </select>

                                        <div className="date-info">
                                            <FiCalendar style={{ fontSize: '0.9rem', color: '#94a3b8' }} />
                                            <span className="date-text">
                                                {formatDate(task.start_date)} → {formatDate(task.due_date)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TaskList;
