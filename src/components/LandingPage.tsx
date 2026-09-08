import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Code2,
  Globe,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LandingPageProps {
  onStartChat: () => void;
  onOpenAbout: () => void;
  onOpenPolicy: (type: 'privacy' | 'terms') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartChat,
  onOpenAbout,
  onOpenPolicy,
}) => {
  const { t, language, serverStatus } = useApp();

  const handleExploreScroll = () => {
    const el = document.getElementById('explore-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="landing-page-root" className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-between overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 max-w-6xl mx-auto w-full text-center">
        {/* Subtle Background Animated AI Visual: ambient orb + floating nodes */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] rounded-full bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-teal-500/10 dark:from-blue-600/15 dark:via-purple-600/15 dark:to-cyan-600/15 blur-3xl opacity-75 animate-pulse-gentle" />
          {/* Subtle geometric background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>

        {/* Top Mini Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 shadow-xs mb-8">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
            {serverStatus.isDemo
              ? 'Wowai v1.0 • Smart AI Assistant'
              : serverStatus.model === 'bailu-auto'
              ? 'Wowai v1.0 • BAILU Auto Powered'
              : `Wowai v1.0 • ${serverStatus.model || 'BAILU'} Powered`}
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">English & বাংলা</span>
        </div>

        {/* Main Hero Typography */}
        <h1
          id="hero-main-title"
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-4 sm:mb-6"
        >
          {t.heroTitle}
        </h1>

        <p
          id="hero-subtitle"
          className="text-xl sm:text-2xl md:text-3xl font-medium text-neutral-600 dark:text-neutral-300 mb-6 max-w-2xl mx-auto"
        >
          “{t.heroSubtitle}”
        </p>

        <p
          id="hero-support"
          className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 mb-10 max-w-xl mx-auto leading-relaxed"
        >
          {t.heroSupport}
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            id="btn-hero-start-chat"
            onClick={onStartChat}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 font-semibold text-sm shadow-md transition-all active:scale-[0.98] group"
          >
            <span>{t.startChatting}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            id="btn-hero-explore"
            onClick={handleExploreScroll}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-white/80 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 font-medium text-sm transition"
          >
            <span>{t.exploreWowai}</span>
          </button>
        </div>

        {/* Live Interface Preview Teaser */}
        <div className="mt-14 sm:mt-16 max-w-3xl mx-auto rounded-2xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white/70 dark:bg-[#12151e]/80 backdrop-blur-md shadow-xl overflow-hidden text-left">
          {/* Mock Browser/Window Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/50 dark:bg-[#0e1017]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>
            <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>wowai.app/chat</span>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Mock Message Exchanges */}
          <div className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
            {/* User message */}
            <div className="flex gap-3 items-start justify-end">
              <div className="max-w-md px-3.5 py-2.5 rounded-2xl rounded-tr-xs bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 leading-relaxed">
                {language === 'bn'
                  ? 'কোয়ান্টাম কম্পিউটিং কী এবং কেন এটি গুরুত্বপূর্ণ?'
                  : 'What is quantum computing and why does it matter?'}
              </div>
            </div>

            {/* AI response */}
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="max-w-lg p-3.5 rounded-2xl rounded-tl-xs bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-800 dark:text-neutral-200 leading-relaxed space-y-1.5">
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {language === 'bn' ? 'কোয়ান্টাম কম্পিউটিং এর মূল ধারণা:' : 'Key Quantum Fundamentals:'}
                </p>
                <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm">
                  {language === 'bn'
                    ? 'সাধারণ কম্পিউটার যেখানে 0 অথবা 1 বিট নিয়ে কাজ করে, কোয়ান্টাম কম্পিউটার কিউবিট ব্যবহার করে যা একই সাথে উভয় অবস্থায় থাকতে পারে (সুপারপজিশন)।'
                    : 'While classical bits are either 0 or 1, quantum qubits leverage superposition to evaluate vast solution spaces in parallel.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore / Core Value Pillars Section */}
      <section id="explore-section" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/40 dark:bg-[#0e111a]/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-3">
              Crafted for Clarity & Speed
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Wowai is built from the ground up without clutter, arbitrary badges, or distracting UI gimmicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1: Intelligence */}
            <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#12151e] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                Intelligence
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Powered by next-gen model intelligence with nuanced reasoning, syntax-aware code blocks, and markdown depth.
              </p>
            </div>

            {/* Pillar 2: Simplicity */}
            <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#12151e] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                Simplicity
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Zero friction layout. Generous whitespace, focused inputs, and intelligent suggestions ready with one tap.
              </p>
            </div>

            {/* Pillar 3: Speed */}
            <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#12151e] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                Speed
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Immediate token streaming with Server-Sent Events, snappy UI responsiveness, and micro-second caching.
              </p>
            </div>

            {/* Pillar 4: Bilingual Native */}
            <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#12151e] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                English & বাংলা
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Complete bilingual interface and optimized typography with Hind Siliguri for effortless reading in Bengali.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-800/80 py-8 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-[#0a0c12]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">Wowai</span>
            <span>—</span>
            <span>“{t.tagline}”</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={onStartChat} className="hover:text-neutral-900 dark:hover:text-white transition">
              {t.chat}
            </button>
            <button onClick={onOpenAbout} className="hover:text-neutral-900 dark:hover:text-white transition">
              {t.about}
            </button>
            <button onClick={() => onOpenPolicy('privacy')} className="hover:text-neutral-900 dark:hover:text-white transition">
              {t.privacyPolicy}
            </button>
            <button onClick={() => onOpenPolicy('terms')} className="hover:text-neutral-900 dark:hover:text-white transition">
              {t.termsOfService}
            </button>
          </div>

          <div>
            <span>{t.builtWithPassion}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
