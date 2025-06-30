import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../services/api';
import './AuthForms.css';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState('');
  const [logoutSuccess, setLogoutSuccess] = useState('');

  // Check for logout state when component mounts
  useEffect(() => {
    if (location.state?.fromLogout) {
      setLogoutSuccess('You have been successfully logged out.');
      const timer = setTimeout(() => setLogoutSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoginSuccess('');
    setLogoutSuccess('');

    try {
      const response = await login(credentials);

      if (response.success) {
        // Role-based success message
        const welcomeMessage = response.role === 'Admin' 
          ? `Welcome Admin ${response.username}! Redirecting to dashboard...`
          : `Welcome ${response.username}! Redirecting to your account...`;
        
        setLoginSuccess(welcomeMessage);
        
        // Delay navigation to show the message
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess({
              username: response.username,
              role: response.role
            });
          } else {
            navigate(response.role === 'Admin' ? '/admin/dashboard' : '/user/profile');
          }
        }, 2000);
      } else {
        setError(response.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear messages after timeout
  useEffect(() => {
    const timers = [];
    if (loginSuccess) {
      timers.push(setTimeout(() => setLoginSuccess(''), 2000));
    }
    if (error) {
      timers.push(setTimeout(() => setError(''), 5000));
    }
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [loginSuccess, error]);

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>

        {/* Logout success message */}
        {logoutSuccess && (
          <div className="message logout-message">
            <span>👋</span> {logoutSuccess}
          </div>
        )}

        {/* Login success message */}
        {loginSuccess && (
          <div className="message success-message">
            <span>🎉</span> {loginSuccess}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="message error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? (
            <>
              <span className="spinner"></span> Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>

        <div className="auth-links">
          <a href="/forgot-password">Forgot password?</a>
          <a href="/register">Create new account</a>
        </div>
      </form>
    </div>
  );
};

export default Login;