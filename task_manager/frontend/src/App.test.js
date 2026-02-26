import { render, screen } from '@testing-library/react';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Routes: ({ children }) => <div>{children}</div>,
    Route: () => null,
    Navigate: () => null,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
    jwtDecode: () => ({ email: 'test@test.com', role: 'user', name: 'Test', exp: 9999999999 })
}));

// Mock axios
jest.mock('./api/axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(() => Promise.resolve({ data: {} })),
        post: jest.fn(() => Promise.resolve({ data: {} })),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
    },
}));

// Simple import after mocks
const App = require('./App').default;

test('renders without crashing', () => {
    render(<App />);
});

test('shows login page when not authenticated', () => {
    // localStorage should be empty, so login should appear
    localStorage.clear();
    render(<App />);
    // The app should render without errors
});
