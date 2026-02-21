/* ============================================================
   LoginPage.test.js — Unit Tests for Login/Signup Component
   ============================================================
   What: Tests for the LoginPage component's rendering and validation
   How:  Uses React Testing Library to render components and simulate
         user interactions (typing, clicking, submitting)
   Why:  Ensures the login form displays correctly, validates input,
         and shows appropriate error messages

   Run:  npm test -- --watchAll=false
   ============================================================ */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/* ---- Mock react-router-dom ---- */
/* Why: Jest can't resolve react-router-dom in this environment.
   We mock useNavigate (only hook LoginPage uses) and provide
   a simple BrowserRouter wrapper. */
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }) => <div>{children}</div>,
}));

/* Axios is auto-mocked by src/__mocks__/axios.js */

/* ---- Mock useAuth hook ---- */
/* LoginPage uses useAuth() from AuthContext, which requires AuthProvider.
   Mocking it avoids needing to wrap in the provider. */
jest.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
    }),
}));

import LoginPage from './LoginPage';

/* ---- Helper: Render LoginPage ---- */
const renderLoginPage = (onLogin = jest.fn()) => {
    return render(<LoginPage onLogin={onLogin} />);
};


/* ============================================================
   RENDERING TESTS — Does the component display correctly?
   ============================================================ */

describe('LoginPage Rendering', () => {

    test('renders login form with email and password fields', () => {
        /**
         * Why: The basic login form must always render with email
         * and password inputs. This is the minimum viable UI.
         */
        renderLoginPage();

        expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    test('renders Task Manager title', () => {
        /**
         * Why: Brand identity — the title should always be visible.
         */
        renderLoginPage();

        expect(screen.getByText('Task Manager')).toBeInTheDocument();
    });

    test('shows "Welcome back" message on login mode', () => {
        /**
         * Why: User should see appropriate messaging based on mode.
         */
        renderLoginPage();

        expect(screen.getByText('Welcome back! Please login')).toBeInTheDocument();
    });
});


/* ============================================================
   TOGGLE TESTS — Switching between Login and Sign Up
   ============================================================ */

describe('Login/Signup Toggle', () => {

    test('switches to signup mode and shows name field', () => {
        /**
         * Why: Sign Up mode requires an additional "Name" field.
         * Clicking "Sign Up" link should reveal it.
         */
        renderLoginPage();

        // Click "Sign Up" toggle link
        fireEvent.click(screen.getByText('Sign Up'));

        // Name field should now be visible
        expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
        expect(screen.getByText('Create your account')).toBeInTheDocument();
    });

    test('switches back to login mode hides name field', () => {
        /**
         * Why: Toggling back to Login should hide the Name field.
         */
        renderLoginPage();

        // Switch to Sign Up
        fireEvent.click(screen.getByText('Sign Up'));
        expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();

        // Switch back to Login
        fireEvent.click(screen.getByText('Login'));
        expect(screen.queryByPlaceholderText('Full Name')).not.toBeInTheDocument();
    });
});


/* ============================================================
   VALIDATION TESTS — Does client-side validation work?
   ============================================================ */

describe('Form Validation', () => {

    test('shows error for empty email on submit', async () => {
        /**
         * Why: Empty email must be rejected before hitting the backend.
         */
        renderLoginPage();

        // Submit with empty fields
        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByText('Email address is required')).toBeInTheDocument();
        });
    });

    test('shows error for invalid email format', async () => {
        /**
         * Why: Malformed emails (without @) should be caught client-side.
         */
        renderLoginPage();

        // Type invalid email
        fireEvent.change(screen.getByPlaceholderText('Email Address'), {
            target: { value: 'not-an-email' },
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'somepassword' },
        });

        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
        });
    });

    test('shows email validation indicator', () => {
        /**
         * Why: Real-time ✅/❌ feedback helps users fix input before submitting.
         */
        renderLoginPage();

        const emailInput = screen.getByPlaceholderText('Email Address');

        // Type invalid email — should show ❌
        fireEvent.change(emailInput, { target: { value: 'abc' } });
        expect(screen.getByText('❌')).toBeInTheDocument();

        // Type valid email — should show ✅
        fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
        expect(screen.getByText('✅')).toBeInTheDocument();
    });

    test('shows password strength rules panel in signup mode', () => {
        /**
         * Why: Password rules panel should appear when the user
         * focuses the password field during signup.
         */
        renderLoginPage();

        // Switch to Sign Up mode
        fireEvent.click(screen.getByText('Sign Up'));

        // Focus the password field
        const passwordInput = screen.getByPlaceholderText('Password');
        fireEvent.focus(passwordInput);

        // Password rules should be visible
        expect(screen.getByText('Password must contain:')).toBeInTheDocument();
        expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
        expect(screen.getByText('One uppercase letter (A-Z)')).toBeInTheDocument();
        expect(screen.getByText('One lowercase letter (a-z)')).toBeInTheDocument();
        expect(screen.getByText('One number (0-9)')).toBeInTheDocument();
    });
});
