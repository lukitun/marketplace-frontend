import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Marketplace
        </Link>

        <div className="navbar-nav">
          <Link to="/">Browse Posts</Link>

          {user ? (
            <>
              <Link to="/create-post">Create Post</Link>
              <Link to="/my-posts">My Posts</Link>
              <Link to="/profile">Profile</Link>

              {isAdmin && (
                <>
                  <Link to="/admin">Admin Dashboard</Link>
                  <Link to="/admin/users">Manage Users</Link>
                  <Link to="/admin/posts">Manage Posts</Link>
                </>
              )}

              <button onClick={handleLogout} className="btn btn-danger">
                Logout
              </button>

              {user.is_subscribed && (
                <span className="badge badge-success">Subscribed</span>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-success">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;