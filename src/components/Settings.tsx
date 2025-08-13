import React, { useState } from 'react';
import { Settings as SettingsIcon, Monitor, Bell, Keyboard, Download, RefreshCw, Hash } from 'lucide-react';
import { check } from '@tauri-apps/plugin-updater';
import { TagManager } from './TagManager';

interface SettingsProps {
  // 設定の状態を管理するprops（後で実装）
}

export const Settings: React.FC<SettingsProps> = () => {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
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
    
    // 自動更新
    autoUpdate: true,
    checkUpdateOnStartup: true,
  });

  const handleSettingChange = (key: string, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // TODO: 設定を保存する処理を実装
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const update = await check();
      if (update) {
        // Simple confirmation using window.confirm for now
        const yes = window.confirm(
          `新しいバージョン ${update.version} が利用可能です。\n\n更新内容:\n${update.body}\n\n今すぐダウンロードしますか？`
        );
        
        if (yes) {
          // TODO: アップデートのダウンロードとインストール処理
          console.log('Downloading update...');
          // update.downloadAndInstall() を実装
        }
      } else {
        alert('最新バージョンを使用しています。');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      alert('更新の確認中にエラーが発生しました。');
    } finally {
      setCheckingUpdate(false);
    }
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

          {/* タグ管理 */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Hash className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium">タグ管理</h3>
            </div>
            
            <TagManager />
          </section>

          {/* 自動更新 */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Download className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium">自動更新</h3>
            </div>
            
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div>
                <div className="font-medium">自動更新を有効にする</div>
                <div className="text-sm text-gray-500">新しいバージョンが利用可能な場合、自動的にダウンロードして更新</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoUpdate}
                onChange={(e) => handleSettingChange('autoUpdate', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div>
                <div className="font-medium">起動時に更新を確認</div>
                <div className="text-sm text-gray-500">アプリケーション起動時に新しいバージョンをチェック</div>
              </div>
              <input
                type="checkbox"
                checked={settings.checkUpdateOnStartup}
                onChange={(e) => handleSettingChange('checkUpdateOnStartup', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <div className="mt-4 flex justify-center">
              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${checkingUpdate ? 'animate-spin' : ''}`} />
                {checkingUpdate ? '確認中...' : '今すぐ更新を確認'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};