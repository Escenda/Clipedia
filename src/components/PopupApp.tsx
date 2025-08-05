import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ClipboardItem } from '../types/clipboard';
import { Search, Copy, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const PopupApp: React.FC = () => {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const appWindow = getCurrentWindow();

  // filteredItemsを先に定義
  const filteredItems = items.filter(item =>
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // デバッグ用ログ
    console.log('PopupApp component mounted');
    console.log('Window label:', appWindow.label);
    
    // ウィンドウが準備できるまで少し待機
    const initTimeout = setTimeout(() => {
      setIsReady(true);
      loadItems();
      
      // さらに少し遅延してからフォーカス
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }, 300);
    
    return () => {
      clearTimeout(initTimeout);
    };
  }, []);

  // キーボードイベントハンドラー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        appWindow.close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredItems.length > 0) {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleCopy(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredItems, selectedIndex]);

  // ウィンドウ外クリックで閉じる処理は削除（Rust側でフォーカス管理）

  const loadItems = async () => {
    try {
      const items = await invoke<ClipboardItem[]>('get_clipboard_history');
      const itemsWithDates = items.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      setItems(itemsWithDates.slice(0, 10)); // 最新10件のみ
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const handleCopy = async (item: ClipboardItem) => {
    try {
      await invoke('copy_to_clipboard', { content: item.content });
      await appWindow.close();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!isReady) {
    return (
      <div className="h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div id="popup-container" className="h-screen bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden" style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}>
      {/* 検索バー */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="検索..."
            className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => appWindow.close()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* アイテムリスト */}
      <div className="overflow-y-auto max-h-96">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            履歴がありません
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleCopy(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "px-4 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors",
                index === selectedIndex && "bg-blue-50 dark:bg-blue-900/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {item.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(item.timestamp)}
                    {item.isPinned && " • 📌"}
                  </p>
                </div>
                <Copy className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* フッター */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
        ↑↓ 選択 • Enter コピー • Esc 閉じる
      </div>
    </div>
  );
};