/* ============================================================
   TaskList.js — Professional Task Manager with Status & Dates
   ============================================================
   Uses:
     - useTasks() custom hook for all CRUD operations
     - taskService via the hook (which uses JWT-enabled Axios)

   Features:
     - Task status dropdown: Pending / In Progress / Completed
     - Start Date and Due Date pickers
     - Inline editing for all task fields
     - Color-coded status badges
     - Task count summary dashboard
     - Expandable "Add Task" form

   Props:
     - userEmail: The logged-in user's email
   ============================================================ */

import { useState } from 'react';
import {
    FiPlus, FiTrash2, FiEdit2, FiSave, FiX,
    FiLoader, FiCalendar
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

function TaskList({ userEmail }) {
    /* ---- Custom Hook for Task CRUD ---- */
    const { tasks, loading, addTask, editTask, removeTask, changeStatus } = useTasks(userEmail);

    /* ---- Local UI State ---- */
    const [showAddForm, setShowAddForm] = useState(false);

    /* ---- New Task Form State ---- */
    const [newText, setNewText] = useState('');
    const [newStatus, setNewStatus] = useState('Pending');
    const [newStartDate, setNewStartDate] = useState('');
    const [newDueDate, setNewDueDate] = useState('');

    /* ---- Edit Task State ---- */
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editDueDate, setEditDueDate] = useState('');

    /* ---- CREATE — Add a New Task ---- */
    const handleAddTask = async () => {
        if (newText.trim() === '') return;

        try {
            await addTask({
                text: newText,
                status: 'Pending',
                start_date: newStartDate,
                due_date: newDueDate,
            });

            /* Reset form fields */
            setNewText('');
            setNewStatus('Pending');
            setNewStartDate('');
            setNewDueDate('');
            setShowAddForm(false);
        } catch (err) {
            console.error('Error adding task:', err);
        }
    };

    /* ---- UPDATE — Save Edited Task ---- */
    const saveEdit = async (id) => {
        if (editText.trim() === '') return;

        try {
            await editTask(id, {
                text: editText.trim(),
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
        setEditText(task.text);
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

    /* ============================================================
       RENDER
       ============================================================ */
    return (
        <div>
            {/* ===== Task Summary Dashboard ===== */}
            {!loading && totalTasks > 0 && (
                <div style={styles.summaryBar}>
                    <div style={styles.summaryCard}>
                        <span style={{ ...styles.summaryNum, color: '#667eea' }}>{totalTasks}</span>
                        <span style={styles.summaryLabel}>Total</span>
                    </div>
                    <div style={styles.summaryCard}>
                        <span style={{ ...styles.summaryNum, color: '#f59e0b' }}>{pendingTasks}</span>
                        <span style={styles.summaryLabel}>Pending</span>
                    </div>
                    <div style={styles.summaryCard}>
                        <span style={{ ...styles.summaryNum, color: '#3b82f6' }}>{inProgressTasks}</span>
                        <span style={styles.summaryLabel}>In Progress</span>
                    </div>
                    <div style={styles.summaryCard}>
                        <span style={{ ...styles.summaryNum, color: '#22c55e' }}>{completedTasks}</span>
                        <span style={styles.summaryLabel}>Completed</span>
                    </div>
                </div>
            )}

            {/* ===== Add Task Button / Form ===== */}
            {!showAddForm ? (
                <button style={styles.addTaskBtn} onClick={() => setShowAddForm(true)}>
                    <FiPlus style={{ marginRight: '8px' }} />
                    Add New Task
                </button>
            ) : (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>
                        <FiPlus style={{ marginRight: '6px' }} /> New Task
                    </h3>

                    {/* Task Description */}
                    <input
                        style={styles.formInput}
                        type="text"
                        placeholder="What needs to be done?"
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        autoFocus
                    />

                    {/* Dates Row — Status is always Pending on create */}
                    <div style={{ ...styles.formRow, gridTemplateColumns: '1fr 1fr' }}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Start Date</label>
                            <input
                                style={styles.formDate}
                                type="date"
                                value={newStartDate}
                                onChange={(e) => setNewStartDate(e.target.value)}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Due Date</label>
                            <input
                                style={styles.formDate}
                                type="date"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Default status indicator */}
                    <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#94a3b8' }}>
                        ⏳ Status will be set to <strong style={{ color: '#f59e0b' }}>Pending</strong> by default
                    </p>

                    {/* Form Action Buttons */}
                    <div style={styles.formActions}>
                        <button style={styles.createBtn} onClick={handleAddTask}>
                            <FiPlus style={{ marginRight: '6px' }} /> Create Task
                        </button>
                        <button style={styles.cancelFormBtn} onClick={() => { setShowAddForm(false); setNewText(''); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Loading State ===== */}
            {loading && (
                <p style={styles.emptyState}>
                    <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> Loading tasks...
                </p>
            )}

            {/* ===== Empty State ===== */}
            {!loading && tasks.length === 0 && (
                <div style={styles.emptyState}>
                    <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</p>
                    <p style={{ color: '#64748b', fontWeight: 500 }}>No tasks yet</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Click "Add New Task" to get started!</p>
                </div>
            )}

            {/* ===== Task Cards ===== */}
            {tasks.map((task) => {
                const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG['Pending'];
                const isEditing = editingId === task._id;

                return (
                    <div key={task._id} style={{
                        ...styles.taskCard,
                        borderLeft: `4px solid ${statusConf.color}`,
                    }}>
                        {isEditing ? (
                            /* ===== EDIT MODE ===== */
                            <div style={styles.editContainer}>
                                <input
                                    style={styles.formInput}
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    autoFocus
                                />

                                <div style={styles.formRow}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Status</label>
                                        <select
                                            style={styles.formSelect}
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                        >
                                            <option value="Pending">⏳ Pending</option>
                                            <option value="In Progress">🔄 In Progress</option>
                                            <option value="Completed">✅ Completed</option>
                                        </select>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Start Date</label>
                                        <input
                                            style={styles.formDate}
                                            type="date"
                                            value={editStartDate}
                                            onChange={(e) => setEditStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Due Date</label>
                                        <input
                                            style={styles.formDate}
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={styles.formActions}>
                                    <button style={styles.saveEditBtn} onClick={() => saveEdit(task._id)}>
                                        <FiSave style={{ marginRight: '4px' }} /> Save
                                    </button>
                                    <button style={styles.cancelFormBtn} onClick={cancelEdit}>
                                        <FiX style={{ marginRight: '4px' }} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ===== DISPLAY MODE ===== */
                            <>
                                <div style={styles.taskTopRow}>
                                    <span style={{
                                        ...styles.taskText,
                                        ...(task.status === 'Completed' ? styles.completedText : {}),
                                    }}>
                                        {task.text}
                                    </span>

                                    <div style={styles.taskActions}>
                                        <button style={styles.iconBtn} onClick={() => startEdit(task)} title="Edit Task">
                                            <FiEdit2 />
                                        </button>
                                        <button style={{ ...styles.iconBtn, color: '#ef4444' }} onClick={() => handleDelete(task._id)} title="Delete Task">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>

                                <div style={styles.taskBottomRow}>
                                    <select
                                        style={{
                                            ...styles.statusSelect,
                                            color: statusConf.color,
                                            background: statusConf.bg,
                                        }}
                                        value={task.status || 'Pending'}
                                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                    >
                                        <option value="Pending">⏳ Pending</option>
                                        <option value="In Progress">🔄 In Progress</option>
                                        <option value="Completed">✅ Completed</option>
                                    </select>

                                    <div style={styles.dateInfo}>
                                        <FiCalendar style={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                                        <span style={styles.dateText}>
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
    );
}

/* ============================================================
   Professional Inline Styles
   ============================================================ */
const styles = {
    summaryBar: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        marginBottom: '20px',
    },
    summaryCard: {
        background: '#fff',
        borderRadius: '12px',
        padding: '14px 10px',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    summaryNum: {
        fontSize: '1.5rem',
        fontWeight: 700,
    },
    summaryLabel: {
        fontSize: '0.7rem',
        color: '#94a3b8',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    addTaskBtn: {
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '0.95rem',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        marginBottom: '20px',
        transition: 'opacity 0.2s',
    },
    formCard: {
        background: '#fff',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '20px',
        border: '2px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    },
    formTitle: {
        fontSize: '1rem',
        fontWeight: 600,
        color: '#1e293b',
        margin: '0 0 14px',
        display: 'flex',
        alignItems: 'center',
    },
    formInput: {
        width: '100%',
        padding: '12px 14px',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '0.93rem',
        outline: 'none',
        fontFamily: 'inherit',
        marginBottom: '12px',
        boxSizing: 'border-box',
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px',
        marginBottom: '14px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    formLabel: {
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
    },
    formSelect: {
        padding: '9px 10px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '0.85rem',
        outline: 'none',
        fontFamily: 'inherit',
        cursor: 'pointer',
        background: '#fff',
    },
    formDate: {
        padding: '9px 10px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '0.85rem',
        outline: 'none',
        fontFamily: 'inherit',
    },
    formActions: {
        display: 'flex',
        gap: '10px',
    },
    createBtn: {
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.88rem',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'inherit',
    },
    cancelFormBtn: {
        padding: '10px 20px',
        background: '#f1f5f9',
        color: '#64748b',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.88rem',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    taskCard: {
        background: '#fff',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        transition: 'box-shadow 0.2s',
    },
    taskTopRow: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '10px',
        marginBottom: '10px',
    },
    taskText: {
        flex: 1,
        fontSize: '0.95rem',
        fontWeight: 500,
        color: '#1e293b',
        lineHeight: 1.5,
    },
    completedText: {
        textDecoration: 'line-through',
        color: '#94a3b8',
    },
    taskActions: {
        display: 'flex',
        gap: '4px',
        flexShrink: 0,
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        color: '#667eea',
        cursor: 'pointer',
        fontSize: '1rem',
        padding: '4px 6px',
        borderRadius: '6px',
        display: 'flex',
        transition: 'background 0.15s',
    },
    taskBottomRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
    },
    statusSelect: {
        padding: '4px 10px',
        border: 'none',
        borderRadius: '20px',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        fontFamily: 'inherit',
    },
    dateInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    dateText: {
        fontSize: '0.78rem',
        color: '#94a3b8',
    },
    editContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    saveEditBtn: {
        padding: '10px 20px',
        background: '#dcfce7',
        color: '#16a34a',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.88rem',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'inherit',
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px 0',
    },
};

export default TaskList;
