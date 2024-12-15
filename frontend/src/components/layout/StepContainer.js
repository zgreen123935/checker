import React from 'react';
import './StepContainer.css';

const StepContainer = ({ children, className = '' }) => {
  return (
    <div className={`step-container ${className}`}>
      {children}
    </div>
  );
};

export default StepContainer;
