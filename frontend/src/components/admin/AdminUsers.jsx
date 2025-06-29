import React, { useState, useEffect } from 'react';
import { getUsers, updateUserRole, deleteUser } from '../../services/api';
import './AdminUsers.css';

const AdminUsers = () => {
  const [state, setState] = useState({
    users: [],
    loading: true,
    error: null,
    updating: false,
    deletingId: null,
    retryCount: 0
  });

  // Fetch users with retry logic
  const fetchUsers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const data = await getUsers();

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: Expected array of users');
      }

      const isValid = data.every(user => user.username && user.email && user.role);
      if (!isValid) {
        throw new Error('Some users are missing required fields');
      }

      setState(prev => ({
        ...prev,
        users: data,
        loading: false,
        error: null,
        retryCount: 0
      }));
    } catch (err) {
      console.error('Fetch users error:', err);

      if (state.retryCount < 3) {
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            retryCount: prev.retryCount + 1
          }));
        }, 1000);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load users. Please try again later.'
        }));
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [state.retryCount]);

  // Handle role change
  const handleRoleChange = async (username, newRole) => {
    if (state.updating) return;

    setState(prev => ({ ...prev, updating: true, error: null }));

    try {
      const updatedUsers = state.users.map(user =>
        user.username === username ? { ...user, role: newRole } : user
      );

      setState(prev => ({ ...prev, users: updatedUsers }));

      await updateUserRole(username, newRole);

      setState(prev => ({ ...prev, updating: false }));
    } catch (err) {
      console.error('Update role error:', err);
      setState(prev => ({
        ...prev,
        updating: false,
        error: err.message || 'Failed to update user role'
      }));
    }
  };

  // Handle delete user
  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${username}?`)) return;
    if (state.deletingId) return;

    setState(prev => ({ ...prev, deletingId: username, error: null }));

    try {
      await deleteUser(username);

      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => user.username !== username),
        deletingId: null
      }));
    } catch (err) {
      console.error('Delete user error:', err);
      setState(prev => ({
        ...prev,
        deletingId: null,
        error: err.message || 'Failed to delete user'
      }));
    }
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...{state.retryCount > 0 && ` (Attempt ${state.retryCount + 1})`}</p>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="error-container">
        <p className="error-message">{state.error}</p>
        <div className="error-actions">
          <button
            className="retry-btn"
            onClick={() =>
              setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }))
            }
          >
            Retry
          </button>
          <button className="refresh-btn" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="admin-users-container">
      <header className="admin-header">
        <h2>User Management</h2>
        <div className="header-info">
          <p className="user-count">
            {state.users.length} user{state.users.length !== 1 ? 's' : ''}
          </p>
          <button
            className="refresh-btn"
            onClick={fetchUsers}
            disabled={state.updating || state.deletingId}
          >
            Refresh List
          </button>
        </div>
      </header>

      <div className="table-responsive">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.users.length > 0 ? (
              state.users.map(user => (
                <tr
                  key={user.username}
                  className={`${state.deletingId === user.username ? 'deleting' : ''} ${user.role.toLowerCase()}`}
                >
                  <td>{user.username}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.username, e.target.value)
                      }
                      disabled={state.updating || state.deletingId}
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Moderator">Moderator</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={`delete-btn ${
                        state.deletingId === user.username ? 'processing' : ''
                      }`}
                      onClick={() => handleDeleteUser(user.username)}
                      disabled={state.updating || state.deletingId}
                    >
                      {state.deletingId === user.username ? (
                        <span className="deleting-text">Deleting...</span>
                      ) : (
                        <span>Delete</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-users">
                <td colSpan="4">No users found in the system</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(state.updating || state.deletingId) && (
        <div className="status-overlay">
          <div className="status-message">
            {state.updating && 'Updating user roles...'}
            {state.deletingId && `Deleting user ${state.deletingId}...`}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
