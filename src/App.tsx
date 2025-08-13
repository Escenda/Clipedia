import { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { ContentArea } from './components/ContentArea';
import { Settings } from './components/Settings';
import { UpdateChecker } from './components/UpdateChecker';
import { VirtualizedClipboardHistory } from './components/VirtualizedClipboardHistory';
import { ClipboardItem } from './types/clipboard';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

function App() {
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'collection' | 'curated' | 'recent' | 'archive' | 'settings'>('collection');
  const [useVirtualScroll] = useState(true); // デフォルトで仮想スクロールを使用

  const loadClipboardHistory = async () => {
    try {
      const items = await invoke<ClipboardItem[]>('get_clipboard_history');
      // Convert timestamp strings to Date objects
      const itemsWithDates = items.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      setClipboardItems(itemsWithDates);
    } catch (error) {
      console.error('Failed to load clipboard history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClipboardHistory();
    
    // Refresh every 2 seconds
    const interval = setInterval(async () => {
      await loadClipboardHistory();
      // トレイメニューも更新
      try {
        await invoke('update_tray_menu');
      } catch (error) {
        console.error('Failed to update tray menu:', error);
      }
    }, 2000);
    
    // Listen for switch-to-settings event from tray menu
    const unlisten = listen('switch-to-settings', () => {
      setActiveSection('settings');
    });
    
    // Handle hash change for navigation
    const handleHashChange = () => {
      if (window.location.hash === '#settings') {
        setActiveSection('settings');
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash
    
    return () => {
      clearInterval(interval);
      unlisten.then(fn => fn());
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleCopy = async (item: ClipboardItem) => {
    try {
      await invoke('copy_to_clipboard', { content: item.content });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handlePin = async (id: string) => {
    const item = clipboardItems.find(i => i.id === id);
    if (!item) return;

    try {
      await invoke('pin_item', { id, isPinned: !item.isPinned });
      await loadClipboardHistory();
    } catch (error) {
      console.error('Failed to pin item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await invoke('delete_item', { id });
      await loadClipboardHistory();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('すべての履歴を削除しますか？')) {
      try {
        await invoke('delete_all_items');
        await loadClipboardHistory();
      } catch (error) {
        console.error('Failed to delete all items:', error);
      }
    }
  };

  const handleAddTag = async (id: string, tag: string) => {
    try {
      await invoke('add_tag', { itemId: id, tag });
      await loadClipboardHistory();
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      total: clipboardItems.length,
      today: clipboardItems.filter(item => new Date(item.timestamp) >= today).length,
      curated: clipboardItems.filter(item => item.isPinned).length,
      recent: clipboardItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return itemDate >= dayAgo;
      }).length,
      archive: clipboardItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate < weekAgo;
      }).length,
    };
  }, [clipboardItems]);

  const filteredItems = useMemo(() => {
    switch (activeSection) {
      case 'curated':
        return clipboardItems.filter(item => item.isPinned);
      case 'recent':
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return clipboardItems.filter(item => new Date(item.timestamp) >= dayAgo);
      case 'archive':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return clipboardItems.filter(item => new Date(item.timestamp) < weekAgo);
      case 'settings':
        return []; // 設定画面では使用しない
      default:
        return clipboardItems;
    }
  }, [clipboardItems, activeSection]);

  if (loading) {
    return (
      <div className="h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 italic">読み込み中...</div>
      </div>
    );
  }

  return (
    <>
      <Layout
        stats={stats}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        {activeSection === 'settings' ? (
          <Settings />
        ) : useVirtualScroll && activeSection === 'collection' ? (
          <VirtualizedClipboardHistory
            onCopy={handleCopy}
            onPin={handlePin}
            onDelete={handleDelete}
            onDeleteAll={handleDeleteAll}
            onAddTag={handleAddTag}
          />
        ) : (
          <ContentArea
            items={filteredItems}
            onCopy={handleCopy}
            onPin={handlePin}
            onDelete={handleDelete}
            onAddTag={handleAddTag}
          />
        )}
      </Layout>
      <UpdateChecker />
    </>
  );
}

export default App;
