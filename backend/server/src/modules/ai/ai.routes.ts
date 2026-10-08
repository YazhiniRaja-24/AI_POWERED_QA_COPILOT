import { Router } from 'express';
import { asyncHandler, ok } from '../../utils/http';
import type { AiService } from './ai.service';
import {
  analyzeFailureRequestSchema,
  generateRequestSchema,
  websiteAnalysisSchema,
  type WebsiteAnalysis,
} from './ai.schemas';

function analyzeWebsite(url: string): WebsiteAnalysis {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    parsed = new URL('https://example.com');
  }
  const path = parsed.pathname || '/';
  const pages = [path, '/', '/login', '/register']
    .filter((p, i, a) => a.indexOf(p) === i)
    .slice(0, 4);
  const hostname = parsed.hostname || 'example.com';
  const forms = ['/login', '/register', '/contact']
    .filter((p) => pages.includes(p))
    .map((p) => `Form on ${p}`);
  if (forms.length === 0) forms.push('Form detected');
  const actions = [
    'Click "Sign in"',
    'Click "Create account"',
    'Click "Forgot password"',
    'Click "Submit"',
  ];
  const interactiveElements = [
    'Email input',
    'Password input',
    'Login button',
    'Register link',
    'Forgot password link',
  ];
  return {
    url: parsed.origin + path,
    title: `${hostname} — Demo analysis`,
    pages: pages.map((p) => `${parsed.origin}${p}`),
    forms,
    actions,
    interactiveElements,
  };
}

export function createAiRouter(ai: AiService) {
  const router = Router();
  router.post(
    '/test-cases/generate',
    asyncHandler(async (req, res) => {
      const input = generateRequestSchema.parse(req.body);
      res.json(ok(await ai.generate(input)));
    }),
  );
  router.post(
    '/failures/analyze',
    asyncHandler(async (req, res) => {
      const failureInput = analyzeFailureRequestSchema.parse(req.body);
    }),
  );
  router.post(
    '/analyze-url',
    asyncHandler(async (req, res) => {
      const body = analyzeFailureRequestSchema.parse(req.body);
      const analysis = analyzeWebsite(body.url);
      const safe = websiteAnalysisSchema.parse(analysis);
      res.json(ok({ analysis: safe, provider: 'prototype-safe-analyzer' }));
    }),
  );
  return router;
}

