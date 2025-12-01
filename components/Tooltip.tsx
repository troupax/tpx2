
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  iconClassName?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, iconClassName }) => {
  const [isVisible, setIsVisible] = useState(false);

  const defaultIconClasses = isVisible ? 'text-brand-primary' : 'text-gray-500 hover:text-brand-primary';
  const finalIconClasses = iconClassName || defaultIconClasses;

  return (
    <div 
      className="relative inline-flex items-center ml-2 align-middle"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
      role="tooltip"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-4 w-4 cursor-help transition-colors ${finalIconClasses}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-xs text-gray-200 rounded-lg shadow-xl border border-gray-700 text-center leading-relaxed animate-fade-in">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};
