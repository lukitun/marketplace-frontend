import React, { useState, useEffect } from 'react';

function Toast({ message, type = 'info', duration = 5000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!visible) return null;

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-show' : ''}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={handleClose}>×</button>
      </div>
    </div>
  );
}

export default Toast;