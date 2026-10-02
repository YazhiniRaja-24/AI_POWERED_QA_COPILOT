'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/backend/lib/api-client';
import {
  testCaseApi,
  toApiInput,
  toUiTestCase,
  toTestCaseInput,
  type GeneratedTestCase,
} from '@/backend/lib/test-case-api';
import {
  TestCaseFilters,
  emptyFilters,
  type TestCaseFiltersState,
} from '@/components/test-cases/TestCaseFilters';
import { SummaryCards } from '@/components/test-cases/SummaryCards';
import { TestCaseTable } from '@/components/test-cases/TestCaseTable';
import { TestCaseDetail } from '@/components/test-cases/TestCaseDetail';
import {
  CreateTestCaseModal,
  type CreateTestCaseInput,
} from '@/components/test-cases/CreateTestCaseModal';
import { AITestGenerator } from '@/components/test-cases/AITestGenerator';
import { DeleteTestCaseDialog } from '@/components/test-cases/DeleteTestCaseDialog';
import type { TestCase } from '@/types';

const PAGE_SIZE = 8;

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.';
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading test cases">
      <div className="h-8 w-48 rounded-lg bg-surface animate-pulse" />
      <div className="h-20 rounded-xl bg-surface border border-border animate-pulse" />
      <div className="h-96 rounded-xl bg-surface border border-border animate-pulse" />
    </div>
  );
}

