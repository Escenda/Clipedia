import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "履歴を検索...",
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-12 pr-12 h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
      />
      {value && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};