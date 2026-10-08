'use client';

import { ShieldCheck } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export default function CoveragePage() {
  return (
    <PlaceholderPage
      title="Coverage"
      description="Understand requirement, code and scenario coverage."
      icon={ShieldCheck}
    />
  );
}
