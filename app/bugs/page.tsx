'use client';

import { Bug } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export default function BugsPage() {
  return (
    <PlaceholderPage
      title="Bugs"
      description="Track defects raised from failed test runs."
      icon={Bug}
    />
  );
}
