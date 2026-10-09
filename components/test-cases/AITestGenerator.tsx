'use client';

import { useState, type ReactNode } from 'react';
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
  Globe,
  FileText,
  Search,
  Pencil,
  Link2,
  ListChecks,
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
import {
  urlAnalysisApi,
  type WebsiteAnalysisData,
} from '@/backend/lib/url-analysis-api';
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

type Source = 'requirement' | 'website';

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

/**
 * The analysis is round-tripped to the generation endpoint. Bound it so a
 * control-heavy page cannot exceed the server's request size limit.
 */
function trimAnalysisForGeneration(a: WebsiteAnalysisData): WebsiteAnalysisData {
  return {
    ...a,
    pages: a.pages.slice(0, 10),
    headings: a.headings.slice(0, 30),
    text: a.text.slice(0, 2000),
    forms: a.forms.slice(0, 10),
    formsDetail: a.formsDetail.slice(0, 10).map((f) => ({
      ...f,
      fields: f.fields.slice(0, 20),
    })),
    actions: a.actions.slice(0, 30),
    interactiveElements: a.interactiveElements.slice(0, 40),
    buttons: a.buttons.slice(0, 30),
    links: a.links.slice(0, 40),
    inputs: a.inputs.slice(0, 40),
  };
}

const inputClass =
  'w-full h-11 px-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

const textareaClass =
  'w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-60';

