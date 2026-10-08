'use client';

import Link from 'next/link';
import { ArrowRight, LayoutDashboard, type LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        <p className="text-secondary-text text-sm mt-1">{description}</p>
      </div>

      <div className="rounded-xl bg-surface border border-border p-14 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-elevated border border-border flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-primary-accent" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Scheduled for a later milestone
        </h3>
        <p className="text-sm text-secondary-text mt-1.5 max-w-md mx-auto">
          This module is outside the scope of tomorrow&apos;s prototype showcase.
          The core flow — Dashboard → Test Cases → Test Data → Automation →
          Test Runs → AI Failure Analysis — is fully demoable today.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/test-cases"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Open the prototype flow
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
