import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ClipboardItem } from '../types/clipboard';
import { ContentItem } from './ContentItem';
import { cn } from '../lib/utils';

interface ContentAreaProps {
  items: ClipboardItem[];
  onCopy: (item: ClipboardItem) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
}

type FilterType = 'all' | 'text' | 'code' | 'links';

export const ContentArea: React.FC<ContentAreaProps> = ({
  items,
  onCopy,
  onPin,
  onDelete,
  onAddTag,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'text', label: 'TEXT' },
    { id: 'code', label: 'CODE' },
    { id: 'links', label: 'LINKS' },
  ];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'code' && item.content.includes('{')) ||
      (activeFilter === 'links' && item.content.includes('http')) ||
      (activeFilter === 'text' && !item.content.includes('{') && !item.content.includes('http'));
    
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      {/* Search and Filters */}
      <div className="border-b border-gray-100 dark:border-gray-900 p-8">
        <div className="max-w-4xl">
          <div className="relative mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the collection..."
              className="w-full text-lg py-3 pr-4 bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none transition-colors placeholder:text-gray-400 italic"
            />
          </div>
          
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "px-6 py-2 text-sm tracking-wider transition-all",
                  activeFilter === filter.id
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 italic">No items in collection</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <ContentItem
                key={item.id}
                item={item}
                onCopy={onCopy}
                onPin={onPin}
                onDelete={onDelete}
                onAddTag={onAddTag}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};