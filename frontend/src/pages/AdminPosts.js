import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllPostsAdmin();
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (postId) => {
    try {
      await adminAPI.togglePostVisibility(postId);
      fetchPosts(); // Refresh the list
    } catch (error) {
      alert('Failed to toggle post visibility');
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const { postsAPI } = await import('../services/api');
        await postsAPI.deletePost(postId);
        fetchPosts(); // Refresh the list
      } catch (error) {
        alert('Failed to delete post');
      }
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
      <h1>Manage Posts</h1>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Views</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.id}</td>
                <td>{post.title}</td>
                <td>
                  {post.username}
                  <small style={{ display: 'block' }}>{post.email}</small>
                </td>
                <td>{post.views}</td>
                <td>
                  <span className={`badge ${post.is_published ? 'badge-success' : 'badge-warning'}`}>
                    {post.is_published ? 'Published' : 'Unpublished'}
                  </span>
                </td>
                <td>{new Date(post.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleToggleVisibility(post.id)}
                      className={`btn ${post.is_published ? 'btn-warning' : 'btn-success'}`}
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    >
                      {post.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="btn btn-danger"
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    >
                      Delete
                    </button>
                    <a
                      href={`/posts/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    >
                      View
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No posts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPosts;