import React from 'react';
import { X } from 'lucide-react';

interface TagBadgeProps {
  tag: string;
  color?: string;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const TagBadge: React.FC<TagBadgeProps> = ({ 
  tag, 
  color = '#6B7280', 
  onRemove, 
  onClick,
  size = 'sm' 
}) => {
  const getTagIcon = () => {
    if (tag === 'url') return '🔗';
    if (tag === 'code') return '💻';
    if (tag === 'json') return '📋';
    if (tag === 'markdown') return '📝';
    if (tag === 'email') return '✉️';
    if (tag === 'phone') return '📞';
    if (tag === 'path') return '📁';
    if (tag.startsWith('code:')) return '🔧';
    return null;
  };

  const icon = getTagIcon();
  const displayName = tag.startsWith('code:') ? tag.replace('code:', '') : tag;
  
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses} rounded-full font-medium transition-all hover:brightness-110 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ 
        backgroundColor: color + '20',
        color: color,
        border: `1px solid ${color}40`
      }}
      onClick={onClick}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {displayName}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};