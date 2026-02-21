/* ============================================================
   App.test.js — Basic App Rendering Test
   ============================================================
   Updated to work with the current App component that uses
   React Router and custom auth context.
   ============================================================ */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/* Mock react-router-dom */
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: () => null,
  Navigate: () => null,
  useNavigate: () => jest.fn(),
}));

/* Mock custom hooks and context */
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

jest.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

import App from './App';

test('renders without crashing', () => {
  render(<App />);
});
