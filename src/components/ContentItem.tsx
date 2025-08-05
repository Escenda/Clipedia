import React from 'react';
import { Copy, Pin, PinOff, Trash2, ExternalLink } from 'lucide-react';
import { ClipboardItem as ClipboardItemType } from '../types/clipboard';
import { cn } from '../lib/utils';

interface ContentItemProps {
  item: ClipboardItemType;
  onCopy: (item: ClipboardItemType) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
}

export const ContentItem: React.FC<ContentItemProps> = ({
  item,
  onCopy,
  onPin,
  onDelete,
  onAddTag,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date).replace(' at ', ', ');
  };

  const getContentType = (content: string) => {
    if (content.includes('http')) return 'LINK';
    if (content.includes('{') || content.includes('function') || content.includes('const')) return 'CODE';
    return 'TEXT';
  };

  const contentType = getContentType(item.content);

  return (
    <div className="group border-b border-gray-100 dark:border-gray-900 pb-6 last:border-0">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400 italic">
            {formatDate(item.timestamp)}
          </div>
          {item.isPinned && (
            <Pin className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          )}
        </div>
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs uppercase tracking-wider text-gray-400 mr-2">
            {contentType}
          </span>
          <button
            onClick={() => onCopy(item)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Copy"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPin(item.id)}
            className={cn(
              "transition-colors",
              item.isPinned 
                ? "text-yellow-600 dark:text-yellow-400" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            )}
            title={item.isPinned ? "Unpin" : "Pin"}
          >
            {item.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className={cn(
        "font-mono text-sm leading-relaxed",
        contentType === 'CODE' ? "bg-gray-50 dark:bg-gray-900 p-4 rounded" : ""
      )}>
        {item.content}
      </div>

      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex gap-2">
          {item.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs uppercase tracking-wider text-gray-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};