import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Monitor, Bell, Keyboard } from 'lucide-react';

interface SettingsProps {
  // 設定の状態を管理するprops（後で実装）
}

export const Settings: React.FC<SettingsProps> = () => {
  const [settings, setSettings] = useState({
    // 起動時の動作
    startMinimized: false,
    startWithSystem: false,
    rememberLastState: true,
    
    // トレイの動作
    minimizeToTray: true,
    closeToTray: true,
    
    // 通知設定
    showNotifications: true,
    
    // クリップボード監視
    monitoringEnabled: true,
    maxHistorySize: 1000,
  });

  const handleSettingChange = (key: string, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // TODO: 設定を保存する処理を実装
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-light mb-2">設定</h2>
          <p className="text-gray-500">アプリケーションの動作をカスタマイズ</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8 max-w-2xl">
          {/* 起動時の動作 */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium">起動時の動作</h3>
            </div>
            
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div>
                <div className="font-medium">起動時にトレイに最小化</div>
                <div className="text-sm text-gray-500">アプリケーション起動時にウィンドウを表示せず、トレイアイコンのみ表示</div>
              </div>
              <input
                type="checkbox"
                checked={settings.startMinimized}
                onChange={(e) => handleSettingChange('startMinimized', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div>
                <div className="font-medium">システム起動時に自動起動</div>
                <div className="text-sm text-gray-500">Windows/Mac/Linux起動時にClipediaを自動的に起動</div>
              </div>
              <input
                type="checkbox"
                checked={settings.startWithSystem}
                onChange={(e) => handleSettingChange('startWithSystem', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div>
                <div className="font-medium">最後の状態を記憶</div>
                <div className="text-sm text-gray-500">前回終了時の状態（ウィンドウ表示/トレイ）を記憶して復元</div>
              </div>
              <input
                type="checkbox"
                checked={settings.rememberLastState}
                onChange={(e) => handleSettingChange('rememberLastState', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </section>

          {/* トレイの動作 */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium">トレイの動作</h3>
            </div>
            
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div>
                <div className="font-medium">最小化時にトレイに格納</div>
                <div className="text-sm text-gray-500">ウィンドウを最小化した時にタスクバーではなくトレイに格納</div>
              </div>
              <input
                type="checkbox"
                checked={settings.minimizeToTray}
                onChange={(e) => handleSettingChange('minimizeToTray', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div>
                <div className="font-medium">閉じるボタンでトレイに最小化</div>
                <div className="text-sm text-gray-500">✕ボタンを押してもアプリを終了せず、トレイに最小化</div>
              </div>
              <input
                type="checkbox"
                checked={settings.closeToTray}
                onChange={(e) => handleSettingChange('closeToTray', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </section>

          {/* 通知設定 */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium">通知設定</h3>
            </div>
            
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div>
                <div className="font-medium">新しいアイテムの通知を表示</div>
                <div className="text-sm text-gray-500">クリップボードに新しいアイテムがコピーされた時に通知を表示</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(e) => handleSettingChange('showNotifications', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </section>

          {/* ショートカット */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Keyboard className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium">キーボードショートカット</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <div className="font-medium">クイックアクセス</div>
                  <div className="text-sm text-gray-500">ポップアップウィンドウを表示</div>
                </div>
                <kbd className="px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded">Alt + Z</kbd>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};