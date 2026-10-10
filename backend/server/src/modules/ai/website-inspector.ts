import dns from 'node:dns/promises';
import net from 'node:net';
import { chromium } from 'playwright';
import type { Env } from '../../config/env';
import { AppError } from '../../utils/http';
import type { WebsiteAnalysis } from './ai.schemas';

export interface InspectorConfig {
  maxPages: number;
  navTimeoutMs: number;
  maxLinksPerPage: number;
  maxControlsPerPage: number;
  userAgent: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function inspectorConfig(env: Env): InspectorConfig {
  return {
    maxPages: clamp(env.URL_INSPECT_MAX_PAGES, 1, 10),
    navTimeoutMs: clamp(env.URL_INSPECT_TIMEOUT_MS, 3000, 60000),
    maxLinksPerPage: 120,
    maxControlsPerPage: 80,
    userAgent:
      'Mozilla/5.0 (compatible; QA-Copilot-WebsiteInspector/1.0; +bounded-no-auth)',
  };
}

interface RawField {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required: boolean;
  accessibleName: string;
}

interface RawButton {
  text: string;
  accessibleName: string;
  type: string;
}

interface RawLink {
  text: string;
  href: string;
  title: string;
}

interface RawForm {
  action: string;
  method: string;
  fields: RawField[];
}

interface RawPageData {
  title: string;
  url: string;
  headings: string[];
  text: string;
  buttons: RawButton[];
  links: RawLink[];
  fields: RawField[];
  forms: RawForm[];
}

/**
 * Runs inside the browser context. Kept as a string so the server tsconfig
 * (which has no DOM lib) does not need `document`/`window` typings.
 */
const COLLECT_SCRIPT = String.raw`(() => {
  const norm = (s) => (s == null ? '' : String(s)).replace(/\s+/g, ' ').trim();
  const isVisible = (el) => {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (!style) return false;
    if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const safeEscape = (v) => {
    try { return window.CSS && CSS.escape ? CSS.escape(v) : v; } catch (_) { return v; }
  };
  const fieldType = (f) => {
    const t = (f.getAttribute('type') || '').toLowerCase();
    if (t) return t;
    const tag = f.tagName.toLowerCase();
    if (tag === 'select') return 'select';
    if (tag === 'textarea') return 'textarea';
    return 'text';
  };
  const labelFor = (el) => {
    if (el.labels && el.labels.length) {
      return norm(Array.from(el.labels).map((l) => l.textContent).join(' '));
    }
    const id = el.getAttribute('id');
    if (id) {
      const l = document.querySelector('label[for="' + safeEscape(id) + '"]');
      if (l) return norm(l.textContent);
    }
    const aria = el.getAttribute('aria-label');
    if (aria) return norm(aria);
    const labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
      const joined = norm(
        labelledby
          .split(/\s+/)
          .map((rid) => {
            const n = document.getElementById(rid);
            return n ? n.textContent : '';
          })
          .join(' '),
      );
      if (joined) return joined;
    }
    const ph = el.getAttribute('placeholder');
    if (ph) return norm(ph);
    return norm(el.getAttribute('name') || el.getAttribute('title'));
  };
  const accName = (el) =>
    norm(
      el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.innerText ||
        el.value ||
        el.getAttribute('alt') ||
        el.getAttribute('name') ||
        '',
    );
  const mapField = (f) => ({
    label: labelFor(f),
    name: f.getAttribute('name') || '',
    type: fieldType(f),
    placeholder: f.getAttribute('placeholder') || '',
    required: f.hasAttribute('required') || f.getAttribute('aria-required') === 'true',
    accessibleName: accName(f),
  });

  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .filter(isVisible)
    .map((h) => norm(h.textContent))
    .filter(Boolean)
    .slice(0, 40);

  const text = norm(document.body && document.body.innerText).slice(0, 8000);

  const buttons = Array.from(
    document.querySelectorAll(
      'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]',
    ),
  )
    .filter(isVisible)
    .slice(0, 80)
    .map((b) => ({
      text: norm(b.innerText || b.value || b.getAttribute('aria-label') || ''),
      accessibleName: accName(b),
      type: (b.getAttribute('type') || b.tagName).toLowerCase(),
    }));

  const links = Array.from(document.querySelectorAll('a[href]'))
    .slice(0, 300)
    .map((a) => ({
      text: norm(a.innerText),
      href: a.href,
      title: a.getAttribute('title') || '',
    }))
    .filter((l) => l.href && !/^javascript:/i.test(l.href));

  const fieldSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea';
  const fields = Array.from(document.querySelectorAll(fieldSelector))
    .slice(0, 120)
    .map(mapField);

  const forms = Array.from(document.querySelectorAll('form'))
    .slice(0, 30)
    .map((form) => ({
      action: form.getAttribute('action') || '',
      method: (form.getAttribute('method') || 'get').toUpperCase(),
      fields: Array.from(form.querySelectorAll(fieldSelector)).slice(0, 60).map(mapField),
    }));

  return {
    title: document.title,
    url: location.href,
    headings: headings,
    text: text,
    buttons: buttons,
    links: links,
    fields: fields,
    forms: forms,
  };
})()`;

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved
    return false;
  }

  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('fe80')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
  if (lower.startsWith('::ffff:')) return isPrivateIp(lower.slice('::ffff:'.length));
  return false;
}

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal'];

