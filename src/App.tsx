import React, { useState, useRef, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatWelcome } from './components/ChatWelcome';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { LandingPage } from './components/LandingPage';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { AboutModal } from './components/AboutModal';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

function MainLayout() {
  const {
    activeView,
    setActiveView,
    activeConversation,
    createNewChat,
    sendMessage,
    stopGenerating,
    retryLastMessage,
    isGenerating,
    activeStreamingMessage,
    errorMessage,
    settings,
    t,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<'about' | 'privacy' | 'terms'>('about');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or stream change
  useEffect(() => {
    if (settings.autoScroll && messagesEndRef.current && activeView === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages, activeStreamingMessage, isGenerating, settings.autoScroll, activeView]);

  const handleOpenPolicy = (type: 'privacy' | 'terms') => {
    setAboutInitialTab(type);
    setIsAboutOpen(true);
  };

  const handleOpenAbout = () => {
    setAboutInitialTab('about');
    setIsAboutOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-[#0c0e14] text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Universal Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAbout={handleOpenAbout}
      />

      {/* Main Content Area */}
      {activeView === 'landing' ? (
        <LandingPage
          onStartChat={() => setActiveView('chat')}
          onOpenAbout={handleOpenAbout}
          onOpenPolicy={handleOpenPolicy}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Collapsible Sidebar */}
          <Sidebar
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenAbout={handleOpenAbout}
          />

          {/* Active Chat Column */}
          <main
            id="chat-main-column"
            className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden relative"
          >
            {/* Scrollable Conversation Container */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {!activeConversation || activeConversation.messages.length === 0 ? (
                <ChatWelcome onSelectPrompt={prompt => sendMessage(prompt)} />
              ) : (
                <div className="flex-1 py-4">
                  {activeConversation.messages.map((msg, index) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isLast={index === activeConversation.messages.length - 1}
                      onRetry={
                        index === activeConversation.messages.length - 1
                          ? retryLastMessage
                          : undefined
                      }
                      onNewChat={() => createNewChat()}
                    />
                  ))}

                  {/* Active Live Streaming Bubble */}
                  {isGenerating && (
                    <div className="py-4 px-4 sm:px-6 bg-neutral-100/40 dark:bg-[#11141e]/50 border-y border-neutral-200/50 dark:border-neutral-800/50 animate-in fade-in duration-150">
                      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4 items-start">
                        <div className="w-7 h-7 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
                              Wowai
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium animate-pulse">
                              {t.thinking}
                            </span>
                          </div>

                          {activeStreamingMessage ? (
                            <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                              {activeStreamingMessage}
                              <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-blue-500 animate-pulse" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 py-1 text-xs text-neutral-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:-0.3s]"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:-0.15s]"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce"></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error display if generation failed */}
                  {errorMessage && (
                    <div className="max-w-3xl mx-auto my-3 px-4">
                      <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                        <button
                          onClick={retryLastMessage}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{t.retry}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Fixed Chat Input */}
            <ChatInput
              onSend={sendMessage}
              onStop={stopGenerating}
              isGenerating={isGenerating}
            />
          </main>
        </div>
      )}

      {/* Global Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAbout={handleOpenAbout}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        initialTab={aboutInitialTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
