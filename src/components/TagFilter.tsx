import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TagBadge } from './TagBadge';
import { Plus, Filter } from 'lucide-react';

interface TagFilterProps {
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onTagDeselect: (tag: string) => void;
  onCreateTag?: () => void;
}

interface TagInfo {
  name: string;
  color: string | null;
  isSystem: boolean;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  selectedTags,
  onTagSelect,
  onTagDeselect,
  onCreateTag
}) => {
  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await invoke<[string, string | null, boolean][]>('get_all_tags');
      setAllTags(tags.map(([name, color, isSystem]) => ({
        name,
        color,
        isSystem
      })));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleTagClick = (tag: TagInfo) => {
    if (selectedTags.includes(tag.name)) {
      onTagDeselect(tag.name);
    } else {
      onTagSelect(tag.name);
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="h-4 w-4" />
        <span>タグフィルター</span>
        {selectedTags.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {selectedTags.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[250px] z-10">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allTags.map((tag) => (
              <div
                key={tag.name}
                onClick={() => handleTagClick(tag)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTags.includes(tag.name)
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <TagBadge
                  tag={tag.name}
                  color={tag.color || '#6B7280'}
                  size="md"
                />
                {selectedTags.includes(tag.name) && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
            ))}
          </div>
          
          {onCreateTag && (
            <button
              onClick={() => {
                setShowDropdown(false);
                onCreateTag();
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              新しいタグを作成
            </button>
          )}
        </div>
      )}

      {selectedTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => {
            const tagInfo = allTags.find(t => t.name === tag);
            return (
              <TagBadge
                key={tag}
                tag={tag}
                color={tagInfo?.color || '#6B7280'}
                onRemove={() => onTagDeselect(tag)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};