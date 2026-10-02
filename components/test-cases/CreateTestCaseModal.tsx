'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import {
  typeOptions,
  priorityOptions,
  frameworkOptions,
} from '@/data/testCaseOptions';
import type {
  TestCaseType,
  TestCasePriority,
  TestFramework,
} from '@/types';

export interface CreateTestCaseInput {
  title: string;
  description: string;
  type: TestCaseType;
  priority: TestCasePriority;
  framework: TestFramework;
  preconditions: string;
  steps: string;
  expectedResult: string;
  tags: string[];
}

interface CreateTestCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateTestCaseInput) => void | Promise<void>;
  initial?: Partial<CreateTestCaseInput> | null;
  saving?: boolean;
}

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-danger text-xs mt-1.5">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full h-11 px-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

const textareaClass =
  'w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none';

export function CreateTestCaseModal({
  open,
  onOpenChange,
  onCreate,
  initial,
  saving = false,
}: CreateTestCaseModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TestCaseType | ''>('Functional');
  const [priority, setPriority] = useState<TestCasePriority | ''>(
    'Medium'
  );
  const [framework, setFramework] = useState<TestFramework | ''>('Playwright');
  const [preconditions, setPreconditions] = useState('');
  const [steps, setSteps] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setType(initial?.type ?? 'Functional');
    setPriority(initial?.priority ?? 'Medium');
    setFramework(initial?.framework ?? 'Playwright');
    setPreconditions(initial?.preconditions ?? '');
    setSteps(initial?.steps ?? '');
    setExpectedResult(initial?.expectedResult ?? '');
    setTags(initial?.tags ? initial.tags.join(', ') : '');
    setErrors({});
  };

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setDescription(initial?.description ?? '');
      setType(initial?.type ?? 'Functional');
      setPriority(initial?.priority ?? 'Medium');
      setFramework(initial?.framework ?? 'Playwright');
      setPreconditions(initial?.preconditions ?? '');
      setSteps(initial?.steps ?? '');
      setExpectedResult(initial?.expectedResult ?? '');
      setTags(initial?.tags ? initial.tags.join(', ') : '');
      setErrors({});
    }
  }, [open, initial]);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!type) e.type = 'Test type is required';
    if (!priority) e.priority = 'Priority is required';
    if (!framework) e.framework = 'Framework is required';
    if (!steps.trim()) e.steps = 'At least one test step is required';
    if (!expectedResult.trim()) e.expectedResult = 'Expected result is required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    void onCreate({
      title: title.trim(),
      description: description.trim(),
      type: type as TestCaseType,
      priority: priority as TestCasePriority,
      framework: framework as TestFramework,
      preconditions: preconditions.trim(),
      steps: steps.trim(),
      expectedResult: expectedResult.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-background">
        <DialogHeader className="text-left pr-8">
          <DialogTitle className="text-xl">
            {initial ? 'Edit Test Case' : 'New Test Case'}
          </DialogTitle>
          <DialogDescription>
            Define a structured QA scenario for your test suite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Title" required error={errors.title}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Verify successful user login"
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the behaviour being verified..."
              rows={2}
              className={textareaClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Test Type" required error={errors.type}>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestCaseType)}
                className={inputClass}
              >
                {typeOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority" required error={errors.priority}>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TestCasePriority)
                }
                className={inputClass}
              >
                {priorityOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Framework" required error={errors.framework}>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value as TestFramework)}
                className={inputClass}
              >
                {frameworkOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Preconditions">
            <textarea
              value={preconditions}
              onChange={(e) => setPreconditions(e.target.value)}
              placeholder="User account exists and is active."
              rows={2}
              className={textareaClass}
            />
          </Field>

          <Field label="Test Steps" required error={errors.steps}>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={'1. Open login page\n2. Enter valid credentials\n3. Click Sign In'}
              rows={4}
              className={textareaClass}
            />
          </Field>

          <Field label="Expected Result" required error={errors.expectedResult}>
            <textarea
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="User is authenticated and redirected to the dashboard."
              rows={2}
              className={textareaClass}
            />
          </Field>

          <Field label="Tags">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="auth, smoke, login (comma separated)"
              className={inputClass}
            />
          </Field>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-border sm:justify-end gap-2">
          <button
            onClick={() => handleOpenChange(false)}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Test Case'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
