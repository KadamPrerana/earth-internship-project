/* ============================================================
   TaskList.test.js — Unit Tests for Task List Component
   ============================================================
   What: Tests for the TaskList component's rendering and interactions
   How:  Mocks the useTasks hook to simulate different states
         (loading, tasks, empty), then verifies the UI output
   Why:  Ensures task cards display correctly, the add form works,
         and status badges render with the right colors

   Run:  npm test -- --watchAll=false
   ============================================================ */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskList from './TaskList';

/* ---- Mock the useTasks custom hook ---- */
/* Why: We test the UI layer in isolation from the API.
   The hook is replaced with a controllable mock that returns
   whatever tasks/loading state we choose for each test. */
jest.mock('../hooks/useTasks', () => ({
    useTasks: jest.fn(),
}));

/* Import the mocked hook so we can set return values per test */
const { useTasks } = require('../hooks/useTasks');


/* ---- Helper: Default mock data ---- */
const mockTasks = [
    {
        _id: '1',
        title: 'Build REST APIs',
        status: 'Pending',
        start_date: '2026-02-17',
        due_date: '2026-02-20',
        email: 'test@example.com',
    },
    {
        _id: '2',
        title: 'Write unit tests',
        status: 'In Progress',
        start_date: '2026-02-18',
        due_date: '2026-02-22',
        email: 'test@example.com',
    },
    {
        _id: '3',
        title: 'Deploy to production',
        status: 'Completed',
        start_date: '2026-02-15',
        due_date: '2026-02-16',
        email: 'test@example.com',
    },
];

/* ---- Helper: Setup mock with default values ---- */
const setupMock = (overrides = {}) => {
    const defaults = {
        tasks: mockTasks,
        loading: false,
        addTask: jest.fn().mockResolvedValue({ task_id: 'new-id' }),
        editTask: jest.fn().mockResolvedValue({}),
        removeTask: jest.fn().mockResolvedValue({}),
        changeStatus: jest.fn().mockResolvedValue({}),
    };
    useTasks.mockReturnValue({ ...defaults, ...overrides });
};


/* ============================================================
   RENDERING TESTS — Does the component display correctly?
   ============================================================ */

describe('TaskList Rendering', () => {

    test('renders "Add New Task" button', () => {
        /**
         * Why: The add button is the primary call-to-action.
         * It should always be visible when tasks are loaded.
         */
        setupMock();
        render(<TaskList userEmail="test@example.com" />);

        expect(screen.getByText('Add New Task')).toBeInTheDocument();
    });

    test('renders task cards with text', () => {
        /**
         * Why: Each task's text should be visible on the card.
         * This verifies the task list renders from the hook data.
         */
        setupMock();
        render(<TaskList userEmail="test@example.com" />);

        expect(screen.getByText('Build REST APIs')).toBeInTheDocument();
        expect(screen.getByText('Write unit tests')).toBeInTheDocument();
        expect(screen.getByText('Deploy to production')).toBeInTheDocument();
    });

    test('renders status badges for each task', () => {
        /**
         * Why: Status badges (Pending, In Progress, Completed) should
         * be visible on each task card with the correct text.
         */
        setupMock();
        render(<TaskList userEmail="test@example.com" />);

        // Check status text appears (via dropdowns or badges)
        const statusDropdowns = screen.getAllByRole('combobox');
        expect(statusDropdowns.length).toBeGreaterThanOrEqual(3);
    });

    test('shows loading state', () => {
        /**
         * Why: When tasks are being fetched, a loading indicator
         * should inform the user that data is on the way.
         */
        setupMock({ tasks: [], loading: true });
        render(<TaskList userEmail="test@example.com" />);

        expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
    });

    test('shows empty state when no tasks', () => {
        /**
         * Why: When the user has no tasks, a friendly message should
         * encourage them to create their first task.
         */
        setupMock({ tasks: [], loading: false });
        render(<TaskList userEmail="test@example.com" />);

        expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
    });

    test('displays task count summary', () => {
        /**
         * Why: The dashboard summary should show correct counts
         * for total, pending, in progress, and completed tasks.
         */
        setupMock();
        render(<TaskList userEmail="test@example.com" />);

        // Should show total count of 3 tasks
        expect(screen.getByText('3')).toBeInTheDocument();
    });
});


/* ============================================================
   INTERACTION TESTS — Do user interactions work correctly?
   ============================================================ */

describe('TaskList Interactions', () => {

    test('shows add form when "Add New Task" is clicked', () => {
        /**
         * Why: Clicking the add button should reveal the task
         * creation form with input fields.
         */
        setupMock();
        render(<TaskList userEmail="test@example.com" />);

        fireEvent.click(screen.getByText('Add New Task'));

        // Form should now be visible
        expect(screen.getByPlaceholderText(/Task Title/i)).toBeInTheDocument();
        expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    test('shows default pending message in add form', () => {
        /**
         * Why: The add form should clearly indicate that new tasks
         * start with "Pending" status (no status dropdown on create).
         */
        setupMock();
        render(<TaskList userEmail="test@example.com" />);

        fireEvent.click(screen.getByText('Add New Task'));

        expect(screen.getByText(/status will be set to/i)).toBeInTheDocument();
    });

    test('cancel button hides the add form', () => {
        /**
         * Why: Users should be able to dismiss the form without
         * creating a task.
         */
        setupMock();
        render(<TaskList userEmail="test@example.com" />);

        // Open form
        fireEvent.click(screen.getByText('Add New Task'));
        expect(screen.getByText('Create Task')).toBeInTheDocument();

        // Cancel form
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Create Task')).not.toBeInTheDocument();
    });

    test('calls addTask when form is submitted', async () => {
        /**
         * Why: Submitting the form should call the addTask function
         * from the useTasks hook with the entered task text.
         */
        const mockAddTask = jest.fn().mockResolvedValue({ task_id: 'new-id' });
        setupMock({ addTask: mockAddTask });
        render(<TaskList userEmail="test@example.com" />);

        // Open form and enter task
        fireEvent.click(screen.getByText('Add New Task'));
        fireEvent.change(screen.getByPlaceholderText(/Task Title/i), {
            target: { value: 'New test task' },
        });

        // Submit
        fireEvent.click(screen.getByText('Create Task'));

        await waitFor(() => {
            expect(mockAddTask).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'New test task',
                    status: 'Pending',
                })
            );
        });
    });
});
