import type { TestCase } from '@/types';
import { newId, type TestDataRecord } from './flow-store';

interface Detector {
  pattern: RegExp;
  name: string;
  value: (n: number) => string;
}

const DETECTORS: Detector[] = [
  { pattern: /\be-?mail\b/i, name: 'email', value: (n) => `qa.user${n}@example.com` },
  { pattern: /password|passwd/i, name: 'password', value: (n) => `Str0ng!Pass${n}` },
  { pattern: /\buser\s?name\b|\blogin\s?id\b/i, name: 'username', value: (n) => `qa_user_${n}` },
  { pattern: /\bamount\b|\bprice\b|\bbalance\b|\btotal\b/i, name: 'amount', value: (n) => `${(n * 49.9).toFixed(2)}` },
  { pattern: /\bdate\b|\bschedule\b/i, name: 'date', value: (n) => `2026-01-${String(10 + n).padStart(2, '0')}` },
  { pattern: /\burl\b|\blink\b|\bendpoint\b/i, name: 'url', value: (n) => `https://staging.example.com/item/${n}` },
  { pattern: /\bsearch\b|\bquery\b|\bkeyword\b/i, name: 'searchTerm', value: (n) => `demo-query-${n}` },
  { pattern: /\bphone\b|\bmobile\b/i, name: 'phone', value: (n) => `+155500000${n}` },
  { pattern: /\baddress\b/i, name: 'address', value: (n) => `${100 + n} Demo Street, Springfield` },
  { pattern: /\bquantity\b|\bcount\b/i, name: 'quantity', value: (n) => String(n + 1) },
];

const SET_COUNT = 3;

function detectFields(tc: TestCase, setNumber: number): { name: string; value: string }[] {
  const haystack = [tc.title, tc.description, tc.preconditions, tc.expectedResult, ...tc.steps].join(' ');
  const fields: { name: string; value: string }[] = [];
  for (const d of DETECTORS) {
    if (fields.length >= 4) break;
    if (d.pattern.test(haystack) && !fields.some((f) => f.name === d.name)) {
      fields.push({ name: d.name, value: d.value(setNumber) });
    }
  }
  if (fields.length === 0) {
    fields.push(
      { name: 'input', value: `sample-input-${setNumber}` },
      { name: 'variant', value: setNumber === 2 ? 'boundary' : setNumber === 3 ? 'invalid' : 'happy-path' }
    );
  }
  return fields;
}

export function generateDataSets(tc: TestCase): TestDataRecord[] {
  const now = new Date().toISOString();
  return Array.from({ length: SET_COUNT }, (_, i) => {
    const setNumber = i + 1;
    return {
      id: `td_${tc.id}_${setNumber}`,
      testCaseId: tc.id,
      testCaseTitle: tc.title,
      setNumber,
      fields: detectFields(tc, setNumber),
      expected: tc.expectedResult,
      status: 'generated' as const,
      createdAt: now,
    };
  });
}

export function newDataRecordId(): string {
  return newId('td');
}
