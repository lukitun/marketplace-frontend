import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isSubscribed } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (search = '') => {
    try {
      setLoading(true);
      const response = await postsAPI.getAllPosts({ search });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(searchTerm);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Browse Posts</h1>

      {!isSubscribed && (
        <div className="subscription-banner">
          <h2>Unlock Contact Information</h2>
          <p>Subscribe to view contact information on all posts</p>
          <Link to="/profile" className="btn btn-warning">
            View Subscription Options
          </Link>
        </div>
      )}

      <form onSubmit={handleSearch} className="card">
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <div className="grid">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            {post.image_url && (
              <img
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${post.image_url}`}
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
                <span>By {post.username}</span>
                <span>{post.views} views</span>
              </div>
              <Link to={`/posts/${post.id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p>No posts found. Try a different search term or create the first post!</p>
        </div>
      )}
    </div>
  );
}

export default Home;