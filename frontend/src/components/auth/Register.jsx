import React, { useState } from 'react';
import { register } from '../../services/api';
import './AuthForms.css';

const Register = ({ onRegisterSuccess }) => {
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'User'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await register(userData);
      if (response.success) {
        onRegisterSuccess();
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h3>Register</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={userData.username}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={userData.email}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={userData.password}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Role</label>
        <select
          name="role"
          value={userData.role}
          onChange={handleChange}
        >
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default Register;