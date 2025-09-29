import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!title || !content) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const postData = { title, content, contact_info: contactInfo };
      console.log('Sending post data:', postData);
      const response = await postsAPI.createPost(postData);

      showSuccess('Post created successfully!');
      navigate('/my-posts');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create post';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
      <div className="card">
        <h2 className="card-header">Create New Post</h2>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title*</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content*</label>
            <textarea
              name="content"
              className="form-control"
              rows="10"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Information</label>
            <textarea
              name="contact_info"
              className="form-control"
              rows="3"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Email, phone, etc. (visible to subscribers only)"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => navigate('/my-posts')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;