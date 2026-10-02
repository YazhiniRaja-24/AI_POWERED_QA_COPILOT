'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AlertTriangle, X } from 'lucide-react';
import type { TestCase } from '@/types';

interface DeleteTestCaseDialogProps {
  testCase: TestCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (testCase: TestCase) => void | Promise<void>;
  saving?: boolean;
}

export function DeleteTestCaseDialog({
  testCase,
  open,
  onOpenChange,
  onConfirm,
  saving = false,
}: DeleteTestCaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader className="text-left">
          <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <DialogTitle className="text-xl">Delete test case?</DialogTitle>
          <DialogDescription className="mt-2">
            This will permanently remove{' '}
            <span className="text-foreground font-medium">
              {testCase?.id} · {testCase?.title}
            </span>{' '}
            from your test suite. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4 pt-4 border-t border-border">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={() => testCase && onConfirm(testCase)}
            disabled={saving}
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-danger text-white text-sm font-medium hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? 'Deleting…' : 'Delete Test Case'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
