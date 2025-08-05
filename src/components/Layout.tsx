import React from 'react';
import { Archive, Clock, Heart, Home, Moon, Sun, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  stats: {
    total: number;
    today: number;
    curated: number;
    recent: number;
    archive: number;
  };
  activeSection: 'collection' | 'curated' | 'recent' | 'archive' | 'settings';
  onSectionChange: (section: 'collection' | 'curated' | 'recent' | 'archive' | 'settings') => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  stats,
  activeSection,
  onSectionChange,
}) => {
  const { theme, toggleTheme } = useTheme();
  const navItems = [
    { id: 'collection', label: 'Collection', count: stats.total, icon: Home },
    { id: 'curated', label: 'Curated', count: stats.curated, icon: Heart },
    { id: 'recent', label: 'Recent', count: stats.recent, icon: Clock },
    { id: 'archive', label: 'Archive', count: stats.archive, icon: Archive },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-100 dark:border-gray-900 flex flex-col">
        {/* Logo */}
        <div className="p-8 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-wider">CLIPEDIA</h1>
              <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Est. MMXXIV</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600" />
              ) : (
                <Sun className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id as any)}
              className={cn(
                "w-full flex items-center justify-between py-4 px-2 text-left transition-colors",
                activeSection === item.id
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              <span className="text-lg">{item.label}</span>
              <span className="text-sm text-gray-400 tabular-nums">{item.count}</span>
            </button>
          ))}
          
          {/* Settings - separate from other items */}
          <div className="border-t border-gray-100 dark:border-gray-900 mt-4 pt-4">
            <button
              onClick={() => onSectionChange('settings')}
              className={cn(
                "w-full flex items-center justify-between py-4 px-2 text-left transition-colors",
                activeSection === 'settings'
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <span className="text-lg">Settings</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Stats */}
        <div className="p-8 border-t border-gray-100 dark:border-gray-900">
          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Acquisitions</p>
              <p className="text-5xl font-light tabular-nums">{stats.total}</p>
              <p className="text-sm text-gray-500 italic">lifetime collection</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Today</p>
              <p className="text-5xl font-light tabular-nums">{stats.today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};