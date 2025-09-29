import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { subscriptionAPI } from '../services/api';

function Profile() {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Subscription request state
  const [subscriptionRequests, setSubscriptionRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestForm, setRequestForm] = useState({
    message: '',
    plan: 'monthly'
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

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

  // Load subscription requests
  const loadSubscriptionRequests = async () => {
    if (user?.is_subscribed) return; // Don't load if already subscribed

    setLoadingRequests(true);
    try {
      const response = await subscriptionAPI.getUserRequests();
      setSubscriptionRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error loading subscription requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Submit subscription request
  const handleSubscriptionRequest = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);

    try {
      const response = await subscriptionAPI.requestSubscription(requestForm);
      if (response.data.success) {
        showSuccess('Subscription request submitted successfully! You will receive an email with payment details soon.');
        setRequestForm({ message: '', plan: 'monthly' });
        loadSubscriptionRequests(); // Reload requests
      } else {
        showError(response.data.message || 'Failed to submit subscription request');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Error submitting subscription request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Load requests on component mount
  useEffect(() => {
    loadSubscriptionRequests();
  }, [user?.is_subscribed]);

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

            {/* Subscription Request Form */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4>Request Subscription</h4>
              <form onSubmit={handleSubscriptionRequest} style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Plan</label>
                  <select
                    className="form-control"
                    value={requestForm.plan}
                    onChange={(e) => setRequestForm({ ...requestForm, plan: e.target.value })}
                    required
                  >
                    <option value="monthly">Monthly - $9.99/month</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Message (Optional)</label>
                  <textarea
                    className="form-control"
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    placeholder="Any additional information or special requests..."
                    rows="3"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingRequest}
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>

            {/* Previous Subscription Requests */}
            {subscriptionRequests.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h4>Your Subscription Requests</h4>
                {loadingRequests ? (
                  <p>Loading requests...</p>
                ) : (
                  <div style={{ marginTop: '1rem' }}>
                    {subscriptionRequests.map(request => (
                      <div key={request.id} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p><strong>Plan:</strong> {request.plan.charAt(0).toUpperCase() + request.plan.slice(1)}</p>
                            <p><strong>Status:</strong>
                              <span className={`badge ${
                                request.status === 'approved' ? 'badge-success' :
                                request.status === 'rejected' ? 'badge-danger' :
                                'badge-warning'
                              }`} style={{ marginLeft: '0.5rem' }}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </p>
                            <p><strong>Requested:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                            {request.message && <p><strong>Message:</strong> {request.message}</p>}
                            {request.admin_notes && <p><strong>Admin Notes:</strong> {request.admin_notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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