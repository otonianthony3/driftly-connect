import React from 'react';

/**
 * EmptyState component props
 */
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main title text */
  title: string;
  /** Description text explaining the empty state */
  description: string;
  /** Optional label for the action button */
  actionLabel?: string | null;
  /** Optional callback for when the action button is clicked */
  onAction?: (() => void) | null;
  /** Optional icon name to override default icon */
  icon?: 'search' | 'box' | 'alert' | 'filter';
  /** Optional children to render */
  children?: React.ReactNode;
}

/**
 * EmptyState component for displaying when no data is available
 * 
 * @returns {JSX.Element} The empty state component
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel = null,
  onAction = null,
  icon = 'search',
  children,
  ...rest
}) => {
  const icons = {
    search: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 text-gray-300 mb-4"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    ),
    box: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 text-gray-300 mb-4"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.29 7 12 12 20.71 7"></polyline>
        <line x1="12" y1="22" x2="12" y2="12"></line>
      </svg>
    ),
    alert: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 text-gray-300 mb-4"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    ),
    filter: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 text-gray-300 mb-4"
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
      </svg>
    )
  };

  const selectedIcon = icons[icon] || icons.search;

  return (
    <div 
      className="flex flex-col items-center justify-center py-12 text-center"
      {...rest}
    >
      {selectedIcon}
      
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-4 max-w-md">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          type="button"
        >
          {actionLabel}
        </button>
      )}
      
      {children}
    </div>
  );
};

export default EmptyState;