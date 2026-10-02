'use client';

import { Search, X } from 'lucide-react';
import {
  statusOptions,
  priorityOptions,
  typeOptions,
  frameworkOptions,
  sortOptions,
} from '@/data/testCaseOptions';
import type {
  TestCasePriority,
  TestCaseStatus,
  TestCaseType,
  TestFramework,
} from '@/types';

export interface TestCaseFiltersState {
  search: string;
  status: string;
  priority: string;
  type: string;
  framework: string;
  sort: string;
}

export const emptyFilters: TestCaseFiltersState = {
  search: '',
  status: '',
  priority: '',
  type: '',
  framework: '',
  sort: 'newest',
};

interface TestCaseFiltersProps {
  filters: TestCaseFiltersState;
  onChange: (filters: TestCaseFiltersState) => void;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-text uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 rounded-lg bg-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TestCaseFilters({ filters, onChange }: TestCaseFiltersProps) {
  const hasActive = Boolean(
    filters.status ||
      filters.priority ||
      filters.type ||
      filters.framework ||
      filters.search
  );

  const clearAll = () => onChange(emptyFilters);

  return (
    <div className="rounded-xl bg-surface border border-border p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search test cases..."
            className="w-full h-10 pl-10 pr-9 rounded-lg bg-elevated border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-text hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-text whitespace-nowrap">
            {hasActive && (
              <button
                onClick={clearAll}
                className="text-primary-accent hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <FilterSelect
          label="Status"
          value={filters.status}
          options={statusOptions}
          onChange={(status) => onChange({ ...filters, status })}
          placeholder="All statuses"
        />
        <FilterSelect
          label="Priority"
          value={filters.priority}
          options={priorityOptions}
          onChange={(priority) => onChange({ ...filters, priority })}
          placeholder="All priorities"
        />
        <FilterSelect
          label="Test Type"
          value={filters.type}
          options={typeOptions}
          onChange={(type) => onChange({ ...filters, type })}
          placeholder="All types"
        />
        <FilterSelect
          label="Framework"
          value={filters.framework}
          options={frameworkOptions}
          onChange={(framework) => onChange({ ...filters, framework })}
          placeholder="All frameworks"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-text uppercase tracking-wider">
            Sort
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value })}
            className="h-9 px-3 rounded-lg bg-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export type {
  TestCasePriority,
  TestCaseStatus,
  TestCaseType,
  TestFramework,
};
