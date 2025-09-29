import React from 'react';

function LoadingSpinner({ size = 'medium', text = 'Loading...' }) {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner',
    large: 'spinner-large'
  }[size];

  return (
    <div className="loading-container">
      <div className={sizeClass}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;