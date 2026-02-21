/* ============================================================
   LoginPage.js — Login & Sign Up with Full Validation
   ============================================================
   Uses:
     - useAuth() hook for login/signup (from AuthContext)
     - Validators from utils/validators.js
   
   Validations:
     - No empty fields allowed
     - Email must be a valid email format
     - Password must contain:
         ✓ At least 8 characters
         ✓ At least one uppercase letter (A-Z)
         ✓ At least one lowercase letter (a-z)
         ✓ At least one number (0-9)
         ✓ At least one special character (!@#$%^&*...)
     - Name required for signup (min 2 characters)
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail, getPasswordStrength, isValidPassword } from '../utils/validators';
import { FaClipboardList } from 'react-icons/fa';
import { FiMail, FiLock, FiUser, FiLogIn, FiUserPlus } from 'react-icons/fi';

function LoginPage() {
    /* ---- Hooks ---- */
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    /* ---- State Variables ---- */
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRules, setShowRules] = useState(false);

    /* Get current password strength for real-time feedback */
    const passwordStrength = getPasswordStrength(password);

    /* ---- Client-Side Validation ---- */
    const validateForm = () => {
        if (!email.trim()) {
            setError('Email address is required');
            return false;
        }
        if (!password.trim()) {
            setError('Password is required');
            return false;
        }
        if (isSignUp && !name.trim()) {
            setError('Full name is required');
            return false;
        }
        if (isSignUp && name.trim().length < 2) {
            setError('Name must be at least 2 characters');
            return false;
        }
        if (!isValidEmail(email)) {
            setError('Please enter a valid email address (e.g., user@example.com)');
            return false;
        }
        if (isSignUp && !isValidPassword(password)) {
            setError('Password does not meet all requirements');
            return false;
        }
        return true;
    };

    /* ---- Handle Form Submission ---- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            if (isSignUp) {
                /* --- SIGN UP (uses authService via useAuth hook) --- */
                await signup(name.trim(), email.trim(), password);
            } else {
                /* --- LOGIN --- */
                await login(email.trim(), password);
            }
            navigate('/tasks');
        } catch (err) {
            setError(
                err.response?.data?.error || 'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    /* ---- Toggle Between Login and Sign Up ---- */
    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
        setShowRules(false);
    };

    /* ---- Render ---- */
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* App Logo & Title */}
                <div style={styles.logoSection}>
                    <FaClipboardList style={styles.logoIcon} />
                    <h1 style={styles.logoTitle}>Task Manager</h1>
                    <p style={styles.logoSubtitle}>
                        {isSignUp ? 'Create your account' : 'Welcome back! Please login'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Name field — signup only */}
                    {isSignUp && (
                        <div style={styles.inputGroup}>
                            <FiUser style={styles.inputIcon} />
                            <input
                                style={styles.input}
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Email field */}
                    <div style={{
                        ...styles.inputGroup,
                        borderColor: email && !isValidEmail(email) ? '#ef4444' :
                            email && isValidEmail(email) ? '#22c55e' : '#e2e8f0',
                    }}>
                        <FiMail style={{
                            ...styles.inputIcon,
                            color: email && !isValidEmail(email) ? '#ef4444' :
                                email && isValidEmail(email) ? '#22c55e' : '#94a3b8',
                        }} />
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {email && (
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                                {isValidEmail(email) ? '✅' : '❌'}
                            </span>
                        )}
                    </div>

                    {/* Password field */}
                    <div style={{
                        ...styles.inputGroup,
                        borderColor: isSignUp && password
                            ? (isValidPassword(password) ? '#22c55e' : '#f59e0b')
                            : '#e2e8f0',
                    }}>
                        <FiLock style={{
                            ...styles.inputIcon,
                            color: isSignUp && password
                                ? (isValidPassword(password) ? '#22c55e' : '#f59e0b')
                                : '#94a3b8',
                        }} />
                        <input
                            style={styles.input}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => isSignUp && setShowRules(true)}
                        />
                        {isSignUp && password && (
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                                {isValidPassword(password) ? '✅' : '⚠️'}
                            </span>
                        )}
                    </div>

                    {/* Password Rules Panel (Signup Only) */}
                    {isSignUp && showRules && (
                        <div style={styles.rulesPanel}>
                            <p style={styles.rulesTitle}>Password must contain:</p>
                            <div style={styles.ruleItem}>
                                <span style={passwordStrength.minLength ? styles.rulePass : styles.ruleFail}>
                                    {passwordStrength.minLength ? '✓' : '✗'}
                                </span>
                                <span style={styles.ruleText}>At least 8 characters</span>
                            </div>
                            <div style={styles.ruleItem}>
                                <span style={passwordStrength.hasUppercase ? styles.rulePass : styles.ruleFail}>
                                    {passwordStrength.hasUppercase ? '✓' : '✗'}
                                </span>
                                <span style={styles.ruleText}>One uppercase letter (A-Z)</span>
                            </div>
                            <div style={styles.ruleItem}>
                                <span style={passwordStrength.hasLowercase ? styles.rulePass : styles.ruleFail}>
                                    {passwordStrength.hasLowercase ? '✓' : '✗'}
                                </span>
                                <span style={styles.ruleText}>One lowercase letter (a-z)</span>
                            </div>
                            <div style={styles.ruleItem}>
                                <span style={passwordStrength.hasNumber ? styles.rulePass : styles.ruleFail}>
                                    {passwordStrength.hasNumber ? '✓' : '✗'}
                                </span>
                                <span style={styles.ruleText}>One number (0-9)</span>
                            </div>
                            <div style={styles.ruleItem}>
                                <span style={passwordStrength.hasSpecial ? styles.rulePass : styles.ruleFail}>
                                    {passwordStrength.hasSpecial ? '✓' : '✗'}
                                </span>
                                <span style={styles.ruleText}>One special character (!@#$%...)</span>
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {error && <p style={styles.error}>{error}</p>}

                    {/* Submit button */}
                    <button style={styles.submitBtn} type="submit" disabled={loading}>
                        {isSignUp ? (
                            <>
                                <FiUserPlus style={{ marginRight: '8px' }} />
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </>
                        ) : (
                            <>
                                <FiLogIn style={{ marginRight: '8px' }} />
                                {loading ? 'Logging in...' : 'Login'}
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle link */}
                <p style={styles.toggleText}>
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <span style={styles.toggleLink} onClick={toggleMode}>
                        {isSignUp ? 'Login' : 'Sign Up'}
                    </span>
                </p>
            </div>
        </div>
    );
}

/* ============================================================
   Inline Styles
   ============================================================ */
const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
    },
    card: {
        background: '#ffffff',
        borderRadius: '20px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    },
    logoSection: {
        textAlign: 'center',
        marginBottom: '30px',
    },
    logoIcon: {
        fontSize: '2.5rem',
        color: '#667eea',
        marginBottom: '10px',
    },
    logoTitle: {
        fontSize: '1.6rem',
        fontWeight: 700,
        color: '#1e293b',
        margin: '0 0 6px',
    },
    logoSubtitle: {
        fontSize: '0.9rem',
        color: '#64748b',
        margin: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    inputGroup: {
        display: 'flex',
        alignItems: 'center',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        padding: '0 14px',
        transition: 'border-color 0.2s',
    },
    inputIcon: {
        fontSize: '1.1rem',
        color: '#94a3b8',
        marginRight: '10px',
        flexShrink: 0,
    },
    input: {
        flex: 1,
        padding: '14px 0',
        border: 'none',
        outline: 'none',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        color: '#1e293b',
        background: 'transparent',
    },
    rulesPanel: {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 16px',
    },
    rulesTitle: {
        fontSize: '0.78rem',
        fontWeight: 600,
        color: '#475569',
        margin: '0 0 8px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
    },
    ruleItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '3px 0',
    },
    rulePass: {
        color: '#22c55e',
        fontWeight: 700,
        fontSize: '0.85rem',
        width: '16px',
    },
    ruleFail: {
        color: '#ef4444',
        fontWeight: 700,
        fontSize: '0.85rem',
        width: '16px',
    },
    ruleText: {
        fontSize: '0.82rem',
        color: '#64748b',
    },
    error: {
        color: '#ef4444',
        fontSize: '0.85rem',
        textAlign: 'center',
        margin: 0,
        padding: '4px 0',
    },
    submitBtn: {
        padding: '14px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        marginTop: '4px',
        transition: 'opacity 0.2s',
    },
    toggleText: {
        textAlign: 'center',
        fontSize: '0.88rem',
        color: '#64748b',
        marginTop: '20px',
    },
    toggleLink: {
        color: '#667eea',
        fontWeight: 600,
        cursor: 'pointer',
    },
};

export default LoginPage;
