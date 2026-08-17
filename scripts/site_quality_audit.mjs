import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
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

async function runFunctionalChecks(page, route, location, issues) {
  if (route === '/') {
    const projects = await page.locator('.project-list .project').count();
    const developerDesks = await page.locator('.developer-list a').count();
    const investorDesks = await page.locator('.market-grid a').count();
    if (projects !== 3) pushIssue(issues, 'error', 'functional', location, `Homepage should show 3 current opportunities, found ${projects}`);
    if (developerDesks !== 6) pushIssue(issues, 'error', 'functional', location, `Homepage should show 6 developer desks, found ${developerDesks}`);
    if (investorDesks !== 4) pushIssue(issues, 'error', 'functional', location, `Homepage should show 4 international investor desks, found ${investorDesks}`);
  }

  if (route === '/contact/') {
    const sellPicker = page.locator('input[name="goal-picker"][value="sell"]');
    if (await sellPicker.count()) {
      await sellPicker.check();
      await page.waitForTimeout(50);
      const sellVisible = await page.locator('[data-goal-panel="sell"]').isVisible();
      const buyVisible = await page.locator('[data-goal-panel="buy"]').isVisible();
      const title = (await page.locator('#contact-form-title').textContent()) || '';
      if (!sellVisible || buyVisible || !/sell/i.test(title)) pushIssue(issues, 'error', 'functional', location, 'Contact form does not switch correctly to the Sell goal');
    } else {
      pushIssue(issues, 'error', 'functional', location, 'Contact goal selector is missing');
    }
  }

  if (route === '/dubai-rental-yield-calculator/') {
    const initial = (await page.locator('#gross-a').textContent()) || '';
    if (!initial || initial === '0.00%') pushIssue(issues, 'error', 'functional', location, 'Rental yield calculator did not calculate its initial scenario');
    await page.locator('#a-rent').fill('120000');
    await page.waitForTimeout(40);
    const updated = (await page.locator('#gross-a').textContent()) || '';
    if (updated === initial || updated === '0.00%') pushIssue(issues, 'error', 'functional', location, 'Rental yield calculator did not react to input changes');
  }

  if (route === '/dubai-data/') {
    const transactions = ((await page.locator('#market-transactions').textContent()) || '').trim();
    const yieldRows = await page.locator('#yield-table-body tr').count();
    if (!transactions || /loading/i.test(transactions)) pushIssue(issues, 'error', 'functional', location, 'Dubai Data fallback snapshot did not render');
    if (!yieldRows) pushIssue(issues, 'error', 'functional', location, 'Dubai Data yield table did not render');
  }
}

function sameOrder(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
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
  const expectedNavigation = ['Home', 'Your Goal', 'Tools', 'About Me', 'News', 'Contact Me'];
  const expectedHomeNavigation = ['Opportunities', 'Developers', 'Locations', 'Research', 'Insights', 'About'];

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
            compactNavOrder: directNavOrder('.mobile-page-tabs'),
            homeNavOrder: directNavOrder('.site-menu'),
            compactNavVisible: (() => {
              const el = document.querySelector('.mobile-page-tabs');
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

        const isHome = route === '/';
        const expected = isHome ? expectedHomeNavigation : expectedNavigation;
        const actualNavigation = isHome ? result.homeNavOrder : (viewport.compactNavigation ? result.compactNavOrder : result.desktopNavOrder);
        if (!sameOrder(actualNavigation, expected)) {
          pushIssue(issues, 'error', 'navigation', location, 'Header order does not match the current navigation flow', { expected, actual: actualNavigation });
        }

        if (viewport.compactNavigation && !isHome) {
          if (!result.compactNavVisible) pushIssue(issues, 'error', 'navigation', location, 'Compact page navigation is not visible');
          const compactNav = page.locator('.mobile-page-tabs');
          const goal = compactNav.locator('.goal-nav:not(.tools-nav) > summary');
          if (await goal.count()) {
            await goal.click();
            const options = await compactNav.locator('.goal-nav:not(.tools-nav) .goal-nav-menu a').allTextContents();
            const normalized = options.map((value) => value.trim());
            if (!sameOrder(normalized, ['Buy / Invest', 'Sell', 'Marketing'])) {
              pushIssue(issues, 'error', 'navigation', location, 'Your Goal options are incorrect', normalized);
            }
            await goal.click();
          }
          if (!(await compactNav.locator('.tools-nav > summary').count())) {
            pushIssue(issues, 'error', 'navigation', location, 'Tools menu is missing from compact navigation');
          }
        }

        await runFunctionalChecks(page, route, location, issues);

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
const staticOnly = process.env.AUDIT_STATIC_ONLY === '1';
const runtimeResult = staticOnly
  ? { issues: [], routeCount: 0, viewportCount: 0 }
  : await runtimeAudit();
const issues = [...staticResult.issues, ...runtimeResult.issues];
const severityCounts = issues.reduce((acc, issue) => {
  acc[issue.severity] = (acc[issue.severity] || 0) + 1;
  return acc;
}, {});
const categoryCounts = issues.reduce((acc, issue) => {
  acc[issue.category] = (acc[issue.category] || 0) + 1;
  return acc;
}, {});
const messageCounts = issues.reduce((acc, issue) => {
  acc[issue.message] = (acc[issue.message] || 0) + 1;
  return acc;
}, {});
const topMessages = Object.entries(messageCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .map(([message, count]) => ({ message, count }));

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  scanned: {
    htmlFiles: staticResult.htmlCount,
    javascriptFiles: staticResult.jsCount,
    routes: runtimeResult.routeCount,
    viewports: runtimeResult.viewportCount
  },
  summary: {
    errors: severityCounts.error || 0,
    warnings: severityCounts.warning || 0,
    total: issues.length,
    byCategory: categoryCounts,
    topMessages
  },
  issues
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
