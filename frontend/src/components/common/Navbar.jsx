import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">Event Management</Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/user">User Dashboard</Link>
        <Link to="/admin">Admin Dashboard</Link>
      </div>
    </nav>
  );
};

export default Navbar;