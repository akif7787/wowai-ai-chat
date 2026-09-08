import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Settings,
  User,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  Laptop,
  Moon,
  Sun,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenAbout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSettings,
  onOpenAuth,
  onOpenAbout,
}) => {
  const {
    conversations,
    activeChatId,
    selectConversation,
    createNewChat,
    renameConversation,
    deleteConversation,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    t,
    theme,
    setTheme,
    resolvedTheme,
    language,
    setLanguage,
    user,
    setActiveView,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c =>
      c.title.toLowerCase().includes(query) ||
      c.messages.some(m => m.content.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      renameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
    setDeleteConfirmId(null);
    setMenuOpenId(null);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return language === 'bn' ? 'এইমাত্র' : 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          id="sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        id="wowai-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 md:w-64 lg:w-72 bg-neutral-100/70 dark:bg-[#0f121a] border-r border-neutral-200/80 dark:border-neutral-800/80 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header: Logo + Mobile Close */}
        <div className="flex items-center justify-between p-4 pb-3">
          <button
            onClick={() => {
              setActiveView('landing');
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3" strokeDasharray="50 30" />
                <path d="M15 25C17 20 19 20 21 25C23 30 25 19 27 25C28.5 29 30.5 23 31.5 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-left">
              <span className="block font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-50 leading-none">
                Wowai
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {t.tagline}
              </span>
            </div>
          </button>

          <button
            id="btn-close-mobile-sidebar"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: Large "+ New Chat" Button */}
        <div className="px-3 pt-1 pb-3">
          <button
            id="btn-new-chat-sidebar"
            onClick={() => createNewChat()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 font-medium text-sm shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newChat}</span>
          </button>
        </div>

        {/* Search Chats Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            <input
              id="input-search-chats"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchChats}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-200/50 dark:bg-neutral-800/40 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Chats Section Label */}
        <div className="px-4 py-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
          <span>{t.recentChats}</span>
          <span className="text-[10px] lowercase font-normal bg-neutral-200/60 dark:bg-neutral-800/60 px-1.5 py-0.5 rounded">
            {filteredConversations.length}
          </span>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 py-1">
          {filteredConversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
              {searchQuery ? t.noChatsFound : t.noHistoryYet}
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = conv.id === activeChatId;
              const isEditing = conv.id === editingId;
              const isMenuOpen = conv.id === menuOpenId;
              const isDeleting = conv.id === deleteConfirmId;

              return (
                <div
                  key={conv.id}
                  className={`group relative rounded-xl transition flex items-center ${
                    isActive
                      ? 'bg-white dark:bg-neutral-800/90 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full px-2 py-1.5">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveRename(conv.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(conv.id)}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        title={t.save}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        title={t.cancel}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isDeleting ? (
                    <div className="flex items-center justify-between w-full px-3 py-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                      <span className="truncate pr-1">{t.delete}?</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => handleConfirmDelete(conv.id, e)}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700 font-medium text-[11px]"
                        >
                          {t.delete}
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-[11px]"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => selectConversation(conv.id)}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                      <span className="flex-1 truncate font-normal">
                        {conv.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
                        {formatRelativeTime(conv.updatedAt)}
                      </span>

                      {/* Context action button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : conv.id);
                        }}
                        className={`p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 opacity-0 group-hover:opacity-100 transition ${
                          isMenuOpen ? '!opacity-100' : ''
                        }`}
                        aria-label="Conversation options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  )}

                  {/* Context menu popup */}
                  {isMenuOpen && !isEditing && !isDeleting && (
                    <div className="absolute right-2 top-8 z-30 w-36 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg p-1 text-xs animate-in fade-in duration-100">
                      <button
                        onClick={e => handleStartRename(conv.id, conv.title, e)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-left"
                      >
                        <Edit2 className="w-3 h-3 text-neutral-400" />
                        <span>{t.rename}</span>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t.delete}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Settings, Theme, Lang, & Developer info */}
        <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#0c0e14]/50 space-y-2">
          {/* Quick Settings & Profile buttons */}
          <div className="flex items-center justify-between">
            <button
              id="btn-sidebar-user-profile"
              onClick={onOpenAuth}
              className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition p-1 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
            >
              <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-semibold text-[10px]">
                {user.name.charAt(0)}
              </div>
              <span className="truncate max-w-[100px] font-medium">{user.name}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                id="btn-sidebar-settings"
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition"
                title={t.settings}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Developer Credit Tag */}
          <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <button
              onClick={onOpenAbout}
              className="hover:text-neutral-800 dark:hover:text-neutral-200 transition text-left"
            >
              {t.developedBy}
            </button>
            <span className="text-[10px] text-neutral-400 font-mono">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
