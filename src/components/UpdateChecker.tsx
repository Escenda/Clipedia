import React, { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';

interface UpdateStatus {
  available: boolean;
  version?: string;
  downloading: boolean;
  progress: number;
  error?: string;
}

export const UpdateChecker: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus>({
    available: false,
    downloading: false,
    progress: 0
  });
  const [showNotification, setShowNotification] = useState(false);

  const checkForUpdates = async () => {
    try {
      const update = await check();
      
      if (update?.available) {
        setStatus({
          available: true,
          version: update.version,
          downloading: false,
          progress: 0
        });
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const downloadAndInstall = async () => {
    try {
      setStatus(prev => ({ ...prev, downloading: true }));
      
      const update = await check();
      if (!update?.available) return;

      // ダウンロード進捗を監視
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            console.log(`Started downloading ${contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            setStatus(prev => ({ ...prev, progress }));
            break;
          case 'Finished':
            setStatus(prev => ({ ...prev, downloading: false, progress: 100 }));
            break;
        }
      });

      // 更新完了後、アプリケーションを再起動
      await relaunch();
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        downloading: false, 
        error: error instanceof Error ? error.message : '更新に失敗しました' 
      }));
    }
  };

  useEffect(() => {
    // 起動時に更新をチェック
    checkForUpdates();
    
    // 1時間ごとに更新をチェック
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!showNotification || !status.available) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {status.error ? (
            <AlertCircle className="h-6 w-6 text-red-500" />
          ) : status.downloading ? (
            <Download className="h-6 w-6 text-blue-500 animate-pulse" />
          ) : (
            <CheckCircle className="h-6 w-6 text-green-500" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {status.downloading ? '更新をダウンロード中...' : '新しいバージョンが利用可能です'}
          </h3>
          
          {status.version && !status.downloading && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              バージョン {status.version} が利用可能です
            </p>
          )}
          
          {status.downloading && (
            <div className="mt-2">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(status.progress)}%
              </p>
            </div>
          )}
          
          {status.error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {status.error}
            </p>
          )}
          
          <div className="flex gap-2 mt-3">
            {!status.downloading && !status.error && (
              <button
                onClick={downloadAndInstall}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                今すぐ更新
              </button>
            )}
            
            <button
              onClick={() => setShowNotification(false)}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {status.downloading ? 'バックグラウンドで続行' : '後で'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};