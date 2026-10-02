'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Eye, EyeOff, Check, User, Mail, Lock, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

const roles: Role[] = [
  'QA Engineer',
  'Automation Engineer',
  'Software Engineer',
  'Engineering Manager',
  'Other',
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: '' as Role | '',
    agree: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const set = (key: string, value: string | boolean | Role) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.confirmPassword !== form.password)
      e.confirmPassword = 'Passwords do not match';
    if (!form.role) e.role = 'Please select your role';
    if (!form.agree) e.agree = 'You must agree to the Terms and Privacy Policy';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const res = register({
        name: form.name,
        email: form.email,
        password: form.password,
        company: form.company,
        role: form.role as Role,
      });
      setLoading(false);
      if (res.success) router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary-accent flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">QA COPILOT</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground text-center">
          Build smarter. Test faster.
        </h1>
        <p className="text-secondary-text mt-2 text-center text-sm">
          Create your QA Copilot workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Yazhini Raj"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              {errors.name && <p className="text-danger text-xs mt-1.5">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              {errors.email && <p className="text-danger text-xs mt-1.5">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1.5">{errors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-danger text-xs mt-1.5">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Company / Team
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                <input
                  value={form.company}
                  onChange={(e) => set('company', e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value as Role)}
                className="w-full h-11 px-4 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-danger text-xs mt-1.5">{errors.role}</p>}
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <button
              type="button"
              onClick={() => set('agree', !form.agree)}
              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                form.agree ? 'bg-primary border-primary' : 'border-border bg-surface'
              }`}
              aria-label="Agree to terms"
            >
              {form.agree && <Check className="w-3 h-3 text-white" />}
            </button>
            <span className="text-sm text-secondary-text">
              I agree to the{' '}
              <span className="text-primary-accent hover:underline cursor-pointer">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-primary-accent hover:underline cursor-pointer">
                Privacy Policy
              </span>
              .
            </span>
          </label>
          {errors.agree && <p className="text-danger text-xs">{errors.agree}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating workspace…' : 'Create Workspace'}
          </button>

          <p className="text-center text-sm text-secondary-text">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
