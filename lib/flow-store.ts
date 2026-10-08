import { useSyncExternalStore } from 'react';

/**
 * Lightweight client-side store for the showcase prototype flow:
 * test data → automation → execution → failure analysis.
 * Persisted in localStorage so state survives navigation and reloads.
 */

export interface TestDataField {
  name: string;
  value: string;
}

export interface TestDataRecord {
  id: string;
  testCaseId: string;
  testCaseTitle: string;
  setNumber: number;
  fields: TestDataField[];
  expected: string;
  status: 'generated' | 'approved';
  createdAt: string;
}

export interface RunStepResult {
  testCaseId: string;
  title: string;
  framework: string;
  status: 'passed' | 'failed';
  duration: string;
  expected: string;
  actual: string;
}

export interface RunRecord {
  id: string;
  name: string;
  framework: string;
  createdAt: string;
  total: number;
  revealed: number;
  results: RunStepResult[];
  status: 'Passed' | 'Failed' | 'Running';
  duration: string;
}

export interface FailureAnalysis {
  id: string;
  runId: string;
  testCaseId: string;
  testTitle: string;
  category: string;
  rootCause: string;
  likelihood: string;
  recommendation: string;
  patch: string;
  confidence: number;
  provider: string;
  createdAt: string;
}

export interface FlowState {
  dataRecords: TestDataRecord[];
  runs: RunRecord[];
  analyses: FailureAnalysis[];
}

const STORAGE_KEY = 'qa_copilot_flow_v1';

const EMPTY: FlowState = { dataRecords: [], runs: [], analyses: [] };

let state: FlowState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — demo continues in-memory */
  }
}

function setState(next: FlowState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FlowState>;
      state = {
        dataRecords: Array.isArray(parsed.dataRecords) ? parsed.dataRecords : [],
        runs: Array.isArray(parsed.runs) ? parsed.runs : [],
        analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
      };
    }
  } catch {
    state = EMPTY;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!hydrated) {
    hydrate();
    listeners.forEach((l) => l());
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useFlowState(): FlowState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function newId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}

/* ---------------- Test data ---------------- */

export function addDataRecords(records: TestDataRecord[]) {
  const existing = new Set(state.dataRecords.map((r) => r.id));
  const fresh = records.filter((r) => !existing.has(r.id));
  if (fresh.length === 0) return;
  setState({ ...state, dataRecords: [...fresh, ...state.dataRecords] });
}

export function setDataRecordStatus(id: string, status: TestDataRecord['status']) {
  setState({
    ...state,
    dataRecords: state.dataRecords.map((r) => (r.id === id ? { ...r, status } : r)),
  });
}

export function removeDataRecord(id: string) {
  setState({ ...state, dataRecords: state.dataRecords.filter((r) => r.id !== id) });
}

/* ---------------- Runs ---------------- */

export function addRun(run: RunRecord) {
  setState({ ...state, runs: [run, ...state.runs] });
}

export function patchRun(id: string, patch: Partial<RunRecord>) {
  setState({
    ...state,
    runs: state.runs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  });
}

/* ---------------- Analyses ---------------- */

export function addAnalysis(analysis: FailureAnalysis) {
  const withoutDupes = state.analyses.filter(
    (a) => !(a.runId === analysis.runId && a.testCaseId === analysis.testCaseId)
  );
  setState({ ...state, analyses: [analysis, ...withoutDupes] });
}

/* ---------------- Derived helpers ---------------- */

export function runCounts(run: RunRecord) {
  const revealed = run.results.slice(0, run.revealed);
  return {
    passed: revealed.filter((r) => r.status === 'passed').length,
    failed: revealed.filter((r) => r.status === 'failed').length,
  };
}

export function failedResults(runs: RunRecord[]) {
  return runs.flatMap((run) =>
    run.results
      .filter((r) => r.status === 'failed')
      .map((r) => ({ run, result: r }))
  );
}
