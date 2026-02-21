/* ============================================================
   taskService.js — Task API Service
   ============================================================
   Handles all task-related API calls using the centralized
   Axios instance (which auto-attaches JWT tokens).
   
   Functions:
     - getTasks(email) → Fetch all tasks for a user
     - createTask(data) → Create a new task
     - updateTask(id, data) → Update a task by ID
     - deleteTask(id) → Delete a task by ID
   ============================================================ */

import api from './api';

/* Base path for task endpoints */
const TASKS_PATH = '/users/tasks';


/**
 * Fetch all tasks for a given user.
 *
 * @param {string} email - User's email
 * @returns {Array} List of task objects
 */
export const getTasks = async (email) => {
    const res = await api.get(`${TASKS_PATH}/list/${email}/`);
    return res.data;
};


/**
 * Create a new task.
 *
 * @param {object} data - { email, text, status, start_date, due_date }
 * @returns {object} { message, task_id }
 */
export const createTask = async (data) => {
    const res = await api.post(`${TASKS_PATH}/create/`, data);
    return res.data;
};


/**
 * Update an existing task.
 *
 * @param {string} id - Task MongoDB ObjectId
 * @param {object} data - Fields to update: { text, status, start_date, due_date }
 * @returns {object} { message }
 */
export const updateTask = async (id, data) => {
    const res = await api.put(`${TASKS_PATH}/update/${id}/`, data);
    return res.data;
};


/**
 * Delete a task.
 *
 * @param {string} id - Task MongoDB ObjectId
 * @returns {object} { message }
 */
export const deleteTask = async (id) => {
    const res = await api.delete(`${TASKS_PATH}/delete/${id}/`);
    return res.data;
};
