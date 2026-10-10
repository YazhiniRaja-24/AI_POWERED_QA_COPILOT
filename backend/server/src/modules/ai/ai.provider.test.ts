import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGroundedCases, filterAnalysisByPages } from './ai.provider';
import type {
  GenerateRequest,
  InspectedButton,
  InspectedField,
  InspectedForm,
  InspectedLink,
  WebsiteAnalysis,
} from './ai.schemas';

const ROOT = 'https://shop.example.com/';
const ABOUT = 'https://shop.example.com/about';
const CONTACT = 'https://shop.example.com/contact';

function field(overrides: Partial<InspectedField> = {}): InspectedField {
  return {
    page: ROOT,
    label: '',
    name: '',
    type: 'text',
    placeholder: '',
    required: false,
    accessibleName: '',
    ...overrides,
  };
}

function button(overrides: Partial<InspectedButton> = {}): InspectedButton {
  return { page: ROOT, text: '', accessibleName: '', type: 'button', ...overrides };
}

function link(overrides: Partial<InspectedLink> = {}): InspectedLink {
  return { page: ROOT, text: '', href: '', sameOrigin: true, ...overrides };
}

function form(overrides: Partial<InspectedForm> = {}): InspectedForm {
  return { page: ROOT, action: '', method: 'POST', fields: [], ...overrides };
}

function analysis(overrides: Partial<WebsiteAnalysis> = {}): WebsiteAnalysis {
  return {
    url: ROOT,
    title: 'Example Shop',
    pages: [ROOT],
    headings: [],
    text: '',
    forms: [],
    formsDetail: [],
    actions: [],
    interactiveElements: [],
    buttons: [],
    links: [],
    inputs: [],
    inspectedPages: 1,
    truncated: false,
    warnings: [],
    ...overrides,
  };
}

function request(overrides: Partial<GenerateRequest> = {}): GenerateRequest {
  return { type: 'Functional', framework: 'Playwright', count: 5, ...overrides };
}

describe('buildGroundedCases — sparse inspection', () => {
  it('emits only an honest page-level case and never invents features', () => {
    const cases = buildGroundedCases(request({ count: 5 }), analysis());

    assert.equal(cases.length, 1);
    const [only] = cases;
    assert.match(only.title, /Load/);
    assert.equal(only.targetPage, ROOT);
    assert.ok(only.tags.includes('limited-evidence'));
    assert.ok(!/login|checkout|password|reset|security/i.test(only.title));
    assert.ok(!/login|checkout|password|reset|security/i.test(only.description));
  });

  it('does not fabricate interactive categories when nothing was observed', () => {
    const cases = buildGroundedCases(request({ count: 10 }), analysis());
    const tags = cases.flatMap((c) => c.tags);
    for (const forbidden of ['button', 'link', 'form', 'input', 'interaction', 'navigation']) {
      assert.ok(!tags.includes(forbidden), `unexpected "${forbidden}" scenario`);
    }
  });
});

describe('buildGroundedCases — deduplication', () => {
  it('drops scenarios that express the same check', () => {
    const analysisWithDuplicates = analysis({
      buttons: [
        button({ text: 'Buy', accessibleName: 'Buy' }),
        button({ text: 'Buy', accessibleName: 'Buy' }),
        button({ text: 'Buy now', accessibleName: 'Buy now' }),
      ],
    });

    const cases = buildGroundedCases(request({ count: 10 }), analysisWithDuplicates);
    const titles = cases.map((c) => c.title);

    assert.equal(new Set(titles).size, titles.length, 'titles must be unique');
    assert.equal(
      titles.filter((t) => t.includes('Click "Buy" on')).length,
      1,
      'the duplicate "Buy" button must appear once',
    );
    assert.equal(titles.filter((t) => t.includes('Buy now')).length, 1);
  });
});

describe('buildGroundedCases — balanced coverage', () => {
  it('spreads the suite across categories instead of clustering on one type', () => {
    const heavy = analysis({
      headings: ['Alpha', 'Beta', 'Gamma'],
      formsDetail: [
        form({
          fields: [
            field({ label: 'Email', name: 'email', type: 'email', required: true }),
          ],
        }),
      ],
      inputs: [field({ label: 'Email', name: 'email', type: 'email', required: true })],
      buttons: Array.from({ length: 8 }, (_, i) =>
        button({ text: `Button ${i}`, accessibleName: `Button ${i}` }),
      ),
      links: Array.from({ length: 8 }, (_, i) =>
        link({ text: `Link ${i}`, href: `${ROOT}page-${i}` }),
      ),
    });

    const cases = buildGroundedCases(request({ count: 5 }), heavy);
    assert.equal(cases.length, 5);
    const tags = cases.flatMap((c) => c.tags);
    assert.ok(tags.includes('content'), 'expected a content scenario');
    assert.ok(tags.includes('form'), 'expected a form scenario');
    assert.ok(tags.includes('input'), 'expected an input scenario');
  });

  it('describes unexecuted behaviour as inferred rather than verified', () => {
    const interactive = analysis({
      buttons: [button({ text: 'Go', accessibleName: 'Go' })],
    });
    const cases = buildGroundedCases(request({ count: 5 }), interactive);
    const interaction = cases.find((c) => c.tags.includes('interaction'));
    assert.ok(interaction, 'expected an interaction scenario');
    assert.match(interaction!.expectedResult, /inferred|not been executed/i);
  });
});

describe('filterAnalysisByPages — page selection', () => {
  it('keeps only page-scoped elements from the selected pages', () => {
    const full = analysis({
      pages: [ROOT, ABOUT, CONTACT],
      buttons: [
        button({ page: ROOT, text: 'Home CTA', accessibleName: 'Home CTA' }),
        button({ page: ABOUT, text: 'About CTA', accessibleName: 'About CTA' }),
        button({ page: CONTACT, text: 'Contact CTA', accessibleName: 'Contact CTA' }),
      ],
      links: [
        link({ page: ROOT, text: 'About', href: ABOUT }),
        link({ page: ABOUT, text: 'Contact', href: CONTACT }),
      ],
    });

    const filtered = filterAnalysisByPages(full, [ROOT]);

    assert.deepEqual(filtered.pages, [ROOT]);
    assert.deepEqual(
      filtered.buttons.map((b) => b.text),
      ['Home CTA'],
    );
    assert.deepEqual(
      filtered.links.map((l) => l.href),
      [ABOUT],
    );
  });

  it('falls back to the full analysis when no page matches', () => {
    const full = analysis({ pages: [ROOT], buttons: [button({ text: 'X', accessibleName: 'X' })] });
    const filtered = filterAnalysisByPages(full, ['https://other.example.com/']);
    assert.equal(filtered.pages.length, 1);
    assert.equal(filtered.buttons.length, 1);
  });

  it('drives generation for the selected pages only', () => {
    const full = analysis({
      pages: [ROOT, ABOUT],
      buttons: [
        button({ page: ROOT, text: 'Home CTA', accessibleName: 'Home CTA' }),
        button({ page: ABOUT, text: 'About CTA', accessibleName: 'About CTA' }),
      ],
    });

    const cases = buildGroundedCases(
      request({ count: 10, selectedPages: [ABOUT] }),
      filterAnalysisByPages(full, [ABOUT]),
    );

    assert.ok(cases.length > 0);
    assert.ok(!cases.some((c) => c.title.includes('Home CTA')));
    for (const c of cases) {
      assert.ok(c.targetPage === ABOUT || c.targetPage === '', `unexpected page ${c.targetPage}`);
    }
  });
});
