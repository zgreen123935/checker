import React from 'react';
import './ContentLayout.css';

const ContentLayout = ({ children, spacing = 'default', className = '' }) => {
  return (
    <div className={`content-layout spacing-${spacing} ${className}`}>
      {children}
    </div>
  );
};

export default ContentLayout;
