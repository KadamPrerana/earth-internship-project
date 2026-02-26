import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiCalendar, FiFlag } from 'react-icons/fi';

const STATUS_CONFIG = {
    'Pending': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '⏳' },
    'In Progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '🔄' },
    'Completed': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: '✅' },
};

const PRIORITY_CONFIG = {
    'High': { color: '#ef4444', label: '🔴 High' },
    'Medium': { color: '#f59e0b', label: '🟡 Medium' },
    'Low': { color: '#22c55e', label: '🟢 Low' },
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function TaskCard({ task, onUpdate, onDelete, onComplete, isAdmin = false }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG['Pending'];
    const priorityConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['Medium'];

    const startEdit = () => {
        setEditData({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            start_date: task.start_date || '',
            due_date: task.due_date || '',
        });
        setIsEditing(true);
    };

    const saveEdit = () => {
        onUpdate(task._id, editData);
        setIsEditing(false);
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';

    return (
        <div className={`task-card ${isOverdue ? 'overdue' : ''}`}
            style={{ borderLeft: `4px solid ${statusConf.color}` }}>
            {isEditing ? (
                <div className="task-edit-form">
                    <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="edit-input"
                        placeholder="Task title"
                    />
                    <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="edit-textarea"
                        placeholder="Description..."
                        rows={2}
                    />
                    <div className="edit-row">
                        <div className="form-field">
                            <label>Status</label>
                            <select value={editData.status}
                                onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                                <option value="Pending">⏳ Pending</option>
                                <option value="In Progress">🔄 In Progress</option>
                                <option value="Completed">✅ Completed</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Priority</label>
                            <select value={editData.priority}
                                onChange={(e) => setEditData({ ...editData, priority: e.target.value })}>
                                <option value="Low">🟢 Low</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="High">🔴 High</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Start Date</label>
                            <input type="date" value={editData.start_date}
                                onChange={(e) => setEditData({ ...editData, start_date: e.target.value })} />
                        </div>
                        <div className="form-field">
                            <label>Due Date</label>
                            <input type="date" value={editData.due_date}
                                onChange={(e) => setEditData({ ...editData, due_date: e.target.value })} />
                        </div>
                    </div>
                    <div className="edit-actions">
                        <button className="btn-save" onClick={saveEdit}>Save</button>
                        <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="task-header">
                        <h3 className="task-title">{task.title}</h3>
                        <div className="task-badges">
                            <span className="badge status-badge" style={{ color: statusConf.color, background: statusConf.bg }}>
                                {statusConf.icon} {task.status}
                            </span>
                            <span className="badge priority-badge" style={{ color: priorityConf.color }}>
                                <FiFlag size={12} /> {task.priority}
                            </span>
                        </div>
                    </div>

                    {task.description && (
                        <p className="task-description">{task.description}</p>
                    )}

                    <div className="task-meta">
                        {task.start_date && (
                            <span className="meta-item">
                                <FiCalendar size={14} /> Start: {formatDate(task.start_date)}
                            </span>
                        )}
                        {task.due_date && (
                            <span className={`meta-item ${isOverdue ? 'overdue-text' : ''}`}>
                                <FiCalendar size={14} /> Due: {formatDate(task.due_date)}
                            </span>
                        )}
                        {isAdmin && task.assigned_to && (
                            <span className="meta-item">👤 {task.assigned_to}</span>
                        )}
                        {task.created_by !== task.assigned_to && (
                            <span className="meta-item assigned-by">📋 by {task.created_by}</span>
                        )}
                    </div>

                    <div className="task-actions">
                        {task.status !== 'Completed' && onComplete && (
                            <button className="btn-icon btn-complete" onClick={() => onComplete(task._id)}
                                title="Mark Complete">
                                <FiCheck />
                            </button>
                        )}
                        <button className="btn-icon btn-edit" onClick={startEdit} title="Edit">
                            <FiEdit2 />
                        </button>
                        <button className="btn-icon btn-delete" onClick={() => onDelete(task._id)} title="Delete">
                            <FiTrash2 />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
