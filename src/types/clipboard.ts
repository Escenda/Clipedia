export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  isPinned: boolean;
  tags?: string[];
  applicationSource?: string;
}

export interface ClipboardHistoryState {
  items: ClipboardItem[];
  searchQuery: string;
  selectedTags: string[];
  sortOrder: 'newest' | 'oldest' | 'mostUsed';
}