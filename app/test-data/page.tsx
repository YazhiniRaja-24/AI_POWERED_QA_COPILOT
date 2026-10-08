'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Database,
  FileText,
  RefreshCw,
  Check,
  Trash2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { testCaseApi, toUiTestCase } from '@/backend/lib/test-case-api';
import { ApiError } from '@/backend/lib/api-client';
import { generateDataSets } from '@/lib/test-data';
import {
  addDataRecords,
  removeDataRecord,
  setDataRecordStatus,
  useFlowState,
} from '@/lib/flow-store';
import type { TestCase } from '@/types';

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.';
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-surface border border-border p-5">
      <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs text-secondary-text mb-1 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

export default function TestDataPage() {
  const { dataRecords } = useFlowState();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await testCaseApi.list();
      setTestCases(response.map(toUiTestCase));
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const covered = useMemo(
    () => new Set(dataRecords.map((r) => r.testCaseId)).size,
    [dataRecords]
  );
  const approved = useMemo(
    () => dataRecords.filter((r) => r.status === 'approved').length,
    [dataRecords]
  );

  const generateAll = () => {
    if (testCases.length === 0) {
      toast.error('No test cases available. Create test cases first.');
      return;
    }
    setGenerating(true);
    try {
      const existing = new Set(dataRecords.map((r) => r.id));
      const fresh = testCases
        .flatMap((tc) => generateDataSets(tc))
        .filter((r) => !existing.has(r.id));
      if (fresh.length === 0) {
        toast.info('Every test case already has data sets.');
        return;
      }
      addDataRecords(fresh);
      toast.success(`${fresh.length} test data sets generated.`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Test Data
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Generate and approve input data sets for your test cases before
            automation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={generateAll}
            disabled={generating}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Generate data sets
          </button>
          <Link
            href="/automation"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Continue to Automation
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Database className="w-5 h-5 text-primary-accent" />}
          label="Data Sets"
          value={String(dataRecords.length)}
          accent="text-foreground"
        />
        <StatCard
          icon={<Check className="w-5 h-5 text-success" />}
          label="Approved"
          value={String(approved)}
          accent="text-success"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-warning" />}
          label="Test Cases Covered"
          value={`${covered}${testCases.length ? ` / ${testCases.length}` : ''}`}
          accent="text-foreground"
        />
      </div>

      {loading && (
        <div className="h-96 rounded-xl bg-surface border border-border animate-pulse" />
      )}

      {!loading && loadError && (
        <div className="rounded-xl bg-surface border border-danger/30 p-14 text-center">
          <h3 className="text-lg font-semibold text-foreground">
            Unable to load test cases
          </h3>
          <p className="text-sm text-secondary-text mt-1.5">{loadError}</p>
          <button
            onClick={() => void load()}
            className="mt-6 inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && dataRecords.length === 0 && (
        <div className="rounded-xl bg-surface border border-border p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-elevated border border-border flex items-center justify-center mb-5">
            <Database className="w-6 h-6 text-primary-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No test data yet
          </h3>
          <p className="text-sm text-secondary-text mt-1.5 max-w-md mx-auto">
            Generate deterministic input data sets from your saved test cases,
            review them, and approve the ones to use in automation.
          </p>
          <button
            onClick={generateAll}
            disabled={generating}
            className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate data sets
          </button>
        </div>
      )}

      {!loading && !loadError && dataRecords.length > 0 && (
        <div className="rounded-xl bg-surface border border-border overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Test Case', 'Set', 'Input Data', 'Expected Result', 'Status', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-text whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {dataRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-border last:border-0 hover:bg-elevated/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 max-w-[260px]">
                      <p className="font-medium text-foreground truncate">
                        {record.testCaseTitle}
                      </p>
                      <p className="text-xs text-muted-text mt-0.5">
                        {record.testCaseId}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-secondary-text whitespace-nowrap">
                      #{record.setNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                        {record.fields.map((f) => (
                          <span
                            key={f.name}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-elevated border border-border text-xs font-mono text-secondary-text"
                          >
                            <span className="text-muted-text">{f.name}=</span>
                            {f.value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-secondary-text max-w-[240px]">
                      <span className="line-clamp-2" title={record.expected}>
                        {record.expected}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                          record.status === 'approved'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            record.status === 'approved'
                              ? 'bg-success'
                              : 'bg-warning'
                          )}
                        />
                        {record.status === 'approved' ? 'Approved' : 'Generated'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 justify-end">
                        {record.status === 'generated' ? (
                          <button
                            onClick={() => {
                              setDataRecordStatus(record.id, 'approved');
                              toast.success('Data set approved.');
                            }}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-elevated border border-border text-xs font-medium text-foreground hover:bg-surface transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 text-success" />
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setDataRecordStatus(record.id, 'generated')
                            }
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-elevated border border-border text-xs font-medium text-secondary-text hover:bg-surface transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          onClick={() => {
                            removeDataRecord(record.id);
                            toast.success('Data set removed.');
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-text hover:text-danger hover:bg-elevated transition-colors"
                          aria-label={`Delete data set ${record.setNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
