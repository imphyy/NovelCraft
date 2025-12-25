export interface Citation {
  sourceType: 'chapter' | 'wiki_page';
  sourceId: string;
  chunkId: string;
  content: string;
  similarity: number;
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
  tokensIn: number;
  tokensOut: number;
}

export interface RewriteResponse {
  originalText: string;
  rewrittenText: string;
  tokensIn: number;
  tokensOut: number;
}

export type RewriteTool =
  | 'rewrite'
  | 'expand'
  | 'tighten'
  | 'dialogue'
  | 'show_vs_tell'
  | 'summarize';

export interface RewriteToolInfo {
  id: RewriteTool;
  label: string;
  description: string;
  icon: string;
}

export const REWRITE_TOOLS: RewriteToolInfo[] = [
  {
    id: 'rewrite',
    label: 'Rewrite',
    description: 'Adjust tone, voice, or style',
    icon: '✏️',
  },
  {
    id: 'expand',
    label: 'Expand',
    description: 'Add detail and depth',
    icon: '🔍',
  },
  {
    id: 'tighten',
    label: 'Tighten',
    description: 'Remove redundancy',
    icon: '✂️',
  },
  {
    id: 'dialogue',
    label: 'Dialogue Variants',
    description: 'Alternative dialogue options',
    icon: '💬',
  },
  {
    id: 'show_vs_tell',
    label: 'Show vs Tell',
    description: 'Convert to scene',
    icon: '🎬',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Concise summary',
    icon: '📝',
  },
];
