import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    duration_months: 1,
    amount: 0,
    send_invoice: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionToggle = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    setSubscriptionData({
      duration_months: 1,
      amount: 0,
      send_invoice: false
    });
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;

    try {
      const data = {
        is_subscribed: !selectedUser.is_subscribed,
        ...subscriptionData
      };

      await adminAPI.updateUserSubscription(selectedUser.id, data);
      setShowModal(false);
      fetchUsers(); // Refresh the list
      alert(`Subscription ${data.is_subscribed ? 'activated' : 'deactivated'} successfully${data.send_invoice ? ' and invoice sent' : ''}`);
    } catch (error) {
      alert('Failed to update subscription');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h1>Manage Users</h1>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Subscription</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.full_name || '-'}</td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.is_subscribed ? 'badge-success' : 'badge-warning'}`}>
                    {user.is_subscribed ? 'Active' : 'Inactive'}
                  </span>
                  {user.subscription_end && (
                    <small style={{ display: 'block', marginTop: '0.25rem' }}>
                      Until: {new Date(user.subscription_end).toLocaleDateString()}
                    </small>
                  )}
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleSubscriptionToggle(user)}
                      className={`btn ${user.is_subscribed ? 'btn-danger' : 'btn-success'}`}
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    >
                      {user.is_subscribed ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Subscription Modal */}
      {showModal && selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {selectedUser.is_subscribed ? 'Deactivate' : 'Activate'} Subscription
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <p>
              User: <strong>{selectedUser.username} ({selectedUser.email})</strong>
            </p>

            {!selectedUser.is_subscribed && (
              <>
                <div className="form-group">
                  <label className="form-label">Duration (months)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={subscriptionData.duration_months}
                    onChange={(e) => setSubscriptionData({
                      ...subscriptionData,
                      duration_months: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    step="0.01"
                    value={subscriptionData.amount}
                    onChange={(e) => setSubscriptionData({
                      ...subscriptionData,
                      amount: parseFloat(e.target.value)
                    })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={subscriptionData.send_invoice}
                      onChange={(e) => setSubscriptionData({
                        ...subscriptionData,
                        send_invoice: e.target.checked
                      })}
                    />
                    Send invoice email to user
                  </label>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={handleUpdateSubscription} className="btn btn-primary">
                Confirm
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-danger">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;