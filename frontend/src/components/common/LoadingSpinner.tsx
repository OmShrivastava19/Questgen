import React from 'react';

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ size = 12, className = '' }) => {
  const sizeClasses = `h-${size} w-${size}`;
  return <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses} ${className}`} />;
};

export default LoadingSpinner;
