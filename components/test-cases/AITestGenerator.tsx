'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sparkles,
  X,
  RefreshCw,
  Check,
  Loader2,
  Wand2,
  AlertCircle,
} from 'lucide-react';
import {
  typeOptions,
  frameworkOptions,
  priorityOptions,
} from '@/data/testCaseOptions';
import { TypeBadge, PriorityBadge, FrameworkBadge } from './badges';
import { ApiError } from '@/backend/lib/api-client';
import {
  testCaseApi,
  type GeneratedTestCase,
} from '@/backend/lib/test-case-api';
import type {
  TestCaseType,
  TestFramework,
  TestCasePriority,
} from '@/types';

interface AITestGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (cases: GeneratedTestCase[]) => void | Promise<void>;
}

const scenarioCounts = [5, 10];

const MIN_REQUIREMENT_LENGTH = 10;

function toPercent(confidence: number) {
  const clamped = Math.min(Math.max(confidence, 0), 1);
  return Math.round(clamped * 100);
}

function narrow<T extends string>(
  value: string,
  options: readonly T[],
  fallback: T
): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function messageFor(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

const inputClass =
  'w-full h-11 px-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

export function AITestGenerator({
  open,
  onOpenChange,
  onApprove,
}: AITestGeneratorProps) {
  const [requirement, setRequirement] = useState('');
  const [type, setType] = useState<TestCaseType>('Functional');
  const [framework, setFramework] = useState<TestFramework>('Playwright');
  const [count, setCount] = useState(5);
  const [requirementError, setRequirementError] = useState('');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<GeneratedTestCase[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approved, setApproved] = useState<Set<string>>(new Set());

  const reset = () => {
    setRequirement('');
    setType('Functional');
    setFramework('Playwright');
    setCount(5);
    setRequirementError('');
    setGenerateError(null);
    setGenerating(false);
    setSaving(false);
    setResults(null);
    setSelected(new Set());
    setApproved(new Set());
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const generate = async () => {
    const trimmed = requirement.trim();
    if (trimmed.length < MIN_REQUIREMENT_LENGTH) {
      setRequirementError(
        `Please describe the requirement or user story in at least ${MIN_REQUIREMENT_LENGTH} characters.`
      );
      return;
    }
    setRequirementError('');
    setGenerateError(null);
    setGenerating(true);
    setResults(null);
    setSelected(new Set());
    setApproved(new Set());
    try {
      const response = await testCaseApi.generate({
        requirement: trimmed,
        type,
        framework,
        count,
      });
      setResults(response.testCases);
    } catch (error) {
      setGenerateError(messageFor(error));
    } finally {
      setGenerating(false);
    }
  };

  const pending = results?.filter((r) => !approved.has(r.id)) ?? [];
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedCases = results?.filter((r) => selected.has(r.id)) ?? [];

  const approveSelected = async () => {
    if (selectedCases.length === 0) return;
    setSaving(true);
    try {
      await onApprove(selectedCases);
      setApproved((prev) => {
        const next = new Set(prev);
        selectedCases.forEach((c) => next.add(c.id));
        return next;
      });
      setSelected(new Set());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin bg-background">
        <DialogHeader className="text-left pr-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-primary-accent">
              AI Test Case Generator
            </span>
          </div>
          <DialogTitle className="text-xl">
            Turn requirements into structured QA scenarios.
          </DialogTitle>
          <DialogDescription>
            Describe what should happen and let AI build the test scenarios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Requirement / User Story
              <span className="text-danger ml-0.5">*</span>
            </label>
            <textarea
              value={requirement}
              onChange={(e) => {
                setRequirement(e.target.value);
                if (requirementError) setRequirementError('');
              }}
              placeholder="As a customer, I should be able to reset my password using my registered email."
              rows={4}
              disabled={generating || saving}
              className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-60"
            />
            {requirementError && (
              <p className="text-danger text-xs mt-1.5">{requirementError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Test Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestCaseType)}
                disabled={generating || saving}
                className={inputClass}
              >
                {typeOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Framework
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value as TestFramework)}
                disabled={generating || saving}
                className={inputClass}
              >
                {frameworkOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Number of scenarios
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={generating || saving}
                className={inputClass}
              >
                {scenarioCounts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {generating && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl bg-elevated border border-border p-5 flex items-center gap-3"
            >
              <Loader2 className="w-5 h-5 text-primary-accent animate-spin shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Generating test cases...
                </p>
                <p className="text-xs text-muted-text mt-0.5">
                  Calling the AI service on our backend. This usually takes a few
                  seconds.
                </p>
              </div>
            </div>
          )}

          {generateError && !generating && (
            <div
              role="alert"
              className="rounded-xl bg-surface border border-danger/30 p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Could not generate test cases
                </p>
                <p className="text-xs text-secondary-text mt-1 break-words">
                  {generateError}
                </p>
                <button
                  onClick={() => void generate()}
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-elevated border border-border text-xs font-medium text-foreground hover:bg-surface transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try again
                </button>
              </div>
            </div>
          )}

          {results && !generating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-secondary-text">
                  <span className="text-foreground font-semibold">
                    {results.length} test case{results.length === 1 ? '' : 's'}{' '}
                    generated
                  </span>{' '}
                  — review and approve the ones to keep
                </div>
                <div className="text-xs text-muted-text shrink-0">
                  {framework} · {type}
                </div>
              </div>

              {results.length === 0 ? (
                <div className="rounded-xl bg-elevated border border-border p-6 text-center">
                  <p className="text-sm text-secondary-text">
                    The AI service returned no test cases for this requirement.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() =>
                        setSelected(
                          pending.length === 0
                            ? new Set()
                            : new Set(pending.map((c) => c.id))
                        )
                      }
                      className="text-xs font-medium text-primary-accent hover:underline disabled:opacity-50"
                      disabled={saving || pending.length === 0}
                    >
                      {pending.length === 0 ? 'Clear selection' : 'Select all'}
                    </button>
                    <span className="text-xs text-muted-text">
                      {selected.size} of {results.length} selected
                    </span>
                  </div>

                  <div className="space-y-2">
                    {results.map((r) => {
                      const isApproved = approved.has(r.id);
                      const isSelected = selected.has(r.id);
                      return (
                        <div
                          key={r.id}
                          className="rounded-xl bg-elevated border border-border p-3.5 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              className="mt-0.5"
                              checked={isSelected}
                              disabled={saving || isApproved}
                              onCheckedChange={() => toggle(r.id)}
                              aria-label={`Select ${r.title}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <TypeBadge
                                  type={narrow(
                                    r.type,
                                    typeOptions,
                                    'Functional'
                                  )}
                                />
                                <PriorityBadge
                                  priority={narrow(
                                    r.priority,
                                    priorityOptions,
                                    'Medium'
                                  )}
                                />
                                <FrameworkBadge
                                  framework={narrow(
                                    r.framework,
                                    frameworkOptions,
                                    framework
                                  )}
                                />
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                {r.title}
                              </p>
                              {r.description && (
                                <p className="text-xs text-secondary-text mt-1.5">
                                  {r.description}
                                </p>
                              )}
                              {r.steps.length > 0 && (
                                <ol className="mt-2 space-y-1">
                                  {r.steps.map((step, i) => (
                                    <li
                                      key={`${r.id}-step-${i}`}
                                      className="text-xs text-muted-text flex gap-2"
                                    >
                                      <span className="font-mono shrink-0">
                                        {i + 1}.
                                      </span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              )}
                              {r.expectedResult && (
                                <p className="text-xs text-muted-text mt-2">
                                  <span className="text-secondary-text font-medium">
                                    Expected:
                                  </span>{' '}
                                  {r.expectedResult}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-semibold text-success">
                                  {toPercent(r.confidence)}%
                                </div>
                                <div className="text-[10px] text-muted-text uppercase tracking-wider">
                                  AI Confidence
                                </div>
                              </div>
                              {isApproved && (
                                <span
                                  title="Approved and saved"
                                  className="flex items-center justify-center w-7 h-7 rounded-full bg-success/15 text-success"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border sm:justify-end">
                    <button
                      onClick={() => void approveSelected()}
                      disabled={saving || selected.size === 0}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {saving
                        ? 'Saving...'
                        : `Approve & Save${
                            selected.size ? ` (${selected.size})` : ''
                          }`}
                    </button>
                    <button
                      onClick={() => void generate()}
                      disabled={generating || saving}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={() => handleOpenChange(false)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-elevated border border-border text-secondary-text text-sm font-medium hover:bg-surface transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!results && !generating && !generateError && (
            <button
              onClick={() => void generate()}
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Wand2 className="w-4 h-4" />
              Generate Test Cases
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}