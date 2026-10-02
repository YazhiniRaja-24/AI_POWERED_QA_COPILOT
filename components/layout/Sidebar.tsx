'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Database,
  Code2,
  Bot,
  PlayCircle,
  AlertTriangle,
  Bug,
  ShieldCheck,
  FileBarChart,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }],
  },
  {
    title: 'Test Intelligence',
    items: [
      { label: 'Test Cases', icon: FileText, href: '/test-cases' },
      { label: 'Test Data', icon: Database, href: '/test-data' },
      { label: 'API Testing', icon: Code2, href: '/api-testing' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { label: 'Automation', icon: Bot, href: '/automation' },
      { label: 'Test Runs', icon: PlayCircle, href: '/test-runs' },
      { label: 'Failures', icon: AlertTriangle, href: '/failures' },
    ],
  },
  {
    title: 'Quality',
    items: [
      { label: 'Bugs', icon: Bug, href: '/bugs' },
      { label: 'Coverage', icon: ShieldCheck, href: '/coverage' },
      { label: 'Reports', icon: FileBarChart, href: '/reports' },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', icon: Settings, href: '/settings' }],
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-surface border-r border-border flex flex-col transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary-accent flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
                QA COPILOT
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-6 h-6 items-center justify-center rounded text-muted-text hover:text-foreground hover:bg-elevated transition-colors"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-text px-3 mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary-accent border border-primary/20'
                          : 'text-secondary-text hover:text-foreground hover:bg-elevated border border-transparent',
                        collapsed && 'lg:justify-center lg:px-0'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-border shrink-0">
            <div className="rounded-lg bg-elevated border border-border p-3">
              <p className="text-xs text-secondary-text">
                <span className="text-foreground font-medium">Pro Plan</span>
                <br />
                14 days remaining
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
