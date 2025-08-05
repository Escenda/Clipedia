import React, { useState, useMemo } from 'react';
import { ClipboardItem as ClipboardItemType } from '../types/clipboard';
import { ClipboardItem } from './ClipboardItem';
import { SearchBar } from './SearchBar';
import { Button } from './Button';
import { Trash2, Pin, Clock, ArrowUpDown } from 'lucide-react';

interface ClipboardHistoryProps {
  items: ClipboardItemType[];
  onCopy: (item: ClipboardItemType) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onAddTag: (id: string, tag: string) => void;
}

export const ClipboardHistory: React.FC<ClipboardHistoryProps> = ({
  items,
  onCopy,
  onPin,
  onDelete,
  onDeleteAll,
  onAddTag,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Pinned filter
    if (showPinnedOnly) {
      filtered = filtered.filter(item => item.isPinned);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      // Pinned items always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by date
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [items, searchQuery, sortOrder, showPinnedOnly]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="flex-shrink-0 space-y-4 p-6 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Clipedia</h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">v0.1.0</span>
        </div>
        
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant={showPinnedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            >
              <Pin className="h-4 w-4 mr-1" />
              ピン留め
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {sortOrder === 'newest' ? '新しい順' : '古い順'}
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteAll}
            disabled={items.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            すべて削除
          </Button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredAndSortedItems.length} / {items.length} 件の履歴
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredAndSortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
            <Clock className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">履歴がありません</p>
            <p className="text-sm mt-2">クリップボードにコピーしたアイテムがここに表示されます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedItems.map((item) => (
              <ClipboardItem
                key={item.id}
                item={item}
                onCopy={onCopy}
                onPin={onPin}
                onDelete={onDelete}
                onAddTag={onAddTag}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};