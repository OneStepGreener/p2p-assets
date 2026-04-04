/**
 * Error Message Component
 * Enterprise-level error display component
 */

import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between ${className}`}
      role="alert"
    >
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-red-600 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-red-800 font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 text-sm text-red-600 hover:text-red-800 font-semibold underline"
        >
          Retry
        </button>
      )}
    </div>
  );
};
