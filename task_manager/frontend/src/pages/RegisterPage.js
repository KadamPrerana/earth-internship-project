import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { FiUser, FiMail, FiLock, FiUserPlus, FiShield, FiCheck, FiX } from 'react-icons/fi';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showRules, setShowRules] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const passwordStrength = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[@$!%*?&]/.test(password),
    };

    const allValid = Object.values(passwordStrength).every(Boolean);

    const isValidEmail = (str) => /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(str);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('All fields are required');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }
        if (!allValid) {
            setError('Password does not meet complexity requirements');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/api/auth/register/', { name, email, password });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const RuleItem = ({ valid, text }) => (
        <div className={`rule-item ${valid ? 'valid' : 'invalid'}`}>
            {valid ? <FiCheck className="rule-icon" /> : <FiX className="rule-icon" />}
            <span>{text}</span>
        </div>
    );

    return (
        <div className="auth-page">
            <div className="auth-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <div className="auth-card glass-card">
                <div className="auth-header">
                    <div className="auth-icon-wrap">
                        <FiShield size={32} />
                    </div>
                    <h1>Create Account</h1>
                    <p>Join the Task Manager platform</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <FiUser className="input-icon" />
                        <input
                            id="register-name"
                            type="text"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{
                        borderColor: email && !isValidEmail(email) ? '#ef4444' :
                            email && isValidEmail(email) ? '#22c55e' : undefined
                    }}>
                        <FiMail className="input-icon" />
                        <input
                            id="register-email"
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {email && (
                            <span className="input-indicator">
                                {isValidEmail(email) ? '✅' : '❌'}
                            </span>
                        )}
                    </div>

                    <div className="input-group">
                        <FiLock className="input-icon" />
                        <input
                            id="register-password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onFocus={() => setShowRules(true)}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {password && (
                            <span className="input-indicator">
                                {allValid ? '✅' : '❌'}
                            </span>
                        )}
                    </div>

                    {showRules && (
                        <div className="rules-panel">
                            <p className="rules-title">Password must contain:</p>
                            <RuleItem valid={passwordStrength.minLength} text="At least 8 characters" />
                            <RuleItem valid={passwordStrength.hasUppercase} text="One uppercase letter (A-Z)" />
                            <RuleItem valid={passwordStrength.hasLowercase} text="One lowercase letter (a-z)" />
                            <RuleItem valid={passwordStrength.hasNumber} text="One digit (0-9)" />
                            <RuleItem valid={passwordStrength.hasSpecial} text="One special char (@$!%*?&)" />
                        </div>
                    )}

                    <button
                        id="register-submit"
                        type="submit"
                        className="btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="btn-loading">Creating account...</span>
                        ) : (
                            <><FiUserPlus /> Create Account</>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/">Sign in here</Link></p>
                </div>
            </div>
        </div>
    );
}
