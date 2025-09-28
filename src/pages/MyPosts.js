import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';

function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getUserPosts();
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(id);
        fetchMyPosts(); // Refresh the list
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Posts</h1>
        <Link to="/create-post" className="btn btn-success">
          Create New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>You haven't created any posts yet.</p>
          <Link to="/create-post" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="grid">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              {post.image_url && (
                <img
                  src={`/.netlify/functions/image-proxy${post.image_url}`}
                  alt={post.title}
                  className="post-image"
                />
              )}
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-description">
                  {post.content.substring(0, 150)}...
                </p>
                <div className="post-meta">
                  <span>{post.views} views</span>
                  <span className={`badge ${post.is_published ? 'badge-success' : 'badge-warning'}`}>
                    {post.is_published ? 'Published' : 'Unpublished'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <Link to={`/posts/${post.id}`} className="btn btn-primary">
                    View
                  </Link>
                  <button onClick={() => handleDelete(post.id)} className="btn btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyPosts;