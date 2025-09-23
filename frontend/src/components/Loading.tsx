import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'medium', 
  text = 'Loading...', 
  overlay = false 
}) => {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  };

  const content = (
    <div className={`loading ${sizeClasses[size]}`}>
      <div className="loading-spinner"></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
