import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please make sure both passwords are identical.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long for security');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      });

      if (result.success) {
        showSuccess('Registration successful! Welcome to the marketplace.');
        navigate('/');
      } else {
        let errorMessage = 'Registration failed';
        if (result.error) {
          if (result.error.includes('already exists') || result.error.includes('duplicate')) {
            if (result.error.toLowerCase().includes('email')) {
              errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
            } else if (result.error.toLowerCase().includes('username')) {
              errorMessage = 'This username is already taken. Please choose a different username.';
            } else {
              errorMessage = 'An account with this information already exists. Please try different credentials.';
            }
          } else if (result.error.includes('Invalid')) {
            errorMessage = result.error + '. Please check your input and try again.';
          } else {
            errorMessage = result.error;
          }
        }
        setError(errorMessage);
        showError(errorMessage);
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your internet connection and try again.');
      showError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '3rem' }}>
      <div className="card">
        <h2 className="card-header">Register</h2>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username*</label>
            <input
              type="text"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email*</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="full_name"
              className="form-control"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password*</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password*</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;