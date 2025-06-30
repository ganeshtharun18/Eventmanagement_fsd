import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/common/Navbar';
import './styles.css';

const AppRoutes = () => {
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/register'];
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="app">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
