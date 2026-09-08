import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Sparkles,
  Github,
  Linkedin,
  Globe,
  Heart,
  Shield,
  FileText,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'about' | 'privacy' | 'terms';
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
}) => {
  const { t, language } = useApp();
  const [tab, setTab] = useState<'about' | 'privacy' | 'terms'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      id="modal-about-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-about-panel"
        className="relative w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12151e] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-base text-neutral-900 dark:text-white">
              {tab === 'about'
                ? t.aboutWowaiTitle
                : tab === 'privacy'
                ? t.privacyPolicy
                : t.termsOfService}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 px-6 gap-3 text-xs font-medium">
          <button
            onClick={() => setTab('about')}
            className={`py-2.5 border-b-2 transition ${
              tab === 'about'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {t.about}
          </button>
          <button
            onClick={() => setTab('privacy')}
            className={`py-2.5 border-b-2 transition ${
              tab === 'privacy'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {t.privacyPolicy}
          </button>
          <button
            onClick={() => setTab('terms')}
            className={`py-2.5 border-b-2 transition ${
              tab === 'terms'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {t.termsOfService}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-neutral-700 dark:text-neutral-300">
          {tab === 'about' && (
            <div className="space-y-6">
              {/* Product Intro */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-2">
                <h4 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Wowai
                </h4>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  “{t.tagline}”
                </p>
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 pt-1">
                  {t.aboutWowaiContent}
                </p>
              </div>

              {/* Developer Spotlight */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151825] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Developer Credits</span>
                </div>

                <div>
                  <p className="text-base font-semibold text-neutral-900 dark:text-white">
                    {t.developedBy}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {t.builtWithPassion}
                  </p>
                </div>

                {/* Developer Profile Placeholders */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <a
                    href="#developer-github"
                    onClick={e => e.preventDefault()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition text-neutral-700 dark:text-neutral-300"
                    title="GitHub profile placeholder"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>{t.github}</span>
                  </a>

                  <a
                    href="#developer-linkedin"
                    onClick={e => e.preventDefault()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition text-neutral-700 dark:text-neutral-300"
                    title="LinkedIn profile placeholder"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t.linkedin}</span>
                  </a>

                  <a
                    href="#developer-portfolio"
                    onClick={e => e.preventDefault()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition text-neutral-700 dark:text-neutral-300"
                    title="Portfolio placeholder"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.portfolio}</span>
                  </a>
                </div>
              </div>

              {/* Core Tenets */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/40">
                  <span className="font-semibold text-neutral-900 dark:text-white block mb-0.5">⚡ Fast & Responsive</span>
                  <span className="text-neutral-500 dark:text-neutral-400">Engineered with Vite, React 19, and low latency streaming.</span>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/40">
                  <span className="font-semibold text-neutral-900 dark:text-white block mb-0.5">🇧🇩 Bilingual First</span>
                  <span className="text-neutral-500 dark:text-neutral-400">Complete native English and বাংলা support out of the box.</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {t.privacyContent}
              </ReactMarkdown>
            </div>
          )}

          {tab === 'terms' && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {t.termsContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0f1118] flex items-center justify-between text-xs text-neutral-500">
          <span>{t.developedBy}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
