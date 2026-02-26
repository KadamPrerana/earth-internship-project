import React from 'react';

export default function TaskFilters({ filters, setFilters }) {
    return (
        <div className="task-filters">
            <div className="filter-group">
                <label>Status</label>
                <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                    <option value="">All Status</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="In Progress">🔄 In Progress</option>
                    <option value="Completed">✅ Completed</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Priority</label>
                <select
                    value={filters.priority || ''}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
                >
                    <option value="">All Priority</option>
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                </select>
            </div>

            <div className="filter-group search-group">
                <label>Search</label>
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
            </div>
        </div>
    );
}
