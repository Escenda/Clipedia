import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ClipboardItem as ClipboardItemType } from '../types/clipboard';
import { ContentItem } from './ContentItem';
import { SearchBar } from './SearchBar';
import { TagFilter } from './TagFilter';
import { cn } from '../lib/utils';

interface ClipboardHistoryProps {
  onCopy: (item: ClipboardItemType) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onAddTag: (id: string, tag: string) => void;
}

type FilterType = 'all' | 'text' | 'code' | 'links';

const ITEMS_PER_PAGE = 50;
const ITEM_HEIGHT = 200; // ContentItemの高さの推定値

export const VirtualizedClipboardHistory: React.FC<ClipboardHistoryProps> = ({
  onCopy,
  onPin,
  onDelete,
  onDeleteAll: _onDeleteAll, // TODO: 全削除機能の実装
  onAddTag,
}) => {
  const [items, setItems] = useState<ClipboardItemType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [useRegex, setUseRegex] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadedPages = useRef(new Set<number>());
  const infiniteLoaderRef = useRef<InfiniteLoader>(null);
  const itemsCache = useRef<Map<number, ClipboardItemType>>(new Map());

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'text', label: 'TEXT' },
    { id: 'code', label: 'CODE' },
    { id: 'links', label: 'LINKS' },
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const count = await invoke<number>('get_total_count');
      setTotalCount(count);
      
      // Load first page
      if (count > 0) {
        const firstPage = await invoke<ClipboardItemType[]>('get_items_paginated', {
          offset: 0,
          limit: ITEMS_PER_PAGE,
        });
        
        // タイムスタンプを Date オブジェクトに変換
        const itemsWithDates = firstPage.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        
        setItems(itemsWithDates);
        itemsWithDates.forEach((item, idx) => {
          itemsCache.current.set(idx, item);
        });
        loadedPages.current.add(0);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  // Client-side filtering (server-side filtering would be better for production)
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchQuery) {
      if (useRegex) {
        try {
          const regex = new RegExp(searchQuery, 'i');
          filtered = filtered.filter(item => regex.test(item.content));
        } catch {
          // Invalid regex, fallback to normal search
          filtered = filtered.filter(item =>
            item.content.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      } else {
        filtered = filtered.filter(item =>
          item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.some(tag => item.tags?.includes(tag))
      );
    }

    // Type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (activeFilter === 'code') return item.tags?.includes('code');
        if (activeFilter === 'links') return item.tags?.includes('url');
        if (activeFilter === 'text') return !item.tags?.includes('code') && !item.tags?.includes('url');
        return true;
      });
    }

    return filtered;
  }, [items, searchQuery, useRegex, selectedTags, activeFilter]);

  // Check if more items need to be loaded
  const isItemLoaded = useCallback((index: number) => {
    return itemsCache.current.has(index);
  }, []);

  // Load more items
  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
    if (isLoading) return;
    
    setIsLoading(true);
    const startPage = Math.floor(startIndex / ITEMS_PER_PAGE);
    const endPage = Math.floor(stopIndex / ITEMS_PER_PAGE);

    try {
      const promises = [];
      for (let page = startPage; page <= endPage; page++) {
        if (!loadedPages.current.has(page)) {
          const offset = page * ITEMS_PER_PAGE;
          promises.push(
            invoke<ClipboardItemType[]>('get_items_paginated', {
              offset,
              limit: ITEMS_PER_PAGE,
            }).then(newItems => ({ page, items: newItems }))
          );
        }
      }

      const results = await Promise.all(promises);
      
      if (results.length > 0) {
        setItems(prevItems => {
          const newItems = [...prevItems];
          results.forEach(({ page, items: pageItems }) => {
            const startIdx = page * ITEMS_PER_PAGE;
            pageItems.forEach((item, idx) => {
              const itemWithDate = {
                ...item,
                timestamp: new Date(item.timestamp)
              };
              const globalIdx = startIdx + idx;
              newItems[globalIdx] = itemWithDate;
              itemsCache.current.set(globalIdx, itemWithDate);
            });
            loadedPages.current.add(page);
          });
          return newItems;
        });
      }
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Handle tag selection
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

  // Handle item updates
  const handlePin = useCallback(async (id: string) => {
    await onPin(id);
    // Update local state
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
    // Update cache
    itemsCache.current.forEach((item, key) => {
      if (item.id === id) {
        itemsCache.current.set(key, { ...item, isPinned: !item.isPinned });
      }
    });
  }, [onPin]);

  const handleDelete = useCallback(async (id: string) => {
    await onDelete(id);
    // Reset and reload data
    await loadInitialData();
  }, [onDelete]);

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = filteredItems[index];
    
    if (!item) {
      return (
        <div style={style} className="px-8">
          <div className="animate-pulse bg-gray-100 dark:bg-gray-900 rounded-lg h-40" />
        </div>
      );
    }

    return (
      <div style={style} className="px-8 py-3">
        <ContentItem
          item={item}
          onCopy={onCopy}
          onPin={handlePin}
          onDelete={handleDelete}
          onAddTag={onAddTag}
        />
      </div>
    );
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

      {/* Content List with Virtual Scrolling */}
      <div className="flex-1">
        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 italic">該当するアイテムがありません</p>
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <InfiniteLoader
                ref={infiniteLoaderRef}
                isItemLoaded={isItemLoaded}
                itemCount={totalCount}
                loadMoreItems={loadMoreItems}
                threshold={10}
              >
                {({ onItemsRendered, ref }) => (
                  <List
                    ref={ref}
                    height={height}
                    width={width}
                    itemCount={filteredItems.length}
                    itemSize={ITEM_HEIGHT}
                    onItemsRendered={onItemsRendered}
                    className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
                  >
                    {Row}
                  </List>
                )}
              </InfiniteLoader>
            )}
          </AutoSizer>
        )}
      </div>
    </>
  );
};