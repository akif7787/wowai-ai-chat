import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Laptop,
  Globe,
  Trash2,
  Check,
  Shield,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeMode, Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAbout,
}) => {
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    settings,
    updateSettings,
    clearAllConversations,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'appearance' | 'language' | 'chat' | 'privacy'>('appearance');
  const [clearedConfirm, setClearedConfirm] = useState(false);

  if (!isOpen) return null;

  const handleClearHistory = () => {
    if (window.confirm(t.clearHistoryConfirm)) {
      clearAllConversations();
      setClearedConfirm(true);
      setTimeout(() => setClearedConfirm(false), 2000);
    }
  };

  return (
    <div
      id="modal-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-settings-panel"
        className="relative w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12151e] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-neutral-900 dark:text-white">
              {t.settings}
            </span>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 px-6 gap-2 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-1 border-b-2 transition whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {t.appearance}
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`py-3 px-1 border-b-2 transition whitespace-nowrap ${
              activeTab === 'language'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {t.language}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-1 border-b-2 transition whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {t.chatPreferences}
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-1 border-b-2 transition whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {t.privacy}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
                  {t.appearance}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { mode: 'light' as ThemeMode, label: t.themeLight, icon: Sun },
                    { mode: 'dark' as ThemeMode, label: t.themeDark, icon: Moon },
                    { mode: 'system' as ThemeMode, label: t.themeSystem, icon: Laptop },
                  ].map(item => {
                    const Icon = item.icon;
                    const isSelected = theme === item.mode;
                    return (
                      <button
                        key={item.mode}
                        onClick={() => setTheme(item.mode)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-medium transition ${
                          isSelected
                            ? 'border-neutral-900 dark:border-white bg-neutral-100/60 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs ring-1 ring-neutral-900/10'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-2" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. Language Tab */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
                  {t.language}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { lang: 'en' as Language, title: 'English', desc: 'Default international' },
                    { lang: 'bn' as Language, title: 'বাংলা', desc: 'Bengali natural support' },
                  ].map(item => {
                    const isSelected = language === item.lang;
                    return (
                      <button
                        key={item.lang}
                        onClick={() => setLanguage(item.lang)}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-neutral-900 dark:border-white bg-neutral-100/60 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs ring-1 ring-neutral-900/10'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">{item.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Chat Preferences Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                {t.chatPreferences}
              </h4>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {t.enterToSend}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enterToSend}
                    onChange={e => updateSettings({ enterToSend: e.target.checked })}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 dark:focus:ring-white dark:bg-neutral-800"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {t.showTimestamps}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showTimestamps}
                    onChange={e => updateSettings({ showTimestamps: e.target.checked })}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 dark:focus:ring-white dark:bg-neutral-800"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {t.streamingMode}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.streamResponse}
                    onChange={e => updateSettings({ streamResponse: e.target.checked })}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 dark:focus:ring-white dark:bg-neutral-800"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 4. Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                {t.privacy}
              </h4>

              <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 space-y-3">
                <p className="text-sm font-medium text-rose-900 dark:text-rose-300">
                  {t.clearHistory}
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                  {t.clearHistoryConfirm}
                </p>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition active:scale-95 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearHistory}</span>
                </button>
                {clearedConfirm && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ {t.historyCleared}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info & About */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0f1118] flex items-center justify-between text-xs text-neutral-500">
          <button
            onClick={() => {
              onClose();
              onOpenAbout();
            }}
            className="hover:text-neutral-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{t.aboutWowaiTitle}</span>
          </button>
          <span>{t.developedBy}</span>
        </div>
      </div>
    </div>
  );
};
