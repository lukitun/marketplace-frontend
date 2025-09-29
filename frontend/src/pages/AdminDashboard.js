import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
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
      <h1>Admin Dashboard</h1>

      {/* Statistics Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{stats?.users?.total_users || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats?.users?.subscribed_users || 0}</div>
          <div className="stat-label">Subscribed Users</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats?.posts?.total_posts || 0}</div>
          <div className="stat-label">Total Posts</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats?.posts?.total_views || 0}</div>
          <div className="stat-label">Total Views</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats?.subscriptions?.active_subscriptions || 0}</div>
          <div className="stat-label">Active Subscriptions</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            ${parseFloat(stats?.subscriptions?.total_revenue || 0).toFixed(2)}
          </div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h3 className="card-header">Recent Activities</h3>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recentActivities?.map((activity) => (
              <tr key={activity.id}>
                <td>{activity.username || 'System'}</td>
                <td>{activity.action}</td>
                <td>{activity.details}</td>
                <td>{new Date(activity.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>No recent activities</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Posts */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 className="card-header">Recent Posts</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recentPosts?.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.username}</td>
                <td>{new Date(post.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!stats?.recentPosts || stats.recentPosts.length === 0) && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>No recent posts</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;