/* ============================================================
   useTasks.js — Custom Hook for Task CRUD Operations
   ============================================================
   Encapsulates all task management logic into a reusable hook.
   Uses the taskService for API calls (which auto-attaches JWT).

   Returns:
     - tasks: array of task objects
     - loading: boolean
     - fetchTasks(): refresh tasks from server
     - addTask(data): create a new task
     - editTask(id, data): update a task
     - removeTask(id): delete a task
     - changeStatus(id, newStatus): quick status update

   Usage:
     const { tasks, loading, addTask, removeTask } = useTasks(userEmail);
   ============================================================ */

import { useState, useEffect, useCallback } from 'react';
import * as taskService from '../services/taskService';


export function useTasks(userEmail) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    /* ---- Fetch tasks from server ---- */
    const fetchTasks = useCallback(async (filters = {}) => {
        if (!userEmail) return;

        try {
            setLoading(true);
            const data = await taskService.getTasks(userEmail, filters);
            setTasks(data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    }, [userEmail]);

    /* Fetch tasks when userEmail changes initially */
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    /* ---- Create a new task ---- */
    const addTask = async ({ title, description = '', priority = 'Medium', status = 'Pending', start_date = '', due_date = '' }) => {
        try {
            const result = await taskService.createTask({
                email: userEmail,
                title: title.trim(),
                description: description.trim(),
                priority,
                status,
                start_date,
                due_date,
            });

            // Optimistic update — add to local state immediately
            setTasks((prev) => [{
                _id: result.task_id,
                title: title.trim(),
                description: description.trim(),
                priority,
                status,
                start_date,
                due_date,
                email: userEmail,
            }, ...prev]);

            return result;
        } catch (err) {
            console.error('Error adding task:', err);
            throw err;
        }
    };

    /* ---- Update an existing task ---- */
    const editTask = async (id, data) => {
        try {
            await taskService.updateTask(id, data);

            // Update local state
            setTasks((prev) => prev.map((t) =>
                t._id === id ? { ...t, ...data } : t
            ));
        } catch (err) {
            console.error('Error updating task:', err);
            throw err;
        }
    };

    /* ---- Quick status change ---- */
    const changeStatus = async (id, newStatus) => {
        try {
            await taskService.updateTask(id, { status: newStatus });

            setTasks((prev) => prev.map((t) =>
                t._id === id ? { ...t, status: newStatus } : t
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            throw err;
        }
    };

    /* ---- Delete a task ---- */
    const removeTask = async (id) => {
        try {
            await taskService.deleteTask(id);
            setTasks((prev) => prev.filter((t) => t._id !== id));
        } catch (err) {
            console.error('Error deleting task:', err);
            throw err;
        }
    };

    return {
        tasks,
        loading,
        fetchTasks,
        addTask,
        editTask,
        removeTask,
        changeStatus,
    };
}
