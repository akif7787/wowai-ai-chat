import React from 'react';
import { Lightbulb, Code2, PenLine, Search, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ChatWelcomeProps {
  onSelectPrompt: (prompt: string) => void;
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({ onSelectPrompt }) => {
  const { t, language } = useApp();

  const suggestionCards = [
    {
      id: 'learn',
      icon: Lightbulb,
      category: t.learnCategory,
      title: t.learnTitle,
      prompt: t.learnPrompt,
      color: 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'code',
      icon: Code2,
      category: t.codeCategory,
      title: t.codeTitle,
      prompt: t.codePrompt,
      color: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'write',
      icon: PenLine,
      category: t.writeCategory,
      title: t.writeTitle,
      prompt: t.writePrompt,
      color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'analyze',
      icon: Search,
      category: t.analyzeCategory,
      title: t.analyzeTitle,
      prompt: t.analyzePrompt,
      color: 'text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div
      id="chat-welcome-container"
      className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-4 py-8 text-center"
    >
      {/* Visual Logo Mark */}
      <div className="relative mb-6">
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3" strokeDasharray="50 30" />
            <path d="M15 25C17 20 19 20 21 25C23 30 25 19 27 25C28.5 29 30.5 23 31.5 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-[#0c0e14] flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* Main Greeting */}
      <h1
        id="heading-welcome"
        className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2"
      >
        {t.welcomeTitle}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-8">
        {t.heroSupport}
      </p>

      {/* Suggestion Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {suggestionCards.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`card-suggestion-${item.id}`}
              onClick={() => onSelectPrompt(item.prompt)}
              className="p-4 rounded-xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white/70 dark:bg-[#12151e]/70 hover:bg-white dark:hover:bg-[#151925] hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-sm transition-all duration-150 text-left group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className={`p-1.5 rounded-lg border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-wide uppercase">
                  {item.category}
                </span>
              </div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors line-clamp-1">
                {item.title}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                "{item.prompt}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
