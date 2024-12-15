import React from 'react';
import './Typography.css';

export const Title = ({ children, className = '' }) => (
  <h1 className={`title ${className}`}>{children}</h1>
);

export const Description = ({ children, className = '' }) => (
  <p className={`description ${className}`}>{children}</p>
);

export const StepIndicator = ({ step, totalSteps, className = '' }) => (
  <div className={`step-indicator ${className}`}>
    Step {step}/{totalSteps}
  </div>
);
