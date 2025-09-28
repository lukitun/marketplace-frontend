import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

function CreatePost() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    contact_info: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({
        ...formData,
        image: e.target.files[0]
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('content', formData.content);
    data.append('contact_info', formData.contact_info);
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      await postsAPI.createPost(data);
      navigate('/my-posts');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create post');
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
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content*</label>
            <textarea
              name="content"
              className="form-control"
              rows="10"
              value={formData.content}
              onChange={handleChange}
              required
            />
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
              onChange={handleChange}
            />
            <small style={{ color: '#666' }}>Max size: 5MB. Supported formats: JPG, PNG, GIF</small>
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