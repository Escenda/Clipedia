import React from 'react';
import { Copy, Pin, PinOff, Trash2, Tag, Clock } from 'lucide-react';
import { ClipboardItem as ClipboardItemType } from '../types/clipboard';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface ClipboardItemProps {
  item: ClipboardItemType;
  onCopy: (item: ClipboardItemType) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
}

export const ClipboardItem: React.FC<ClipboardItemProps> = ({
  item,
  onCopy,
  onPin,
  onDelete,
  // onAddTag,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 animate-slide-in",
        item.isPinned && "border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatDate(item.timestamp)}</span>
            {item.applicationSource && (
              <>
                <span>•</span>
                <span className="font-medium">{item.applicationSource}</span>
              </>
            )}
          </div>
          <p className="mt-2 text-sm font-mono text-gray-700 dark:text-gray-300 break-all leading-relaxed">
            {truncateContent(item.content)}
          </p>
          {item.tags && item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onCopy(item)}
            title="コピー"
            className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onPin(item.id)}
            title={item.isPinned ? "ピン留めを解除" : "ピン留め"}
            className={cn(
              "hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
              item.isPinned && "text-yellow-600 dark:text-yellow-400"
            )}
          >
            {item.isPinned ? (
              <PinOff className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(item.id)}
            title="削除"
            className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};