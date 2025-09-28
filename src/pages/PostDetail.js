import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getPost(id);
      setPost(response.data.post);
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(id);
        navigate('/my-posts');
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

  if (!post) {
    return (
      <div className="container">
        <div className="card">
          <p>Post not found</p>
        </div>
      </div>
    );
  }

  const isOwner = user && (user.id === post.user_id || user.username === post.username);

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div className="card">
        <div className="card-header">
          <h1>{post.title}</h1>
          <div className="post-meta" style={{ marginTop: '0.5rem' }}>
            <span>By {post.full_name || post.username}</span>
            <span>{post.views} views</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {post.image_url && (
          <img
            src={`http://207.180.241.64:5000${post.image_url}`}
            alt={post.title}
            style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', marginBottom: '1rem' }}
          />
        )}

        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '2rem' }}>
          {post.content}
        </div>

        {/* Contact Information Section */}
        <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
          <h3 className="card-header">Contact Information</h3>
          {post.contact_info ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {post.contact_info}
            </div>
          ) : isSubscribed ? (
            <p>No contact information provided for this post.</p>
          ) : (
            <div className="subscription-banner">
              <h4>Subscribe to View Contact Information</h4>
              <p>This information is only available to subscribed members.</p>
              {!user ? (
                <Link to="/login" className="btn btn-primary">
                  Login to Subscribe
                </Link>
              ) : (
                <Link to="/profile" className="btn btn-warning">
                  View Subscription Options
                </Link>
              )}
            </div>
          )}
        </div>

        {isOwner && (
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostDetail;