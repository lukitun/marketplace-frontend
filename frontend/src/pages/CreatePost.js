import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function CreatePost() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    contact_info: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setError('');

    // Check if user is logged in
    if (!user) {
      setError('You must be logged in to create a post');
      showError('Please log in to create a post');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Validate form
    if (!formData.title.trim()) {
      setError('Title is required');
      showError('Please enter a title for your post');
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      showError('Please enter content for your post');
      return;
    }

    setLoading(true);

    // Send as JSON
    const postData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      contact_info: formData.contact_info.trim() || ''
    };

    try {
      console.log('Sending post data:', postData);
      const response = await postsAPI.createPost(postData);
      console.log('Response:', response);

      if (response.data?.success) {
        showSuccess('Post created successfully!');
        navigate('/my-posts');
      } else {
        const errorMsg = response.data?.message || 'Failed to create post';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      console.error('Post creation error:', error);
      let errorMessage = 'Failed to create post';

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }

      setError(errorMessage);
      showError(errorMessage);
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

        <div>
          <div className="form-group">
            <label className="form-label">Title*</label>
            <input
              type="text"
              name="title"
              className={`form-control ${error && error.includes('Title') ? 'is-invalid' : ''}`}
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a descriptive title for your post"
              required
            />
            {formData.title && formData.title.length < 3 && (
              <small style={{ color: '#e74c3c' }}>Title should be at least 3 characters</small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Content*</label>
            <textarea
              name="content"
              className={`form-control ${error && error.includes('Content') ? 'is-invalid' : ''}`}
              rows="10"
              value={formData.content}
              onChange={handleChange}
              placeholder="Describe your item or service in detail"
              required
            />
            <small style={{ color: '#666' }}>{formData.content.length} characters</small>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Information</label>
            <textarea
              name="contact_info"
              className="form-control"
              rows="5"
              value={formData.contact_info}
              onChange={handleChange}
              placeholder="Email, phone, address, etc. (Only visible to subscribed members)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image (optional)</label>
            <input
              type="file"
              name="image"
              className="form-control"
              accept="image/*"
              disabled
              title="Image upload is temporarily disabled"
            />
            <small style={{ color: '#e74c3c' }}>Image upload is temporarily disabled. Posts can be created without images.</small>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-success"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              onClick={handleSubmit}
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
        </div>
      </div>
    </div>
  );
}

export default CreatePost;