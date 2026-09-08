import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t, user, setUser } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('akif7787@gmail.com');
  const [name, setName] = useState('Ahanaf Akif');
  const [password, setPassword] = useState('••••••••');

  if (!isOpen) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      name: mode === 'signup' ? (name || 'Ahanaf Akif') : 'Ahanaf Akif',
      email: email || 'akif7787@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isAuthenticated: true,
    });
    onClose();
  };

  const handleGoogleAuth = () => {
    setUser({
      name: 'Ahanaf Akif',
      email: 'akif7787@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isAuthenticated: true,
    });
    onClose();
  };

  return (
    <div
      id="modal-auth-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-auth-panel"
        className="relative w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12151e] shadow-2xl p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon */}
        <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3" strokeDasharray="50 30" />
            <path d="M15 25C17 20 19 20 21 25C23 30 25 19 27 25C28.5 29 30.5 23 31.5 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-center text-neutral-900 dark:text-white">
          {mode === 'signin' ? t.signIn : t.signUp}
        </h3>
        <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mb-5">
          {t.tagline}
        </p>

        {/* Continue with Google */}
        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition mb-4 shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{t.continueWithGoogle}</span>
        </button>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800"></div>
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                  placeholder="Ahanaf Akif"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                placeholder="akif7787@gmail.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-xs transition shadow-xs mt-2"
          >
            {mode === 'signin' ? t.signIn : t.signUp}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local session simulated for evaluation</span>
        </div>
      </div>
    </div>
  );
};
