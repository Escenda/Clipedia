import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ClipboardItem } from '../types/clipboard';
import { ContentItem } from './ContentItem';
import { SearchBar } from './SearchBar';
import { TagFilter } from './TagFilter';
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
  const [useRegex, setUseRegex] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [displayItems, setDisplayItems] = useState<ClipboardItem[]>(items);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'text', label: 'TEXT' },
    { id: 'code', label: 'CODE' },
    { id: 'links', label: 'LINKS' },
  ];

  useEffect(() => {
    performSearch();
  }, [searchQuery, useRegex, selectedTags, activeFilter, items]);

  const performSearch = async () => {
    try {
      let filteredItems = items;

      // 検索クエリがある場合
      if (searchQuery) {
        if (useRegex) {
          // 正規表現検索
          const searchResults = await invoke<ClipboardItem[]>('search_items', {
            pattern: searchQuery,
            useRegex: true
          });
          filteredItems = searchResults;
        } else {
          // 通常検索
          filteredItems = items.filter(item => 
            item.content.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      }

      // タグフィルター
      if (selectedTags.length > 0) {
        filteredItems = filteredItems.filter(item =>
          selectedTags.some(tag => item.tags?.includes(tag))
        );
      }

      // タイプフィルター
      if (activeFilter !== 'all') {
        filteredItems = filteredItems.filter(item => {
          if (activeFilter === 'code') return item.tags?.includes('code');
          if (activeFilter === 'links') return item.tags?.includes('url');
          if (activeFilter === 'text') return !item.tags?.includes('code') && !item.tags?.includes('url');
          return true;
        });
      }

      setDisplayItems(filteredItems);
    } catch (error) {
      console.error('Search error:', error);
      setDisplayItems(items);
    }
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => [...prev, tag]);
  };

  const handleTagDeselect = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleCreateTag = () => {
    // 設定画面のタグ管理セクションに移動
    window.location.hash = '#settings';
  };

  return (
    <>
      {/* Search and Filters */}
      <div className="border-b border-gray-100 dark:border-gray-900 p-8">
        <div className="max-w-4xl">
          <div className="mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearchModeChange={setUseRegex}
              placeholder="コレクションを検索..."
            />
          </div>
          
          <div className="mb-6">
            <TagFilter
              selectedTags={selectedTags}
              onTagSelect={handleTagSelect}
              onTagDeselect={handleTagDeselect}
              onCreateTag={handleCreateTag}
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
          {displayItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 italic">該当するアイテムがありません</p>
            </div>
          ) : (
            displayItems.map((item) => (
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