export function hostIsBlocked(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host === '[::1]' || host === '::1') return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  return false;
}

/** Fast literal check used for every in-page network request (no DNS). */
export function isBlockedNetworkUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return true;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (hostIsBlocked(url.hostname)) return true;
  const bare = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(bare) && isPrivateIp(bare)) return true;
  return false;
}

/** Full validation including DNS resolution. Used before each navigation. */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError(400, 'INVALID_URL', `"${rawUrl}" is not a valid URL.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppError(
      400,
      'INVALID_URL',
      'Only http:// and https:// URLs can be inspected.',
    );
  }
  if (hostIsBlocked(url.hostname)) {
    throw new AppError(
      400,
      'BLOCKED_URL',
      'Localhost, link-local and private-network addresses cannot be inspected.',
    );
  }

  const bare = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(bare)) {
    if (isPrivateIp(bare)) {
      throw new AppError(
        400,
        'BLOCKED_URL',
        'Private and internal IP addresses cannot be inspected.',
      );
    }
    return url;
  }

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new AppError(
      502,
      'DNS_FAILED',
      `Could not resolve the hostname "${url.hostname}". Check the URL and try again.`,
    );
  }
  if (addresses.length === 0) {
    throw new AppError(502, 'DNS_FAILED', `No DNS records found for "${url.hostname}".`);
  }
  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new AppError(
        400,
        'BLOCKED_URL',
        `"${url.hostname}" resolves to a private/internal address and cannot be inspected.`,
      );
    }
  }
  return url;
}

export function classifyNavigationError(error: unknown, url: string): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/timeout/i.test(message)) {
    return new AppError(
      504,
      'INSPECTION_TIMEOUT',
      `Timed out while loading ${url}. The site may be slow or blocking automated browsers. Try again later.`,
    );
  }
  if (/ERR_NAME_NOT_RESOLVED|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return new AppError(502, 'DNS_FAILED', `Could not resolve ${url}. Check the URL.`);
  }
  if (/ERR_CONNECTION_REFUSED|ECONNREFUSED|ERR_CONNECTION_RESET|ERR_CONNECTION_CLOSED/i.test(message)) {
    return new AppError(502, 'UNREACHABLE', `Could not connect to ${url}. The site may be down.`);
  }
  if (/ERR_CERT|SSL|certificate/i.test(message)) {
    return new AppError(502, 'TLS_ERROR', `TLS handshake failed for ${url}.`);
  }
  if (/ERR_ABORTED|blockedbyclient/i.test(message)) {
    return new AppError(403, 'BLOCKED_URL', `Navigation to ${url} was blocked by the SSRF guard.`);
  }
  return new AppError(
    502,
    'NAVIGATION_FAILED',
    `Could not load ${url}. ${message.slice(0, 200)}`,
  );
}

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item).toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export async function inspectWebsite(
  rawUrl: string,
  config: InspectorConfig,
): Promise<WebsiteAnalysis> {
  const root = await assertSafeUrl(rawUrl.trim());
  const origin = root.origin;
  const warnings: string[] = [];

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  } catch {
    throw new AppError(
      503,
      'INSPECTOR_UNAVAILABLE',
      'Website inspection needs a Playwright Chromium browser. Run "npx playwright install chromium" on the server and try again.',
    );
  }

  const visited: string[] = [];
  const queued = new Set<string>([root.href]);
  const queue: string[] = [root.href];
  const rawPages: RawPageData[] = [];
  const pageUrls: string[] = [];
  let rootTitle = '';
  let truncated = false;
  let rootError: AppError | null = null;

  try {
    const context = await browser.newContext({
      userAgent: config.userAgent,
      viewport: { width: 1366, height: 900 },
      ignoreHTTPSErrors: false,
    });
    await context.route('**/*', (route) => {
      if (isBlockedNetworkUrl(route.request().url())) {
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });

    while (queue.length > 0 && visited.length < config.maxPages) {
      const target = queue.shift()!;
      if (visited.includes(target)) continue;

      let safe: URL;
      try {
        safe = await assertSafeUrl(target);
      } catch (err) {
        warnings.push(err instanceof Error ? err.message : `Skipped ${target}.`);
        continue;
      }
      visited.push(safe.href);
      const isRoot = visited.length === 1;

      const page = await context.newPage();
      page.setDefaultNavigationTimeout(config.navTimeoutMs);
      page.setDefaultTimeout(config.navTimeoutMs);

      try {
        const response = await page.goto(safe.href, {
          waitUntil: 'domcontentloaded',
          timeout: config.navTimeoutMs,
        });
        await page.waitForTimeout(400);

        const finalUrl = page.url();
        await assertSafeUrl(finalUrl);

        if (response && response.status() >= 400) {
          warnings.push(`Page ${safe.href} returned HTTP ${response.status()}.`);
        }

        const raw = await page.evaluate<RawPageData>(COLLECT_SCRIPT);
        rawPages.push(raw);
        pageUrls.push(safe.href);

        if (isRoot) {
          rootTitle = raw.title || hostOf(safe.href);
        }

        for (const link of raw.links) {
          if (queued.size >= 200) break;
          let linkUrl: URL;
          try {
            linkUrl = new URL(link.href);
          } catch {
            continue;
          }
          if (linkUrl.origin !== origin) continue;
          if (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') continue;
          linkUrl.hash = '';
          const href = linkUrl.href;
          if (visited.includes(href) || queued.has(href)) continue;
          if (!linkUrl.pathname || linkUrl.pathname === '/') {
            // root is already handled
          }
          queued.add(href);
          if (queue.length < config.maxPages * 4) queue.push(href);
        }
      } catch (err) {
        const appError = classifyNavigationError(err, safe.href);
        if (isRoot) {
          rootError = appError;
        } else {
          warnings.push(appError.message);
        }
      } finally {
        await page.close().catch(() => undefined);
      }
    }

    await context.close().catch(() => undefined);
  } finally {
    await browser.close().catch(() => undefined);
  }

  if (rawPages.length === 0) {
    if (rootError) throw rootError;
    throw new AppError(
      502,
      'WEBSITE_UNREACHABLE',
      `Could not load any content from ${root.href}. The site may be unreachable or blocking automated browsers.`,
    );
  }

  truncated = visited.length >= config.maxPages && queue.length > 0;
  if (truncated) {
    warnings.push(
      `Inspection was limited to the first ${config.maxPages} page(s). Increase URL_INSPECT_MAX_PAGES to explore more.`,
    );
  }

  const headings = dedupeBy(
    rawPages.flatMap((p) => p.headings),
    (h) => h,
  ).slice(0, 60);

  const buttons = dedupeBy(
    rawPages.flatMap((p) => p.buttons.map((b) => ({ ...b, page: p.url }))),
    (b) => b.accessibleName || b.text,
  ).slice(0, 60);

  const links = dedupeBy(
    rawPages.flatMap((p) => p.links.map((l) => ({ ...l, page: p.url }))),
    (l) => l.href,
  )
    .slice(0, 120)
    .map((l) => {
      let sameOrigin = false;
      try {
        sameOrigin = new URL(l.href).origin === origin;
      } catch {
        sameOrigin = false;
      }
      return {
        page: l.page,
        text: l.text.slice(0, 300),
        href: l.href.slice(0, 2048),
        sameOrigin,
      };
    });

  const inputs = dedupeBy(
    rawPages.flatMap((p) => p.fields.map((f) => ({ ...f, page: p.url }))),
    (f) => `${f.type}|${f.name}|${f.label}`,
  ).slice(0, 80);

  const formsDetail = rawPages
    .flatMap((p) =>
      p.forms.map((f) => ({
        page: p.url,
        action: f.action.slice(0, 2048),
        method: f.method.slice(0, 10),
        fields: f.fields.slice(0, 40).map((ff) => ({ ...ff, page: p.url })),
      })),
    )
    .slice(0, 30);

  const forms = formsDetail.map((f, i) => {
    const fieldNames = f.fields
      .map((x) => x.label || x.name || x.type)
      .filter(Boolean)
      .slice(0, 12);
    return `Form #${i + 1} (${f.method} ${f.action || 'current page'}) — fields: ${
      fieldNames.join(', ') || 'none observed'
    }`;
  });

  const actions = [
    ...buttons
      .filter((b) => b.accessibleName || b.text)
      .map((b) => `Click "${b.accessibleName || b.text}"`),
    ...formsDetail.map(
      (f) => `Submit form (${f.method} ${f.action || 'current page'}) with valid input`,
    ),
  ].slice(0, 120);

  const interactiveElements = [
    ...inputs.map(
      (f) =>
        `input[type=${f.type}]${f.name ? ` name="${f.name}"` : ''}${
          f.required ? ' (required)' : ''
        }${f.label ? ` — "${f.label}"` : ''}`,
    ),
    ...buttons
      .filter((b) => b.accessibleName || b.text)
      .map((b) => `button "${b.accessibleName || b.text}"`),
  ].slice(0, 160);

  const text = rawPages
    .map((p) => p.text)
    .filter(Boolean)
    .join('\n')
    .slice(0, 12000);

  if (formsDetail.length === 0 && inputs.length === 0 && buttons.length === 0) {
    warnings.push(
      'No forms, input fields or buttons were discovered on the inspected page(s). Test generation is limited to the observed page structure.',
    );
  }

  return {
    url: root.href,
    title: rootTitle || root.href,
    pages: visited.slice(0, 50),
    headings,
    text,
    forms,
    formsDetail,
    actions,
    interactiveElements,
    buttons: buttons.map((b) => ({
      page: b.page,
      text: b.text.slice(0, 200),
      accessibleName: b.accessibleName.slice(0, 200),
      type: b.type.slice(0, 40),
    })),
    links,
    inputs: inputs.map((f) => ({
      page: f.page,
      label: f.label.slice(0, 200),
      name: f.name.slice(0, 200),
      type: f.type.slice(0, 40),
      placeholder: f.placeholder.slice(0, 200),
      required: f.required,
      accessibleName: f.accessibleName.slice(0, 200),
    })),
    inspectedPages: rawPages.length,
    truncated,
    warnings: warnings.slice(0, 30),
  };
}
