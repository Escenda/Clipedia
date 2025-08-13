import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { TagBadge } from './TagBadge';
import { cn } from '../lib/utils';

interface TagInfo {
  name: string;
  color: string | null;
  isSystem: boolean;
}

export const TagManager: React.FC = () => {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EF4444', // red
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6', // teal
    '#F97316', // orange
    '#6B7280', // gray
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tagsData = await invoke<[string, string | null, boolean][]>('get_all_tags');
      setTags(tagsData.map(([name, color, isSystem]) => ({
        name,
        color,
        isSystem
      })));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setLoading(true);
    try {
      await invoke('create_custom_tag', {
        name: newTagName.trim(),
        color: newTagColor
      });
      await loadTags();
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('タグの作成に失敗しました。同じ名前のタグが既に存在する可能性があります。');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateColor = async (name: string, color: string) => {
    setLoading(true);
    try {
      await invoke('update_tag_color', { name, color });
      await loadTags();
      setEditingTag(null);
    } catch (error) {
      console.error('Failed to update tag color:', error);
      alert('タグの色の更新に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (name: string) => {
    if (!window.confirm(`タグ「${name}」を削除しますか？`)) return;

    setLoading(true);
    try {
      await invoke('delete_custom_tag', { name });
      await loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('タグの削除に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const systemTags = tags.filter(tag => tag.isSystem);
  const customTags = tags.filter(tag => !tag.isSystem);

  return (
    <div className="space-y-6">
      {/* カスタムタグセクション */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">カスタムタグ</h4>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
            新規作成
          </button>
        </div>

        {/* 新規作成フォーム */}
        {showCreateForm && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  タグ名
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="例: 重要、プロジェクトA、TODO"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  色
                </label>
                <div className="flex gap-2 mb-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-lg transition-all",
                        newTagColor === color && "ring-2 ring-offset-2 ring-blue-500"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTagName('');
                    setNewTagColor('#3B82F6');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || loading}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* カスタムタグ一覧 */}
        <div className="space-y-2">
          {customTags.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              カスタムタグはまだありません
            </p>
          ) : (
            customTags.map((tag) => (
              <div
                key={tag.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {editingTag === tag.name ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingColor}
                        onChange={(e) => setEditingColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <button
                        onClick={() => handleUpdateColor(tag.name, editingColor)}
                        disabled={loading}
                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingTag(null)}
                        className="p-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <TagBadge
                      tag={tag.name}
                      color={tag.color || '#6B7280'}
                      size="md"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTag(tag.name);
                      setEditingColor(tag.color || '#6B7280');
                    }}
                    className="p-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.name)}
                    disabled={loading}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* システムタグセクション */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">システムタグ</h4>
        <div className="space-y-2">
          {systemTags.map((tag) => (
            <div
              key={tag.name}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <TagBadge
                tag={tag.name}
                color={tag.color || '#6B7280'}
                size="md"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                自動付与
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};