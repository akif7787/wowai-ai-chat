import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
}

const AppContext = createContext<AppContextType | null>(null);

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Explain quantum computing',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Explain quantum computing simply with an analogy.',
        timestamp: Date.now() - 3600000 * 24,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `### Quantum Computing, Explained Simply

Imagine a library with millions of books.

- **A classical computer** is like an extremely fast librarian who reads every single book one by one in sequence to find an answer.
- **A quantum computer** uses **qubits** to check thousands of books simultaneously using two core principles:

1. **Superposition**: Unlike a standard bit that is strictly **0 or 1**, a qubit can exist in a combination of states simultaneously until read.
2. **Entanglement**: Qubits can become linked, meaning what happens to one instantly informs the other.

\`\`\`text
Classical Bit:  [ 0 ] or [ 1 ]
Quantum Qubit:  [ 0 & 1 simultaneously ]
\`\`\`

> **Key takeaway**: Quantum computers aren't designed to replace phones or personal laptops; they are engineered for massive combinatorial challenges like drug discovery, material science, and global logistics.`,
        timestamp: Date.now() - 3600000 * 24 + 2000,
      }
    ]
  },
  {
    id: 'conv-2',
    title: 'Build a React app',
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'Help me build a clean React custom hook for handling localStorage persistence.',
        timestamp: Date.now() - 3600000 * 12,
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `Here is a lightweight, type-safe custom hook for persistent \`localStorage\` state:

\`\`\`typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(\`Error setting localStorage key "\${key}":\`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
\`\`\`

### Why this pattern works:
- **Lazy Initialization**: Parses storage only on first render.
- **JSON Serialization**: Automatically serializes and deserializes objects, arrays, and primitives.
- **Graceful Fallbacks**: Prevents crashes if storage is full or restricted.`,
        timestamp: Date.now() - 3600000 * 12 + 3000,
      }
    ]
  },
  {
    id: 'conv-3',
    title: 'Cybersecurity roadmap',
    createdAt: Date.now() - 3600000 * 6,
    updatedAt: Date.now() - 3600000 * 6,
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'What is a realistic roadmap to get started in cybersecurity?',
        timestamp: Date.now() - 3600000 * 6,
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: `### Practical Cybersecurity Roadmap

A clear path from fundamentals to job-ready skills:

1. **Foundations (Weeks 1–6)**
   - Computer Networking (OSI model, TCP/IP, DNS, Subnets)
   - Linux Terminal Mastery & Bash scripting
   - Web Architecture (HTTP headers, cookies, REST APIs)

2. **Core Security Knowledge (Weeks 7–14)**
   - OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, SSRF)
   - Cryptography basics (Symmetric vs. Asymmetric, Hashing)
   - Threat Modeling & Identity Management

3. **Hands-On Practice (Ongoing)**
   - Solve beginner rooms on **TryHackMe** and **PortSwigger Web Security Academy**
   - Packet inspection with **Wireshark**

Stay consistent with hands-on labs rather than just reading theory!`,
        timestamp: Date.now() - 3600000 * 6 + 2500,
      }
    ]
  },
  {
    id: 'conv-4',
    title: 'IELTS practice',
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
    messages: [
      {
        id: 'msg-7',
        role: 'user',
        content: 'Give me tips for scoring 7.5+ in IELTS Writing Task 2.',
        timestamp: Date.now() - 3600000 * 3,
      },
      {
        id: 'msg-8',
        role: 'assistant',
        content: `### Key Strategies for IELTS Writing Task 2 (Band 7.5+)

1. **Task Achievement**
   - Answer **every part** of the prompt directly.
   - Have a clear, unambiguous thesis statement in your introduction.

2. **Coherence & Cohesion**
   - Use 4 paragraphs: *Introduction, Body 1, Body 2, Conclusion*.
   - Ensure each body paragraph explores **one central idea** supported with a realistic example.

3. **Lexical Resource**
   - Use precise, natural collocations (*e.g., "address pressing issues", "foster economic growth"*) rather than forcing obscure archaic words.

4. **Grammatical Range & Accuracy**
   - Balance compound and complex sentences (*e.g., relative clauses, conditionals*), ensuring minimal punctuation errors.`,
        timestamp: Date.now() - 3600000 * 3 + 2000,
      }
    ]
  },
  {
    id: 'conv-5',
    title: 'Python debugging',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'msg-9',
        role: 'user',
        content: 'How do I profile and debug a slow Python script effectively?',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'msg-10',
        role: 'assistant',
        content: `Here are the top three tools to pinpoint Python bottlenecks:

1. **cProfile** (Built-in standard library):
\`\`\`bash
python -m cProfile -s tottime your_script.py
\`\`\`

2. **Line Profiler** (Functions with line-by-line timing):
\`\`\`python
# Decorate target function with @profile
@profile
def compute_heavy_task(data):
    results = [x ** 2 for x in data]
    return results
\`\`\`

3. **Py-Spy** (Zero-overhead sampling profiler that generates flame graphs without modifying source code):
\`\`\`bash
py-spy record -o flamegraph.svg -- python your_script.py
\`\`\``,
        timestamp: Date.now() - 3600000 + 2000,
      }
    ]
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  // Theme state
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('wowai_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Language state
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('wowai_lang');
    if (saved === 'bn' || saved === 'en') return saved;
    return 'en';
  });

  // Navigation / View
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // User Profile
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('wowai_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      name: 'Ahanaf Akif',
      email: 'akif7787@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isAuthenticated: true,
    };
  });

  // Settings
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem('wowai_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      enterToSend: true,
      showTimestamps: true,
      autoScroll: true,
      streamResponse: true,
    };
  });

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('wowai_conversations_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_CONVERSATIONS;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const savedLast = localStorage.getItem('wowai_active_chat');
    if (savedLast) return savedLast;
    return 'conv-1';
  });

  // Streaming & Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStreamingMessage, setActiveStreamingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedStreamRef = useRef<string>('');

  // Server & AI provider status
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    provider: 'BAILU AI',
    isDemo: true,
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
            model: data.model,
            connected: Boolean(data.connected),
          });
        }
      })
      .catch(err => {
        console.warn('Backend status check fallback to demo mode:', err);
      });
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
      let isDark = false;
      if (theme === 'system') {
        isDark = mediaQuery.matches;
      } else {
        isDark = theme === 'dark';
      }
      setResolvedTheme(isDark ? 'dark' : 'light');
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const handler = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Sync language with DOM & localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('wowai_lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('data-lang', language);
  }, [language]);

  // Sync user & settings & conversations with localStorage
  useEffect(() => {
    localStorage.setItem('wowai_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('wowai_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('wowai_conversations_v1', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('wowai_active_chat', activeChatId);
    }
  }, [activeChatId]);

  const updateSettings = (partial: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const activeConversation = conversations.find(c => c.id === activeChatId) || null;

  // Actions
  const createNewChat = useCallback((initialPrompt?: string): string => {
    const newId = 'conv-' + Date.now();
    const title = initialPrompt
      ? (initialPrompt.length > 30 ? initialPrompt.substring(0, 30) + '...' : initialPrompt)
      : (language === 'bn' ? 'নতুন চ্যাট' : 'New Chat');

    const newConv: Conversation = {
      id: newId,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveChatId(newId);
    setActiveView('chat');
    setIsMobileSidebarOpen(false);
    return newId;
  }, [language]);

  const selectConversation = useCallback((id: string) => {
    setActiveChatId(id);
    setActiveView('chat');
    setIsMobileSidebarOpen(false);
  }, []);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c))
    );
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeChatId === id) {
        setActiveChatId(filtered[0]?.id || null);
      }
      return filtered;
    });
  }, [activeChatId]);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveChatId(null);
  }, []);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  // Send message implementation with streaming SSE
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isGenerating) return;

    let targetConvId = activeChatId;
    let targetConv = conversations.find(c => c.id === targetConvId);

    // If no active conversation, create one
    if (!targetConv || !targetConvId) {
      targetConvId = createNewChat(content);
      targetConv = {
        id: targetConvId,
        title: content.length > 30 ? content.substring(0, 30) + '...' : content,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    // Auto-rename chat if it's the first message and still has default title
    const shouldUpdateTitle =
      targetConv.messages.length === 0 ||
      targetConv.title === 'New Chat' ||
      targetConv.title === 'নতুন চ্যাট';

    const newTitle = shouldUpdateTitle
      ? (content.length > 32 ? content.substring(0, 32) + '...' : content)
      : targetConv.title;

    // Append user message immediately
    setConversations(prev =>
      prev.map(c =>
        c.id === targetConvId
          ? {
              ...c,
              title: newTitle,
              updatedAt: Date.now(),
              messages: [...c.messages, userMessage],
            }
          : c
      )
    );

    setIsGenerating(true);
    setErrorMessage(null);
    setActiveStreamingMessage('');
    accumulatedStreamRef.current = '';

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Prepare full OpenAI-compatible message history for context memory
    const messagesPayload = [
      ...targetConv.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: content.trim(),
      },
    ];

    try {
      const response = await fetch('/api/chat?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: messagesPayload,
          message: content.trim(),
          conversationId: targetConvId,
          language,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let serverError = '';
        try {
          const errorData = await response.json();
          serverError = errorData?.error || '';
        } catch {}
        throw new Error(serverError || `Server returned status ${response.status}`);
      }

      if (response.body && settings.streamResponse) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.chunk) {
                  accumulatedStreamRef.current += parsed.chunk;
                  setActiveStreamingMessage(accumulatedStreamRef.current);
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e: any) {
                if (e?.message && e.message !== 'Unexpected token') {
                  // real error inside stream
                  throw e;
                }
              }
            }
          }
        }

        // Finalize assistant message
        const finalContent = accumulatedStreamRef.current || 'I am ready to help you.';
        const assistantMessage: ChatMessage = {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content: finalContent,
          timestamp: Date.now(),
        };

        setConversations(prev =>
          prev.map(c =>
            c.id === targetConvId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, assistantMessage],
                }
              : c
          )
        );
      } else {
        // Fallback for non-streaming
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content: data.response || 'I am ready to help you.',
          timestamp: Date.now(),
        };

        setConversations(prev =>
          prev.map(c =>
            c.id === targetConvId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, assistantMessage],
                }
              : c
          )
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
        const partialText = accumulatedStreamRef.current.trim();
        if (partialText) {
          const assistantMessage: ChatMessage = {
            id: 'msg-' + Date.now(),
            role: 'assistant',
            content: partialText,
            timestamp: Date.now(),
          };
          setConversations(prev =>
            prev.map(c =>
              c.id === targetConvId
                ? { ...c, messages: [...c.messages, assistantMessage] }
                : c
            )
          );
        }
      } else {
        console.error('Chat error:', err);
        setErrorMessage(err.message || translations[language].somethingWentWrong);
      }
    } finally {
      setIsGenerating(false);
      setActiveStreamingMessage('');
      accumulatedStreamRef.current = '';
      abortControllerRef.current = null;
    }
  }, [activeChatId, conversations, isGenerating, language, settings.streamResponse, createNewChat]);

  const retryLastMessage = useCallback(async () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const lastUserMsg = [...activeConversation.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      await sendMessage(lastUserMsg.content);
    }
  }, [activeConversation, sendMessage]);

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
