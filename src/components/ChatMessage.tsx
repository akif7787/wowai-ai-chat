import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCw,
  AlertCircle,
  Sparkles,
  User,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { useApp } from '../context/AppContext';

interface ChatMessageProps {
  message: ChatMessageType;
  isLast: boolean;
  onRetry?: () => void;
  onNewChat?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLast,
  onRetry,
  onNewChat,
}) => {
  const { t, settings, user } = useApp();
  const [hasCopiedText, setHasCopiedText] = useState(false);

  const isUser = message.role === 'user';

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setHasCopiedText(true);
      setTimeout(() => setHasCopiedText(false), 2000);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`py-4 px-4 sm:px-6 transition-colors duration-150 ${
        isUser
          ? 'bg-transparent'
          : 'bg-neutral-100/40 dark:bg-[#11141e]/50 border-y border-neutral-200/50 dark:border-neutral-800/50'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4 items-start">
        {/* Avatar Icon */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                {user.name.charAt(0)}
              </div>
            )
          ) : (
            <div className="w-7 h-7 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Header row with role name and timestamp */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
              {isUser ? user.name : 'Wowai'}
            </span>
            {settings.showTimestamps && (
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                {formatTime(message.timestamp)}
              </span>
            )}
          </div>

          {/* Message Content */}
          {message.isError ? (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-sm space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-medium">{t.somethingWentWrong}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition"
                  >
                    {t.retry}
                  </button>
                )}
                {onNewChat && (
                  <button
                    onClick={onNewChat}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition"
                  >
                    {t.startNewChat}
                  </button>
                )}
              </div>
            </div>
          ) : isUser ? (
            <div className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div className="markdown-prose text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom Code Block component with Copy button handled at the pre level
                  pre({ children }: any) {
                    if (React.isValidElement(children)) {
                      const codeProps = (children.props as any) || {};
                      const className = codeProps.className || '';
                      const match = /language-(\w+)/.exec(className);
                      const language = match ? match[1] : 'text';
                      const rawCode = String(codeProps.children || '').replace(/\n$/, '');
                      return (
                        <CodeBlock
                          language={language}
                          code={rawCode}
                          copyLabel={t.copyCode}
                          copiedLabel={t.copied}
                        />
                      );
                    }
                    return <div className="my-3">{children}</div>;
                  },
                  code({ node, className, children, ...props }: any) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mt-4 mb-2 text-neutral-900 dark:text-white first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mt-3.5 mb-2 text-neutral-900 dark:text-white">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-3 mb-1.5 text-neutral-900 dark:text-white">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-5 mb-3 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-5 mb-3 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-neutral-300 dark:border-neutral-700 pl-3.5 italic my-2 text-neutral-600 dark:text-neutral-400">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <table className="w-full text-left text-xs border-collapse">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 font-semibold">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => <th className="p-2.5 border-b border-neutral-200 dark:border-neutral-800">{children}</th>,
                  td: ({ children }) => (
                    <td className="p-2.5 border-b border-neutral-100 dark:border-neutral-800/50">
                      {children}
                    </td>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5"
                    >
                      {children}
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Actions toolbar for AI response */}
          {!isUser && !message.isError && (
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-neutral-500 dark:text-neutral-400">
              <button
                id={`btn-copy-msg-${message.id}`}
                onClick={handleCopyMessage}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition"
                title={t.copyMessage}
              >
                {hasCopiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copyMessage}</span>
                  </>
                )}
              </button>

              {isLast && onRetry && (
                <button
                  id={`btn-regenerate-msg-${message.id}`}
                  onClick={onRetry}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition"
                  title={t.regenerate}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t.regenerate}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for code block with Copy button
const CodeBlock: React.FC<{
  language: string;
  code: string;
  copyLabel: string;
  copiedLabel: string;
}> = ({ language, code, copyLabel, copiedLabel }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-[#161822] text-neutral-100 shadow-xs">
      {/* Code Header bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0f1118] border-b border-neutral-800 text-xs text-neutral-400">
        <span className="font-mono text-[11px] uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-800 text-neutral-300 hover:text-white transition active:scale-95"
          aria-label="Copy code block"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">{copiedLabel}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">{copyLabel}</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed selection:bg-blue-600 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
};