function ErrorState({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="rounded-xl bg-surface border border-danger/30 p-14 text-center">
      <h3 className="text-lg font-semibold text-foreground">Unable to load test cases</h3>
      <p className="text-sm text-secondary-text mt-1.5">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export default function TestCasesPage() {
  const { user } = useAuth();

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [filters, setFilters] = useState<TestCaseFiltersState>(emptyFilters);
  const [page, setPage] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<TestCase | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TestCase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestCase | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const author = user?.name || 'Yazhini Raj';

  const loadTestCases = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await testCaseApi.list();
      setTestCases(response.map(toUiTestCase));
      setPage(1);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTestCases();
  }, [loadTestCases]);

  const filtered = useMemo(() => {
    let list = [...testCases];

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (tc) =>
          tc.title.toLowerCase().includes(q) ||
          tc.id.toLowerCase().includes(q) ||
          tc.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters.status)
      list = list.filter((tc) => tc.status === filters.status);
    if (filters.priority)
      list = list.filter((tc) => tc.priority === filters.priority);
    if (filters.type) list = list.filter((tc) => tc.type === filters.type);
    if (filters.framework)
      list = list.filter((tc) => tc.framework === filters.framework);

    switch (filters.sort) {
      case 'oldest':
        list.sort((a, b) => a.lastUpdated.localeCompare(b.lastUpdated));
        break;
      case 'priority': {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        list.sort(
          (a, b) => order[a.priority] - order[b.priority]
        );
        break;
      }
      case 'status': {
        const order = {
          Failed: 0,
          Blocked: 1,
          Ready: 2,
          Draft: 3,
          Passed: 4,
        };
        list.sort(
          (a, b) =>
            (order[a.status] ?? 5) - (order[b.status] ?? 5)
        );
        break;
      }
      default:
        list.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    }

    return list;
  }, [testCases, filters]);

  const counts = useMemo(() => {
    const automated = testCases.filter((tc) => tc.framework !== 'Manual').length;
    const manual = testCases.filter((tc) => tc.framework === 'Manual').length;
    return {
      total: testCases.length,
      automated,
      manual,
      coverage: '87.4%',
    };
  }, [testCases]);

  const resetPage = useCallback(() => setPage(1), []);

  const handleSelect = (tc: TestCase) => {
    setSelected(tc);
    setDetailOpen(true);
  };

  const openCreateModal = () => {
    setEditTarget(null);
    setCreateOpen(true);
  };

  const handleCreate = async (data: CreateTestCaseInput) => {
    const target = editTarget;
    const uiInput: TestCase = {
      id: target?.id ?? '',
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      framework: data.framework,
      status: target?.status ?? 'Draft',
      lastUpdated: target?.lastUpdated ?? '',
      preconditions: data.preconditions,
      steps: data.steps.split('\n').map((step) => step.trim()).filter(Boolean),
      expectedResult: data.expectedResult,
      tags: data.tags,
      createdBy: target?.createdBy ?? author,
    };

    setSavingAction(target ? `edit:${target.id}` : 'create');
    try {
      const response = target
        ? await testCaseApi.update(target.id, toApiInput(uiInput))
        : await testCaseApi.create(toApiInput(uiInput));
      const saved = toUiTestCase(response);
      setTestCases((prev) =>
        target ? prev.map((tc) => (tc.id === saved.id ? saved : tc)) : [saved, ...prev]
      );
      setSelected(target ? saved : null);
      setEditTarget(null);
      setCreateOpen(false);
      resetPage();
      toast.success(target ? 'Test case updated successfully.' : 'Test case created successfully.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingAction(null);
    }
  };

  const handleRun = (tc: TestCase) => {
    toast.info(
      `Running ${tc.id}${tc.framework !== 'Manual' ? ` with ${tc.framework}` : ' manually'}...`
    );
  };

  const handleEdit = (tc: TestCase) => {
    setDetailOpen(false);
    setEditTarget(tc);
    setCreateOpen(true);
  };

  const handleDuplicate = async (tc: TestCase) => {
    setSavingAction(`duplicate:${tc.id}`);
    try {
      const response = await testCaseApi.duplicate(tc.id);
      const duplicate = toUiTestCase(response);
      setTestCases((prev) => [duplicate, ...prev]);
      setDetailOpen(false);
      resetPage();
      toast.success(`Duplicated ${tc.id} as ${duplicate.id}.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingAction(null);
    }
  };

  const handleDeleteConfirm = async (tc: TestCase) => {
    setSavingAction(`delete:${tc.id}`);
    try {
      const response = await testCaseApi.remove(tc.id);
      setTestCases((prev) => prev.filter((item) => item.id !== response.id));
      setDeleteTarget(null);
      setDetailOpen(false);
      toast.success(`${tc.id} deleted successfully.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingAction(null);
    }
  };

  const saveApprovedCases = async (approved: GeneratedTestCase[]) => {
    const saved: TestCase[] = [];
    const failures: string[] = [];
    for (const generated of approved) {
      try {
        const response = await testCaseApi.create(
          toTestCaseInput(generated, author)
        );
        saved.push(toUiTestCase(response));
      } catch (error) {
        failures.push(errorMessage(error));
      }
    }
    if (saved.length > 0) {
      setTestCases((prev) => [...saved, ...prev]);
      resetPage();
    }

    if (saved.length > 0) {
      toast.success(
        `${saved.length} test case${saved.length === 1 ? '' : 's'} saved.`
      );
    }
    if (failures.length > 0) {
      toast.error(
        `${failures.length} case${failures.length === 1 ? '' : 's'} could not be saved. ${failures[0]}`
      );
    }
  };

  if (loading) {
    return <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in"><LoadingState /></div>;
  }

  if (loadError) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
        <ErrorState message={loadError} onRetry={() => void loadTestCases()} />
      </div>
    );
  }

  const showEmpty = testCases.length === 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Test Cases
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Design, manage and generate intelligent test scenarios.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Test Case
          </button>
          <button
            onClick={() => setAiOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </button>
        </div>
      </div>

      <SummaryCards
        total={counts.total}
        automated={counts.automated}
        manual={counts.manual}
        coverage={counts.coverage}
      />

      <TestCaseFilters
        filters={filters}
        onChange={(f) => {
          setFilters(f);
          resetPage();
        }}
      />

      {showEmpty ? (
        <div className="rounded-xl bg-surface border border-border p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-elevated border border-border flex items-center justify-center mb-5">
            <Sparkles className="w-6 h-6 text-primary-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No test cases yet
          </h3>
          <p className="text-sm text-secondary-text mt-1.5 max-w-sm mx-auto">
            Create your first test case or let AI generate scenarios from a
            requirement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Test Case
            </button>
            <button
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </button>
          </div>
        </div>
      ) : (
        <TestCaseTable
          testCases={filtered}
          onSelect={handleSelect}
          onRun={handleRun}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={(tc) => setDeleteTarget(tc)}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <TestCaseDetail
        testCase={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={(tc) => setDeleteTarget(tc)}
        onRun={handleRun}
      />

      <CreateTestCaseModal
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setEditTarget(null);
        }}
        onCreate={handleCreate}
        saving={savingAction === 'create' || editTarget !== null && savingAction === `edit:${editTarget.id}`}
        initial={
          editTarget
            ? {
                title: editTarget.title,
                description: editTarget.description,
                type: editTarget.type,
                priority: editTarget.priority,
                framework: editTarget.framework,
                preconditions: editTarget.preconditions,
                steps: editTarget.steps.join('\n'),
                expectedResult: editTarget.expectedResult,
                tags: editTarget.tags,
              }
            : null
        }
      />

      <AITestGenerator
        open={aiOpen}
        onOpenChange={setAiOpen}
        onApprove={saveApprovedCases}
      />

      <DeleteTestCaseDialog
        testCase={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        saving={deleteTarget !== null && savingAction === `delete:${deleteTarget.id}`}
      />
    </div>
  );
}
