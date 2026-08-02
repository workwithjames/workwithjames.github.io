import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const root = process.cwd();
const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8788';
const reportPath = path.join(root, 'audit', 'site-audit-report.json');

function walk(dir, predicate, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, output);
    else if (predicate(full)) output.push(full);
  }
  return output;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function pushIssue(list, severity, category, location, message, detail = null) {
  list.push({ severity, category, location, message, ...(detail ? { detail } : {}) });
}

function localTargetExists(sourceFile, rawTarget) {
  if (!rawTarget || /^(?:https?:|mailto:|tel:|javascript:|data:|blob:|#|\/\/)/i.test(rawTarget)) return true;
  const clean = rawTarget.split('#')[0].split('?')[0];
  if (!clean) return true;
  const decoded = decodeURIComponent(clean);
  const candidate = decoded.startsWith('/')
    ? path.join(root, decoded.replace(/^\/+/, ''))
    : path.resolve(path.dirname(sourceFile), decoded);
  const options = [candidate];
  if (decoded.endsWith('/')) options.push(path.join(candidate, 'index.html'));
  if (!path.extname(candidate)) options.push(path.join(candidate, 'index.html'), `${candidate}.html`);
  return options.some((item) => fs.existsSync(item));
}

function hasSafeBlankTargetRel(value) {
  return /\b(?:noopener|noreferrer)\b/i.test(value || '');
}

function staticAudit() {
  const issues = [];
  const htmlFiles = walk(root, (file) => file.endsWith('.html') && !rel(file).startsWith('_next/'));
  const jsFiles = walk(path.join(root, 'assets'), (file) => file.endsWith('.js'))
    .concat(walk(path.join(root, 'functions'), (file) => file.endsWith('.js')))
    .concat(walk(path.join(root, 'scripts'), (file) => file.endsWith('.js') || file.endsWith('.mjs')));

  for (const file of htmlFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const location = rel(file);
    const noindex = /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(source)
      || /<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(source);
    const ids = [...source.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    for (const id of duplicates) pushIssue(issues, 'error', 'html', location, `Duplicate id: ${id}`);

    const titleCount = (source.match(/<title\b/gi) || []).length;
    if (titleCount !== 1) pushIssue(issues, 'error', 'seo', location, `Expected one title element, found ${titleCount}`);
    if (!noindex && !/<meta\b[^>]*name=["']description["']/i.test(source)) pushIssue(issues, 'warning', 'seo', location, 'Missing meta description');
    if (!noindex && !/<link\b[^>]*rel=["']canonical["']/i.test(source)) pushIssue(issues, 'warning', 'seo', location, 'Missing canonical link');
    const h1Count = (source.match(/<h1\b/gi) || []).length;
    if (h1Count !== 1) pushIssue(issues, 'warning', 'html', location, `Expected one h1, found ${h1Count}`);

    for (const match of source.matchAll(/<(?:a|link|script|img|source|iframe)\b[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi)) {
      const target = match[1];
      if (!localTargetExists(file, target)) pushIssue(issues, 'error', 'link', location, `Missing local target: ${target}`);
    }

    for (const match of source.matchAll(/<img\b([^>]*)>/gi)) {
      if (!/\balt=["'][^"']*["']/i.test(match[1])) pushIssue(issues, 'warning', 'accessibility', location, 'Image missing alt attribute', match[0].slice(0, 180));
    }

    for (const match of source.matchAll(/<a\b([^>]*)target=["']_blank["']([^>]*)>/gi)) {
      const attrs = `${match[1]} ${match[2]}`;
      const relMatch = attrs.match(/\brel=["']([^"']+)["']/i);
      if (!relMatch || !hasSafeBlankTargetRel(relMatch[1])) pushIssue(issues, 'warning', 'security', location, 'target="_blank" link missing opener protection', match[0].slice(0, 180));
    }

    for (const match of source.matchAll(/<label\b[^>]*>[\s\S]*?<div\b[^>]*class=["'][^"']*(?:input|field|wrap)[^"']*["'][^>]*>/gi)) {
      pushIssue(issues, 'warning', 'html', location, 'Label contains a block-level div; use phrasing markup such as span', match[0].slice(0, 180));
    }
  }

  for (const file of jsFiles) {
    const source = fs.readFileSync(file, 'utf8');
    if (/window\.open\([^\n]+['_"]_blank['_"][^\n]*\)/.test(source)
      && !source.includes("'noopener,noreferrer'")
      && !source.includes('"noopener,noreferrer"')) {
      pushIssue(issues, 'warning', 'security', rel(file), 'Review window.open usage for opener protection');
    }
  }

  for (const xmlFile of ['sitemap.xml', 'feed.xml', 'image-sitemap.xml']) {
    const full = path.join(root, xmlFile);
    if (fs.existsSync(full)) {
      const source = fs.readFileSync(full, 'utf8');
      if (!source.trim().startsWith('<?xml')) pushIssue(issues, 'error', 'xml', xmlFile, 'XML declaration is missing');
    }
  }

  return { issues, htmlCount: htmlFiles.length, jsCount: jsFiles.length };
}

function sitemapRoutes() {
  const file = path.join(root, 'sitemap.xml');
  const routes = new Set(['/']);
  if (fs.existsSync(file)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)) {
      const route = match[1] || '/';
      routes.add(route.startsWith('/') ? route : `/${route}`);
    }
  }
  ['/contact/', '/buy-invest-dubai/', '/sell-dubai-property/', '/real-estate-marketing/', '/dubai-data/', '/abu-dhabi-data/', '/ajman-data/', '/dubai-rental-yield-calculator/', '/blog/'].forEach((route) => routes.add(route));
  return [...routes].sort();
}

async function runtimeAudit() {
  const issues = [];
  const routes = sitemapRoutes();
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'desktop', width: 1440, height: 1000, compactNavigation: false },
    { name: 'tablet', width: 1024, height: 900, compactNavigation: true },
    { name: 'mobile', width: 390, height: 844, compactNavigation: true }
  ];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
    for (const route of routes) {
      const page = await context.newPage();
      const location = `${route} [${viewport.name}]`;
      const consoleErrors = [];
      const pageErrors = [];
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await page.route('**/*', async (requestRoute) => {
        const url = new URL(requestRoute.request().url());
        if (['127.0.0.1', 'localhost'].includes(url.hostname)) return requestRoute.continue();
        return requestRoute.abort();
      });

      try {
        const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (!response || response.status() >= 400) {
          pushIssue(issues, 'error', 'runtime', location, `HTTP status ${response ? response.status() : 'unavailable'}`);
          continue;
        }
        await page.waitForTimeout(350);
        const result = await page.evaluate(() => {
          const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
          const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
          const blankLinks = [...document.querySelectorAll('a[target="_blank"]')]
            .filter((a) => !/\b(?:noopener|noreferrer)\b/i.test(a.rel))
            .map((a) => a.outerHTML.slice(0, 180));
          const unlabeled = [...document.querySelectorAll('input:not([type="hidden"]):not([hidden]),select:not([hidden]),textarea:not([hidden])')].filter((field) => {
            if (field.disabled || field.closest('[hidden]') || field.getAttribute('aria-hidden') === 'true') return false;
            if (field.closest('label')) return false;
            if (field.getAttribute('aria-label') || field.getAttribute('aria-labelledby')) return false;
            return !(field.id && document.querySelector(`label[for="${CSS.escape(field.id)}"]`));
          }).map((field) => field.outerHTML.slice(0, 180));
          const unnamedButtons = [...document.querySelectorAll('button')].filter((button) => {
            if (button.hidden || button.closest('[hidden]')) return false;
            return !(button.textContent || '').trim() && !button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby');
          }).map((button) => button.outerHTML.slice(0, 180));
          const directNavOrder = (selector) => {
            const nav = document.querySelector(selector);
            if (!nav) return [];
            return [...nav.children].map((child) => child.matches('details')
              ? (child.querySelector(':scope > summary')?.textContent || '').replace(/[⌄⌃]/g, '').trim()
              : (child.textContent || '').trim()).filter(Boolean);
          };
          return {
            duplicateIds,
            h1Count: document.querySelectorAll('h1').length,
            title: document.title,
            noindex: Boolean(document.querySelector('meta[name="robots"][content*="noindex" i]')),
            hasDescription: Boolean(document.querySelector('meta[name="description"]')),
            hasCanonical: Boolean(document.querySelector('link[rel="canonical"]')),
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
            overflowBy: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            blankLinks,
            unlabeled,
            unnamedButtons,
            desktopNavOrder: directNavOrder('.global-links'),
            mobileNavOrder: directNavOrder('#mobile-site-menu'),
            mobileToggleVisible: (() => {
              const el = document.querySelector('.mobile-menu-toggle');
              return Boolean(el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0);
            })()
          };
        });

        if (result.duplicateIds.length) pushIssue(issues, 'error', 'runtime-html', location, `Duplicate ids: ${result.duplicateIds.join(', ')}`);
        if (result.h1Count !== 1) pushIssue(issues, 'warning', 'runtime-html', location, `Expected one h1, found ${result.h1Count}`);
        if (!result.title) pushIssue(issues, 'error', 'seo', location, 'Rendered page title is empty');
        if (!result.noindex && !result.hasDescription) pushIssue(issues, 'warning', 'seo', location, 'Rendered page lacks meta description');
        if (!result.noindex && !result.hasCanonical) pushIssue(issues, 'warning', 'seo', location, 'Rendered page lacks canonical link');
        if (result.horizontalOverflow) pushIssue(issues, 'error', 'layout', location, `Horizontal overflow by ${result.overflowBy}px`);
        for (const item of result.blankLinks) pushIssue(issues, 'warning', 'security', location, 'Rendered target="_blank" link missing opener protection', item);
        for (const item of result.unlabeled) pushIssue(issues, 'error', 'accessibility', location, 'Form control lacks an accessible label', item);
        for (const item of result.unnamedButtons) pushIssue(issues, 'error', 'accessibility', location, 'Button lacks an accessible name', item);

        const expected = ['Home', 'Your Goal', 'Dubai Data', 'Abu Dhabi Data', 'Ajman Data', 'About Me', 'News', 'Contact Me'];
        const actual = viewport.compactNavigation ? result.mobileNavOrder : result.desktopNavOrder;
        if (JSON.stringify(actual) !== JSON.stringify(expected)) pushIssue(issues, 'error', 'navigation', location, 'Header order does not match the required flow', { expected, actual });

        if (viewport.compactNavigation) {
          if (!result.mobileToggleVisible) pushIssue(issues, 'error', 'navigation', location, 'Compact menu button is not visible');
          const toggle = page.locator('.mobile-menu-toggle');
          if (await toggle.count()) {
            await toggle.click();
            const menu = page.locator('#mobile-site-menu');
            if (!(await menu.isVisible())) pushIssue(issues, 'error', 'navigation', location, 'Compact menu does not open');
            const goal = menu.locator('.goal-nav > summary');
            if (await goal.count()) {
              await goal.click();
              const options = await menu.locator('.goal-nav-menu a').allTextContents();
              const normalized = options.map((value) => value.trim());
              if (JSON.stringify(normalized) !== JSON.stringify(['Buy / Invest', 'Sell', 'Marketing'])) pushIssue(issues, 'error', 'navigation', location, 'Your Goal options are incorrect', normalized);
            }
          }
        }

        await page.addScriptTag({ content: axeSource });
        const axe = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
        for (const violation of axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact))) {
          pushIssue(issues, violation.impact === 'critical' ? 'error' : 'warning', 'axe', location, violation.help, { id: violation.id, nodes: violation.nodes.slice(0, 5).map((node) => node.target) });
        }

        for (const message of pageErrors) pushIssue(issues, 'error', 'javascript', location, message);
        for (const message of consoleErrors.filter((item) => !/ERR_FAILED|Failed to load resource/i.test(item))) pushIssue(issues, 'warning', 'console', location, message);
      } catch (error) {
        pushIssue(issues, 'error', 'runtime', location, error.message);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();
  return { issues, routeCount: routes.length, viewportCount: viewports.length };
}

const staticResult = staticAudit();
const runtimeResult = await runtimeAudit();
const issues = [...staticResult.issues, ...runtimeResult.issues];
const counts = issues.reduce((acc, issue) => {
  acc[issue.severity] = (acc[issue.severity] || 0) + 1;
  return acc;
}, {});
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  scanned: {
    htmlFiles: staticResult.htmlCount,
    javascriptFiles: staticResult.jsCount,
    routes: runtimeResult.routeCount,
    viewports: runtimeResult.viewportCount
  },
  summary: { errors: counts.error || 0, warnings: counts.warning || 0, total: issues.length },
  issues
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
