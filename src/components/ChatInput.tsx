import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isGenerating,
}) => {
  const { t, settings } = useApp();
  const [inputVal, setInputVal] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea according to scroll height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(nextHeight, 44)}px`;
    }
  }, [inputVal]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isGenerating) return;

    onSend(inputVal.trim());
    setInputVal('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (settings.enterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      id="chat-input-container"
      className="sticky bottom-0 z-20 w-full bg-gradient-to-t from-neutral-50 via-neutral-50/95 to-transparent dark:from-[#0c0e14] dark:via-[#0c0e14]/95 dark:to-transparent pt-3 pb-3 px-4"
    >
      <div className="max-w-3xl mx-auto">
        {/* Main Input Box */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end rounded-2xl border border-neutral-300/80 dark:border-neutral-700/80 bg-white dark:bg-[#12151e] shadow-sm hover:border-neutral-400 dark:hover:border-neutral-600 focus-within:border-neutral-900 dark:focus-within:border-white focus-within:ring-1 focus-within:ring-neutral-900 dark:focus-within:ring-white transition-all duration-150"
        >
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={1}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.inputPlaceholder}
            className="w-full py-3 pl-4 pr-24 text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 resize-none focus:outline-none max-h-[180px] leading-relaxed"
          />

          {/* Right Action Controls */}
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            {/* Character indicator (if typing) */}
            {inputVal.length > 0 && (
              <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline-block">
                {inputVal.length}
              </span>
            )}

            {isGenerating ? (
              <button
                type="button"
                id="btn-stop-generating"
                onClick={onStop}
                className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center hover:opacity-90 active:scale-95 transition shadow-xs"
                title={t.stop}
                aria-label={t.stop}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                id="btn-send-message"
                disabled={!inputVal.trim()}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-xs active:scale-95 ${
                  inputVal.trim()
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                }`}
                title={t.send}
                aria-label={t.send}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </form>

        {/* Minimal Footer Disclaimer */}
        <p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
};
