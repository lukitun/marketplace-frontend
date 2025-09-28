import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const result = await updateProfile(formData);
    if (result.success) {
      setMessage('Profile updated successfully');
      setEditing(false);
    } else {
      setError(result.error || 'Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
      <h1>My Profile</h1>

      {/* Subscription Status Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-header">Subscription Status</h3>
        {user?.is_subscribed ? (
          <div>
            <p className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              Active Subscription
            </p>
            {user.subscription_end && (
              <p style={{ marginTop: '1rem' }}>
                Valid until: {new Date(user.subscription_end).toLocaleDateString()}
              </p>
            )}
            <p style={{ marginTop: '0.5rem' }}>
              You have access to all contact information on posts.
            </p>
          </div>
        ) : (
          <div>
            <p className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              No Active Subscription
            </p>
            <p style={{ marginTop: '1rem' }}>
              Subscribe to view contact information on all posts.
            </p>
            <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
              <strong>How to Subscribe:</strong>
              <p>Contact the administrator to activate your subscription. Once activated, you'll receive an invoice via email.</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Information Card */}
      <div className="card">
        <h3 className="card-header">Profile Information</h3>

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {!editing ? (
          <div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <p>{user?.username}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <p>{user?.email}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <p>{user?.full_name || 'Not provided'}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <p className={`badge ${user?.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>
                {user?.role}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Member Since</label>
              <p>{new Date(user?.created_at).toLocaleDateString()}</p>
            </div>

            <button onClick={() => setEditing(true)} className="btn btn-primary">
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
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
              <label className="form-label">Email</label>
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

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    username: user?.username || '',
                    email: user?.email || '',
                    full_name: user?.full_name || ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;