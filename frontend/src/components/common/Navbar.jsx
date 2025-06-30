import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="center-title">
        Event Management System
      </div>

      {user && (
        <div className="nav-links">
          <Link to="/">Home</Link>
          {user.role === 'User' && <Link to="/user">User Dashboard</Link>}
          {user.role === 'Admin' && <Link to="/admin">Admin Dashboard</Link>}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