function AnalysisSummary({ analysis }: { analysis: WebsiteAnalysisData }) {
  const stats = [
    { label: 'Pages', value: analysis.pages.length },
    { label: 'Forms', value: analysis.formsDetail.length },
    { label: 'Inputs', value: analysis.inputs.length },
    { label: 'Buttons', value: analysis.buttons.length },
    { label: 'Links', value: analysis.links.length },
    { label: 'Headings', value: analysis.headings.length },
  ];

  return (
    <div className="rounded-xl bg-elevated border border-border p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/15 text-success shrink-0 mt-0.5">
          <Check className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground break-words">
            {analysis.title || analysis.url}
          </p>
          <p className="text-xs text-muted-text break-all mt-0.5">
            Inspected: {analysis.url}
          </p>
          <p className="text-[11px] text-muted-text mt-0.5">
            {analysis.inspectedPages} page{analysis.inspectedPages === 1 ? '' : 's'}{' '}
            inspected live
            {analysis.truncated ? ' (limited by configuration)' : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {stats.map((s) => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] text-secondary-text"
          >
            <span className="font-semibold text-foreground">{s.value}</span>
            {s.label}
          </span>
        ))}
      </div>

      {analysis.warnings.length > 0 && (
        <ul className="space-y-1">
          {analysis.warnings.map((w, i) => (
            <li
              key={`warn-${i}`}
              className="text-[11px] text-secondary-text flex gap-1.5"
            >
              <AlertCircle className="w-3 h-3 text-warning mt-0.5 shrink-0" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2.5 pt-1">
        {analysis.pages.length > 0 && (
          <DetailList
            icon={<Globe className="w-3.5 h-3.5" />}
            title="Discovered pages"
            items={analysis.pages}
            render={(p) => p}
          />
        )}
        {analysis.formsDetail.length > 0 && (
          <DetailList
            icon={<ListChecks className="w-3.5 h-3.5" />}
            title="Forms"
            items={analysis.formsDetail}
            render={(f) =>
              `${f.method} ${f.action || '(self)'} — ${
                f.fields.map((x) => x.label || x.name || x.type).join(', ') || 'no fields'
              }`
            }
          />
        )}
        {analysis.inputs.length > 0 && (
          <DetailList
            icon={<FileText className="w-3.5 h-3.5" />}
            title="Input fields"
            items={analysis.inputs}
            render={(f) =>
              `${f.label || f.name || f.type} [${f.type}]${f.required ? ' • required' : ''}`
            }
          />
        )}
        {analysis.buttons.length > 0 && (
          <DetailList
            icon={<Search className="w-3.5 h-3.5" />}
            title="Buttons"
            items={analysis.buttons}
            render={(b) => b.accessibleName || b.text || '(unnamed)'}
          />
        )}
        {analysis.links.length > 0 && (
          <DetailList
            icon={<Link2 className="w-3.5 h-3.5" />}
            title="Links"
            items={analysis.links}
            render={(l) => `${l.text || '(no text)'} → ${l.href}`}
          />
        )}
      </div>
    </div>
  );
}

function DetailList<T>({
  icon,
  title,
  items,
  render,
}: {
  icon: ReactNode;
  title: string;
  items: T[];
  render: (item: T) => string;
}) {
  const shown = items.slice(0, 8);
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-text mb-1 inline-flex items-center gap-1.5">
        {icon}
        {title} ({items.length})
      </p>
      <ul className="space-y-0.5">
        {shown.map((item, i) => (
          <li
            key={`${title}-${i}`}
            className="text-xs text-secondary-text break-words"
          >
            {render(item)}
          </li>
        ))}
        {items.length > shown.length && (
          <li className="text-[11px] text-muted-text">
            +{items.length - shown.length} more
          </li>
        )}
      </ul>
    </div>
  );
}

export function AITestGenerator({
  open,
  onOpenChange,
  onApprove,
}: AITestGeneratorProps) {
  const [source, setSource] = useState<Source>('requirement');
  const [requirement, setRequirement] = useState('');
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<WebsiteAnalysisData | null>(null);
  const [analyzeProvider, setAnalyzeProvider] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState('');

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
  const [editingId, setEditingId] = useState<string | null>(null);

  const busy = generating || saving || analyzing;

  const reset = () => {
    setSource('requirement');
    setRequirement('');
    setUrl('');
    setAnalysis(null);
    setAnalyzeProvider('');
    setAnalyzing(false);
    setAnalyzeError(null);
    setUrlError('');
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
    setEditingId(null);
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const changeSource = (next: Source) => {
    if (next === source) return;
    setSource(next);
    setRequirementError('');
    setUrlError('');
    setAnalyzeError(null);
    setGenerateError(null);
    setResults(null);
    setSelected(new Set());
    setApproved(new Set());
    setEditingId(null);
  };

  const clearResults = () => {
    setResults(null);
    setSelected(new Set());
    setApproved(new Set());
    setEditingId(null);
  };

  const analyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlError('Enter a website URL to analyze.');
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setUrlError('Enter a valid URL including http:// or https://.');
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      setUrlError('Only http:// and https:// URLs can be analyzed.');
      return;
    }
    setUrlError('');
    setAnalyzeError(null);
    setAnalyzing(true);
    setAnalysis(null);
    setResults(null);
    setSelected(new Set());
    setApproved(new Set());
    try {
      const response = await urlAnalysisApi.analyze({ url: trimmed });
      setAnalysis(response.analysis);
      setAnalyzeProvider(response.provider);
    } catch (error) {
      setAnalyzeError(messageFor(error));
    } finally {
      setAnalyzing(false);
    }
  };

  const generate = async () => {
    if (source === 'website') {
      if (!analysis) return;
      setGenerateError(null);
      setGenerating(true);
      clearResults();
      try {
        const response = await testCaseApi.generate({
          website: trimAnalysisForGeneration(analysis),
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
      return;
    }

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
    clearResults();
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

  const updateResult = (id: string, patch: Partial<GeneratedTestCase>) =>
    setResults((prev) =>
      prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev
    );

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

  const canGenerate = source === 'website' ? Boolean(analysis) : true;

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
            {source === 'website'
              ? 'Inspect a website and generate grounded QA scenarios.'
              : 'Turn requirements into structured QA scenarios.'}
          </DialogTitle>
          <DialogDescription>
            {source === 'website'
              ? 'Enter a public URL, inspect it live and generate tests from the discovered pages and controls.'
              : 'Describe what should happen and let AI build the test scenarios.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Source selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Source
            </label>
            <div className="grid grid-cols-2 gap-2" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={source === 'website'}
                onClick={() => changeSource('website')}
                disabled={busy}
                className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
                  source === 'website'
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-surface border-border text-secondary-text hover:bg-elevated'
                }`}
              >
                <Globe className="w-4 h-4" />
                Website URL
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={source === 'requirement'}
                onClick={() => changeSource('requirement')}
                disabled={busy}
                className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
                  source === 'requirement'
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-surface border-border text-secondary-text hover:bg-elevated'
                }`}
              >
                <FileText className="w-4 h-4" />
                Requirement / User Story
              </button>
            </div>
          </div>

          {/* Website source */}
          {source === 'website' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Website URL
                  <span className="text-danger ml-0.5">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (urlError) setUrlError('');
                    }}
                    placeholder="https://example.com"
                    disabled={busy}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => void analyze()}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    {analyzing ? 'Analyzing...' : 'Analyze Website'}
                  </button>
                </div>
                {urlError && (
                  <p className="text-danger text-xs mt-1.5">{urlError}</p>
                )}
                <p className="text-[11px] text-muted-text mt-1.5">
                  Only public http/https sites are inspected. Local, private and
                  internal addresses are blocked.
                </p>
              </div>

              {analyzing && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl bg-elevated border border-border p-5 flex items-center gap-3"
                >
                  <Loader2 className="w-5 h-5 text-primary-accent animate-spin shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Inspecting the website...
                    </p>
                    <p className="text-xs text-muted-text mt-0.5">
                      Loading the page with a headless browser and collecting
                      headings, forms, inputs, buttons and links.
                    </p>
                  </div>
                </div>
              )}

              {analyzeError && !analyzing && (
                <div
                  role="alert"
                  className="rounded-xl bg-surface border border-danger/30 p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Could not analyze the website
                    </p>
                    <p className="text-xs text-secondary-text mt-1 break-words">
                      {analyzeError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void analyze()}
                      className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-elevated border border-border text-xs font-medium text-foreground hover:bg-surface transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {analysis && !analyzing && (
                <div className="space-y-2">
                  <AnalysisSummary analysis={analysis} />
                  {analyzeProvider && (
                    <p className="text-[11px] text-muted-text">
                      Analysis provider: {analyzeProvider}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Requirement source */}
          {source === 'requirement' && (
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
                disabled={busy}
                className={textareaClass}
              />
              {requirementError && (
                <p className="text-danger text-xs mt-1.5">{requirementError}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Test Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestCaseType)}
                disabled={busy}
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
                disabled={busy}
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
                disabled={busy}
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
                  type="button"
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
                    {source === 'website'
                      ? 'No test cases could be generated from this inspection. The site may expose too little structure. Try another page or a requirement instead.'
                      : 'The AI service returned no test cases for this requirement.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
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
                      const isEditing = editingId === r.id;
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
                                {r.targetPage && (
                                  <span className="text-[10px] text-muted-text break-all">
                                    {r.targetPage}
                                  </span>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="space-y-2 mt-2">
                                  <input
                                    value={r.title}
                                    onChange={(e) =>
                                      updateResult(r.id, {
                                        title: e.target.value,
                                      })
                                    }
                                    disabled={saving}
                                    aria-label="Case title"
                                    className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                                  />
                                  <select
                                    value={narrow(
                                      r.priority,
                                      priorityOptions,
                                      'Medium'
                                    )}
                                    onChange={(e) =>
                                      updateResult(r.id, {
                                        priority: e.target
                                          .value as TestCasePriority,
                                      })
                                    }
                                    disabled={saving}
                                    aria-label="Case priority"
                                    className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                                  >
                                    {priorityOptions.map((p) => (
                                      <option key={p} value={p}>
                                        {p}
                                      </option>
                                    ))}
                                  </select>
                                  <textarea
                                    value={r.description}
                                    onChange={(e) =>
                                      updateResult(r.id, {
                                        description: e.target.value,
                                      })
                                    }
                                    disabled={saving}
                                    rows={2}
                                    placeholder="Description"
                                    className={textareaClass}
                                  />
                                  <textarea
                                    value={r.steps.join('\n')}
                                    onChange={(e) =>
                                      updateResult(r.id, {
                                        steps: e.target.value
                                          .split('\n')
                                          .map((s) => s.trim())
                                          .filter(Boolean),
                                      })
                                    }
                                    disabled={saving}
                                    rows={3}
                                    placeholder="One step per line"
                                    className={textareaClass}
                                  />
                                  <textarea
                                    value={r.expectedResult}
                                    onChange={(e) =>
                                      updateResult(r.id, {
                                        expectedResult: e.target.value,
                                      })
                                    }
                                    disabled={saving}
                                    rows={2}
                                    placeholder="Expected result"
                                    className={textareaClass}
                                  />
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-foreground">
                                    {r.title}
                                  </p>
                                  {r.description && (
                                    <p className="text-xs text-secondary-text mt-1.5 whitespace-pre-line">
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
                                  {r.evidence && (
                                    <p className="text-[11px] text-muted-text mt-1.5 break-words">
                                      <span className="text-secondary-text font-medium">
                                        Evidence:
                                      </span>{' '}
                                      {r.evidence}
                                    </p>
                                  )}
                                  {r.tags && r.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {r.tags.map((t) => (
                                        <span
                                          key={`${r.id}-${t}`}
                                          className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-muted-text"
                                        >
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </>
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
                              {!isApproved && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingId(isEditing ? null : r.id)
                                  }
                                  disabled={saving}
                                  aria-label={
                                    isEditing ? 'Done editing' : `Edit ${r.title}`
                                  }
                                  className="flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-border text-secondary-text hover:text-foreground transition-colors disabled:opacity-50"
                                >
                                  {isEditing ? (
                                    <Check className="w-3.5 h-3.5" />
                                  ) : (
                                    <Pencil className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
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
                      type="button"
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
                      type="button"
                      onClick={() => void generate()}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      type="button"
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

          {!results && !generating && !generateError && canGenerate && (
            <button
              type="button"
              onClick={() => void generate()}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              {source === 'website'
                ? 'Generate Test Cases from Analysis'
                : 'Generate Test Cases'}
            </button>
          )}

          {!results &&
            !generating &&
            !generateError &&
            source === 'website' &&
            !analysis && (
              <p className="text-xs text-muted-text text-center">
                Analyze a website above to unlock test case generation.
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
