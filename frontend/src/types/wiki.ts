export type WikiPageType = 'character' | 'location' | 'event' | 'concept' | 'item' | 'faction';

export interface WikiPage {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  content: string;
  pageType: WikiPageType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Backlink {
  sourceType: 'wiki_page' | 'chapter';
  sourceId: string;
  sourceTitle: string;
  createdAt: string;
}

export interface Mention {
  chapterId: string;
  chapterTitle: string;
  createdAt: string;
}

export const WIKI_PAGE_TYPES: { value: WikiPageType; label: string; icon: string }[] = [
  { value: 'character', label: 'Character', icon: '👤' },
  { value: 'location', label: 'Location', icon: '📍' },
  { value: 'event', label: 'Event', icon: '📅' },
  { value: 'concept', label: 'Concept', icon: '💡' },
  { value: 'item', label: 'Item', icon: '⚔️' },
  { value: 'faction', label: 'Faction', icon: '⚡' },
];
