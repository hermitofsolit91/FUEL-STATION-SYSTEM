import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/mogas.jpeg" alt="Mogas Logo" className="navbar-logo" />
          <h1>Fuel Station Manager</h1>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/reports" className={`nav-link ${isActive('/reports')}`}>
              Reports
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
