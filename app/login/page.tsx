'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Check,
  ShieldCheck,
  Zap,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const features = [
  { icon: Zap, text: 'Intelligent Test Generation' },
  { icon: ShieldCheck, text: 'Automated Failure Analysis' },
  { icon: Brain, text: 'AI-Powered Root Cause Detection' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      setLoading(false);
      if (res.success) router.push('/dashboard');
      else setErrors({ password: res.error });
    }, 600);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary-accent/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary-accent flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            QA COPILOT
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-foreground mb-4">
            AI-powered quality intelligence for modern software teams.
          </h1>
          <div className="space-y-3 mt-8">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-primary-accent" />
                </div>
                <span className="text-secondary-text text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center my-8">
          <svg viewBox="0 0 400 300" className="w-full max-w-md opacity-70">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7C5CFF" />
                <stop offset="100%" stopColor="#5B8CFF" />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#5B8CFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="150" r="120" fill="none" stroke="url(#g1)" strokeWidth="1" opacity="0.3" />
            <circle cx="200" cy="150" r="90" fill="none" stroke="url(#g1)" strokeWidth="1" opacity="0.4" />
            <circle cx="200" cy="150" r="60" fill="none" stroke="url(#g1)" strokeWidth="1.5" opacity="0.5" />
            <circle cx="200" cy="150" r="30" fill="url(#g2)" />
            <g className="animate-orbit" style={{ transformOrigin: '200px 150px' }}>
              <circle cx="320" cy="150" r="4" fill="#7C5CFF" />
              <circle cx="320" cy="150" r="8" fill="none" stroke="#7C5CFF" strokeWidth="0.5" opacity="0.5" />
            </g>
            <g className="animate-orbit-reverse" style={{ transformOrigin: '200px 150px' }}>
              <circle cx="200" cy="60" r="3" fill="#5B8CFF" />
              <circle cx="200" cy="60" r="6" fill="none" stroke="#5B8CFF" strokeWidth="0.5" opacity="0.5" />
            </g>
            <line x1="80" y1="150" x2="320" y2="150" stroke="#232C38" strokeWidth="0.5" />
            <line x1="200" y1="30" x2="200" y2="270" stroke="#232C38" strokeWidth="0.5" />
            <rect x="120" y="120" width="6" height="6" rx="1" fill="#22C55E" opacity="0.7" />
            <rect x="280" y="180" width="6" height="6" rx="1" fill="#22C55E" opacity="0.7" />
            <rect x="150" y="210" width="6" height="6" rx="1" fill="#EF4444" opacity="0.7" />
            <rect x="250" y="90" width="6" height="6" rx="1" fill="#F59E0B" opacity="0.7" />
          </svg>
        </div>

        <div className="relative z-10 text-xs text-muted-text">
          © 2026 QA Copilot. All rights reserved.
        </div>
      </div>

      {/* Right section */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary-accent flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">QA COPILOT</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
          <p className="text-secondary-text mt-2 text-sm">
            Sign in to continue to your QA workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-danger text-xs mt-1.5">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1.5">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setRemember((r) => !r)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    remember
                      ? 'bg-primary border-primary'
                      : 'border-border bg-surface'
                  }`}
                  aria-label="Remember me"
                >
                  {remember && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm text-secondary-text">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-text">
                  or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              className="w-full h-11 rounded-lg bg-surface border border-border text-foreground font-medium text-sm hover:bg-elevated transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-secondary-text">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-accent hover:underline">
                Create account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
