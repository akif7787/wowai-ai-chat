import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Laptop,
  Globe,
  Settings,
  User,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Home,
  Info,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenAuth,
  onOpenAbout,
}) => {
  const {
    theme,
    setTheme,
    resolvedTheme,
    language,
    setLanguage,
    t,
    activeView,
    setActiveView,
    setIsMobileSidebarOpen,
    user,
    setUser,
    logout,
    serverStatus,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    if (theme === 'system') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('system');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  return (
    <header
      id="wowai-header"
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/90 dark:bg-[#0c0e14]/90 backdrop-blur-md transition-colors"
    >
      {/* Left section: Hamburger (mobile) + Logo & Active page indicator */}
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <button
          id="btn-brand-home"
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <svg className="w-4 h-4" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3" strokeDasharray="50 30" />
              <path d="M15 25C17 20 19 20 21 25C23 30 25 19 27 25C28.5 29 30.5 23 31.5 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-50">
            Wowai
          </span>
        </button>

        {/* Mode Pill Indicator */}
        {serverStatus.isDemo ? (
          <span
            id="badge-demo-mode"
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
            title="Configure BAILU_API_KEY for live AI model inference"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Demo Mode
          </span>
        ) : (
          <span
            id="badge-live-mode"
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            title={`Active AI Model: ${serverStatus.model || 'bailu-auto'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {serverStatus.model === 'bailu-auto'
              ? 'BAILU Auto'
              : serverStatus.model
              ? (serverStatus.model.startsWith('bailu-') ? 'BAILU ' + serverStatus.model.slice(6).toUpperCase() : serverStatus.model)
              : 'BAILU Auto'}
          </span>
        )}
      </div>

      {/* Center section: Navigation Switcher */}
      <nav className="hidden md:flex items-center gap-1 bg-neutral-200/50 dark:bg-neutral-800/50 p-0.5 rounded-full text-xs font-medium">
        <button
          id="nav-tab-landing"
          onClick={() => setActiveView('landing')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
            activeView === 'landing'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t.home}</span>
        </button>
        <button
          id="nav-tab-chat"
          onClick={() => setActiveView('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
            activeView === 'chat'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{t.chat}</span>
        </button>
        <button
          id="nav-tab-about"
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{t.about}</span>
        </button>
      </nav>

      {/* Right controls: Language, Theme, Settings, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Language Switcher Button (EN | বাংলা) */}
        <button
          id="btn-language-switcher"
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 transition"
          title="Switch Language (English / বাংলা)"
          aria-label="Toggle language"
        >
          <Globe className="w-3.5 h-3.5 text-neutral-500" />
          <span className="font-semibold">{language === 'en' ? 'বাংলা' : 'EN'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 transition"
          title={`Current: ${theme}. Click to change.`}
          aria-label="Toggle color theme"
        >
          {theme === 'system' ? (
            <Laptop className="w-4 h-4" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-sky-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Settings Button */}
        <button
          id="btn-open-settings-header"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 transition hidden sm:flex"
          title={t.settings}
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            id="btn-profile-menu-toggle"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-700 transition focus:outline-none"
            aria-label="User profile menu"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {user.name.charAt(0)}
              </div>
            )}
          </button>

          {isProfileMenuOpen && (
            <div
              id="menu-profile-dropdown"
              className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12151e] shadow-xl p-2 text-sm z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
                <p className="font-semibold text-neutral-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user.email}
                </p>
              </div>

              <button
                id="menu-item-settings"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition text-left"
              >
                <Settings className="w-4 h-4 text-neutral-500" />
                <span>{t.settings}</span>
              </button>

              <button
                id="menu-item-about"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenAbout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition text-left"
              >
                <Info className="w-4 h-4 text-neutral-500" />
                <span>{t.aboutWowaiTitle}</span>
              </button>

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80"></div>

              {user.isAuthenticated ? (
                <button
                  id="menu-item-logout"
                  onClick={() => {
                    logout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.logout}</span>
                </button>
              ) : (
                <button
                  id="menu-item-signin"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition text-left"
                >
                  <User className="w-4 h-4" />
                  <span>{t.signIn}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
