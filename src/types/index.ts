export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'bn';
export type ActiveView = 'landing' | 'chat' | 'privacy' | 'terms' | 'about';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isError?: boolean;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  userId?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  isAuthenticated: boolean;
}

export interface ChatSettings {
  enterToSend: boolean;
  showTimestamps: boolean;
  autoScroll: boolean;
  streamResponse: boolean;
}

export interface SuggestionPrompt {
  id: string;
  icon: string;
  categoryEn: string;
  categoryBn: string;
  titleEn: string;
  titleBn: string;
  promptEn: string;
  promptBn: string;
}
