import React from 'react';

interface FlashToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
}

const typeStyles: Record<FlashToastProps['type'], string> = {
  success: 'bg-green-600 border-green-800',
  error: 'bg-red-600 border-red-800',
  info: 'bg-blue-600 border-blue-800',
};

const FlashToast: React.FC<FlashToastProps> = ({ type, message }) => {
  return (
    <div
      className={`border-l-4 p-4 text-white rounded shadow ${typeStyles[type]}`}
      role="alert"
    >
      {message}
    </div>
  );
};

export default FlashToast;
