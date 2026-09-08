import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import {
  ThemeMode,
  Language,
  ActiveView,
  ChatMessage,
  Conversation,
  UserProfile,
  ChatSettings,
} from '../types';
import { translations } from '../i18n/translations';

interface ServerStatus {
  provider: string;
  isDemo: boolean;
  model?: string;
  connected?: boolean;
}

interface AppContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  conversations: Conversation[];
  activeChatId: string | null;
  activeConversation: Conversation | null;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  settings: ChatSettings;
  updateSettings: (partial: Partial<ChatSettings>) => void;
  serverStatus: ServerStatus;
  isGenerating: boolean;
  activeStreamingMessage: string;
  errorMessage: string | null;
  createNewChat: (initialPrompt?: string) => string;
  selectConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  sendMessage: (text: string) => Promise<void>;
  stopGenerating: () => void;
  retryLastMessage: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('wowai_theme') as ThemeMode) || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Language State
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('wowai_lang');
    return saved === 'bn' ? 'bn' : 'en';
  });

  const t = translations[language] || translations.en;

  // View & UI Navigation State
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem('wowai_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      enterToSend: true,
      showTimestamps: true,
      autoScroll: true,
      streamResponse: true,
    };
  });

  // User Profile & Authentication State
  const [user, setUser] = useState<UserProfile>(() => {
    return {
      id: '',
      name: 'Guest',
      email: '',
      avatar: '',
      isAuthenticated: false,
    };
  });

  // Conversations State (strictly isolated)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Streaming & Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStreamingMessage, setActiveStreamingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Server & AI provider status
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    provider: 'BAILU AI',
    isDemo: true,
    model: 'bailu-auto',
  });

  // Check backend provider status on mount
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.provider) {
          setServerStatus({
            provider: data.provider,
            isDemo: Boolean(data.isDemo),
            model: data.model || 'bailu-auto',
            connected: Boolean(data.connected),
          });
        }
      })
      .catch(err => {
        console.warn('Backend status check fallback to demo mode:', err);
      });
  }, []);

  // Helper to get active auth token
  const getAuthToken = useCallback((): string | null => {
    return localStorage.getItem('wowai_token');
  }, []);

  // Fetch conversations for authenticated user from server
  const fetchUserConversations = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list: Conversation[] = Array.isArray(data.conversations) ? data.conversations : [];
        setConversations(list);
        if (list.length > 0) {
          setActiveChatId(list[0].id);
        } else {
          setActiveChatId(null);
        }
      }
    } catch (err) {
      console.warn('Failed to load user conversations from server:', err);
    }
  }, []);

  // Check existing session token on mount
  useEffect(() => {
    const token = localStorage.getItem('wowai_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => (res.ok ? res.json() : Promise.reject('Invalid token')))
        .then(data => {
          if (data && data.user) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              avatar: data.user.avatar,
              isAuthenticated: true,
            });
            fetchUserConversations(token);
          }
        })
        .catch(() => {
          localStorage.removeItem('wowai_token');
          setUser({
            id: '',
            name: 'Guest',
            email: '',
            avatar: '',
            isAuthenticated: false,
          });
          setConversations([]);
          setActiveChatId(null);
        });
    }
  }, [fetchUserConversations]);

  // Login handler
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Login failed' };
        }

        localStorage.setItem('wowai_token', data.token);
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
          isAuthenticated: true,
        });

        await fetchUserConversations(data.token);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error during login' };
      }
    },
    [fetchUserConversations]
  );

  // Signup handler
  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Signup failed' };
        }

        localStorage.setItem('wowai_token', data.token);
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
          isAuthenticated: true,
        });

        // Start with clean empty conversations list
        setConversations([]);
        setActiveChatId(null);

        // Safe preservation of old localStorage data if present
        const oldHistory = localStorage.getItem('wowai_conversations_v1');
        if (oldHistory) {
          try {
            const parsed = JSON.parse(oldHistory);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem('wowai_conversations_backup', oldHistory);
            }
          } catch {}
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error during signup' };
      }
    },
    []
  );

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('wowai_token');
    setUser({
      id: '',
      name: 'Guest',
      email: '',
      avatar: '',
      isAuthenticated: false,
    });
    setConversations([]);
    setActiveChatId(null);
    setIsAuthModalOpen(true);
  }, []);

  // Sync theme with DOM & localStorage
  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('wowai_theme', mode);
  };

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      setResolvedTheme(isDark ? 'dark' : 'light');
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  // Language Switcher
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('wowai_lang', lang);
  };

  // Settings Updater
  const updateSettings = (partial: Partial<ChatSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('wowai_settings', JSON.stringify(next));
      return next;
    });
  };

  // Derive active conversation based strictly on activeChatId
  const activeConversation = conversations.find(c => c.id === activeChatId) || null;

  // Create new isolated chat
  const createNewChat = useCallback(
    (initialPrompt?: string): string => {
      const newId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = initialPrompt
        ? initialPrompt.length > 30
          ? initialPrompt.substring(0, 30) + '...'
          : initialPrompt
        : language === 'bn'
        ? 'নতুন চ্যাট'
        : 'New Chat';

      const newConv: Conversation = {
        id: newId,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setConversations(prev => [newConv, ...prev.filter(c => c.id !== newId)]);
      setActiveChatId(newId);
      setActiveView('chat');
      setIsMobileSidebarOpen(false);

      // Persist to server if authenticated
      const token = getAuthToken();
      if (token) {
        fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: newId, title, messages: [] }),
        }).catch(err => console.warn('Failed to sync new chat to server:', err));
      }

      return newId;
    },
    [language, getAuthToken]
  );

  // Select conversation (switching chat IDs isolates history)
  const selectConversation = useCallback((id: string) => {
    setActiveChatId(id);
    setActiveView('chat');
    setIsMobileSidebarOpen(false);
  }, []);

  // Rename conversation
  const renameConversation = useCallback(
    (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c))
      );

      const token = getAuthToken();
      if (token) {
        fetch(`/api/conversations/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newTitle.trim() }),
        }).catch(err => console.warn('Failed to update title on server:', err));
      }
    },
    [getAuthToken]
  );

  // Delete conversation
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== id);
        if (activeChatId === id) {
          setActiveChatId(filtered[0]?.id || null);
        }
        return filtered;
      });

      const token = getAuthToken();
      if (token) {
        fetch(`/api/conversations/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(err => console.warn('Failed to delete chat on server:', err));
      }
    },
    [activeChatId, getAuthToken]
  );

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveChatId(null);

    const token = getAuthToken();
    if (token) {
      fetch('/api/conversations', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(err => console.warn('Failed to clear chats on server:', err));
    }
  }, [getAuthToken]);

  // Stop active generation
  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  // Send message implementation with streaming SSE and strictly isolated target conversation
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isGenerating) return;

      let targetConvId = activeChatId;
      let existingConv = conversations.find(c => c.id === targetConvId);

      // If no active conversation, create one
      if (!existingConv || !targetConvId) {
        targetConvId = createNewChat(content);
        existingConv = {
          id: targetConvId,
          title: content.length > 30 ? content.substring(0, 30) + '...' : content,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      // Auto-rename chat if it's the first message
      const shouldUpdateTitle =
        existingConv.messages.length === 0 ||
        existingConv.title === 'New Chat' ||
        existingConv.title === 'নতুন চ্যাট';

      const newTitle = shouldUpdateTitle
        ? content.length > 32
          ? content.substring(0, 32) + '...'
          : content
        : existingConv.title;

      // Append user message strictly to target conversation
      const currentMessages = [...existingConv.messages, userMessage];

      setConversations(prev =>
        prev.map(c =>
          c.id === targetConvId
            ? {
                ...c,
                title: newTitle,
                updatedAt: Date.now(),
                messages: currentMessages,
              }
            : c
        )
      );

      // Prepare payload for chat API
      const messagesPayload = currentMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      setIsGenerating(true);
      setActiveStreamingMessage('');
      setErrorMessage(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const streamEndpoint = settings.streamResponse
          ? '/api/chat?stream=true'
          : '/api/chat';

        const response = await fetch(streamEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: messagesPayload,
            language,
            conversationId: targetConvId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed with status ${response.status}`);
        }

        // Handle SSE streaming response
        if (settings.streamResponse && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedText = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed === 'data: [DONE]') {
                break;
              }

              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  if (data.chunk) {
                    accumulatedText += data.chunk;
                    setActiveStreamingMessage(accumulatedText);
                  }
                  if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e: any) {
                  if (e.message && !e.message.includes('JSON')) {
                    throw e;
                  }
                }
              }
            }
          }

          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            role: 'assistant',
            content:
              accumulatedText.trim() ||
              (language === 'bn'
                ? 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।'
                : 'No response generated. Please try again.'),
            timestamp: Date.now(),
          };

          const finalMessages = [...currentMessages, assistantMessage];

          // Strictly update target conversation
          setConversations(prev =>
            prev.map(c =>
              c.id === targetConvId
                ? {
                    ...c,
                    updatedAt: Date.now(),
                    messages: finalMessages,
                  }
                : c
            )
          );

          // Persist to server
          if (token && targetConvId) {
            fetch(`/api/conversations/${targetConvId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: newTitle,
                messages: finalMessages,
              }),
            }).catch(err => console.warn('Failed to sync conversation update:', err));
          }
        } else {
          // Standard JSON response
          const json = await response.json();
          const assistantText = json.response || '';

          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            role: 'assistant',
            content: assistantText,
            timestamp: Date.now(),
          };

          const finalMessages = [...currentMessages, assistantMessage];

          setConversations(prev =>
            prev.map(c =>
              c.id === targetConvId
                ? {
                    ...c,
                    updatedAt: Date.now(),
                    messages: finalMessages,
                  }
                : c
            )
          );

          if (token && targetConvId) {
            fetch(`/api/conversations/${targetConvId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: newTitle,
                messages: finalMessages,
              }),
            }).catch(err => console.warn('Failed to sync conversation update:', err));
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        const errorText = err.message || t.somethingWentWrong;
        setErrorMessage(errorText);

        const errorMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          role: 'assistant',
          content: `${language === 'bn' ? 'ত্রুটি' : 'Error'}: ${errorText}`,
          timestamp: Date.now(),
          isError: true,
        };

        setConversations(prev =>
          prev.map(c =>
            c.id === targetConvId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, errorMsg],
                }
              : c
          )
        );
      } finally {
        setIsGenerating(false);
        setActiveStreamingMessage('');
        abortControllerRef.current = null;
      }
    },
    [activeChatId, conversations, isGenerating, language, settings.streamResponse, createNewChat, getAuthToken, t.somethingWentWrong]
  );

  // Retry last message in the active conversation
  const retryLastMessage = useCallback(async () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const lastUserMsg = [...activeConversation.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant response if error
      setConversations(prev =>
        prev.map(c => {
          if (c.id === activeConversation.id) {
            const filtered = c.messages.filter((_, idx) => idx !== c.messages.length - 1);
            return { ...c, messages: filtered };
          }
          return c;
        })
      );
      await sendMessage(lastUserMsg.content);
    }
  }, [activeConversation, sendMessage]);

  const value: AppContextType = {
    theme,
    setTheme,
    resolvedTheme,
    language,
    setLanguage,
    t,
    activeView,
    setActiveView,
    conversations,
    activeChatId,
    activeConversation,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    user,
    setUser,
    settings,
    updateSettings,
    serverStatus,
    isGenerating,
    activeStreamingMessage,
    errorMessage,
    createNewChat,
    selectConversation,
    renameConversation,
    deleteConversation,
    clearAllConversations,
    sendMessage,
    stopGenerating,
    retryLastMessage,
    login,
    signup,
    logout,
    isAuthModalOpen,
    setIsAuthModalOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
