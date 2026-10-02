'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-secondary-text hover:text-foreground hover:bg-elevated"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
          <input
            type="text"
            placeholder="Search tests, bugs, runs…"
            className="w-full h-9 pl-10 pr-4 rounded-lg bg-elevated border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-secondary-text hover:text-foreground hover:bg-elevated transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border-2 border-surface" />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 h-9 px-1.5 sm:px-2 rounded-lg hover:bg-elevated transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary-accent flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-foreground leading-tight">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-muted-text leading-tight">
                {user?.role || 'QA Engineer'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-text hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-elevated border border-border shadow-xl py-1.5 animate-fade-in">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-sm font-medium text-foreground">{user?.name}</div>
                <div className="text-xs text-muted-text">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-secondary-text hover:text-danger hover:bg-surface transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
