import React, { useState } from 'react';
import { Search, X, Regex } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearchModeChange?: (useRegex: boolean) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearchModeChange,
  placeholder = "履歴を検索...",
}) => {
  const [useRegex, setUseRegex] = useState(false);

  const handleRegexToggle = () => {
    const newMode = !useRegex;
    setUseRegex(newMode);
    onSearchModeChange?.(newMode);
  };
  return (
    <div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-12 pr-20 h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {onSearchModeChange && (
            <Button
              size="icon"
              variant={useRegex ? "default" : "ghost"}
              className={`h-8 w-8 rounded-lg ${
                useRegex 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={handleRegexToggle}
              title="正規表現検索"
            >
              <Regex className="h-4 w-4" />
            </Button>
          )}
          {value && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={() => onChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {useRegex && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          正規表現モード: 例) ^https?:// でURLを検索
        </div>
      )}
    </div>
  );
};