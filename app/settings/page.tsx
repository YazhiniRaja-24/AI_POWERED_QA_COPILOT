'use client';

import { Settings } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Configure your workspace, integrations and AI providers."
      icon={Settings}
    />
  );
}
