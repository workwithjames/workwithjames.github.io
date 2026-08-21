const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

const BOT_UA = "JamesSEOAuditBot/0.1 (+https://seo.jamesrealty.uk)";
const MAX_PAGES = 25;
const MAX_HTML_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 8_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: env.APP_NAME || "James SEO", version: "0.1.0" });
    }

    if (url.pathname === "/api/audit" && request.method === "POST") {
      return handleAudit(request);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleAudit(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = normalizeTarget(input?.url);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const target = parsed.url;
  const requestedPages = Number(input?.maxPages || 15);
  const maxPages = Math.max(1, Math.min(MAX_PAGES, Number.isFinite(requestedPages) ? requestedPages : 15));

  const startedAt = Date.now();
  const robots = await readRobots(target);
  const result = await crawlSite(target, maxPages, robots);

  const pages = result.pages;
  const allIssues = pages.flatMap((page) => page.issues.map((issue) => ({ ...issue, url: page.url })));
  const counts = allIssues.reduce(
    (acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    },
    { critical: 0, warning: 0, notice: 0 }
  );

  const score = pages.length
    ? Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length)
    : 0;

  const statusCounts = pages.reduce((acc, page) => {
    const key = page.status >= 200 && page.status < 300 ? "ok" : page.status >= 300 && page.status < 400 ? "redirect" : "error";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { ok: 0, redirect: 0, error: 0 });

  return json({
    target: target.href,
    origin: target.origin,
    auditedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    maxPages,
    pagesCrawled: pages.length,
    queuedRemaining: result.queuedRemaining,
    robots: {
      reachable: robots.reachable,
      status: robots.status,
      disallowCount: robots.disallow.length,
    },
    score,
    issueCounts: counts,
    statusCounts,
    pages,
  });
}

async function crawlSite(startUrl, maxPages, robots) {
  const queue = [canonicalize(startUrl)];
  const queued = new Set(queue.map((u) => u.href));
  const visited = new Set();
  const pages = [];

  while (queue.length && pages.length < maxPages) {
    const current = queue.shift();
    const key = current.href;
    if (visited.has(key)) continue;
    visited.add(key);

    if (isRobotsDisallowed(current, robots)) {
      pages.push({
        url: key,
        status: 0,
        contentType: "blocked-by-robots",
        responseMs: 0,
        score: 100,
        title: "",
        metaDescription: "",
        h1: "",
        canonical: "",
        wordCount: 0,
        links: { internal: 0, external: 0 },
        images: { total: 0, missingAlt: 0 },
        issues: [{ severity: "notice", code: "robots-blocked", message: "Blocked by robots.txt and not crawled" }],
      });
      continue;
    }

    const page = await inspectPage(current);
    pages.push(page.publicData);

    for (const href of page.internalLinks) {
      if (queue.length + pages.length >= maxPages * 4) break;
      try {
        const next = canonicalize(new URL(href, current));
        if (next.origin !== startUrl.origin) continue;
        if (!isHttpUrl(next) || shouldSkipPath(next)) continue;
        if (!visited.has(next.href) && !queued.has(next.href)) {
          queued.add(next.href);
          queue.push(next);
        }
      } catch {
        // Ignore malformed links.
      }
    }
  }

  return { pages, queuedRemaining: queue.length };
}

async function inspectPage(url) {
  const startedAt = Date.now();
  let response;

  try {
    response = await fetchWithTimeout(url.href, {
      headers: {
        "user-agent": BOT_UA,
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      },
      redirect: "follow",
    });
  } catch (error) {
    return {
      internalLinks: [],
      publicData: {
        url: url.href,
        status: 0,
        contentType: "fetch-error",
        responseMs: Date.now() - startedAt,
        score: 0,
        title: "",
        metaDescription: "",
        h1: "",
        canonical: "",
        wordCount: 0,
        links: { internal: 0, external: 0 },
        images: { total: 0, missingAlt: 0 },
        issues: [{ severity: "critical", code: "fetch-error", message: `Could not fetch page: ${safeError(error)}` }],
      },
    };
  }

  const responseMs = Date.now() - startedAt;
  const contentType = response.headers.get("content-type") || "";
  const status = response.status;
  const finalUrl = response.url || url.href;

  if (!contentType.toLowerCase().includes("text/html")) {
    const issues = [];
    if (status < 200 || status >= 400) issues.push({ severity: "critical", code: "http-status", message: `HTTP status ${status}` });
    return {
      internalLinks: [],
      publicData: {
        url: finalUrl,
        status,
        contentType,
        responseMs,
        score: issues.length ? 40 : 100,
        title: "",
        metaDescription: "",
        h1: "",
        canonical: "",
        wordCount: 0,
        links: { internal: 0, external: 0 },
        images: { total: 0, missingAlt: 0 },
        issues,
      },
    };
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength && contentLength > MAX_HTML_BYTES) {
    return {
      internalLinks: [],
      publicData: {
        url: finalUrl,
        status,
        contentType,
        responseMs,
        score: 60,
        title: "",
        metaDescription: "",
        h1: "",
        canonical: "",
        wordCount: 0,
        links: { internal: 0, external: 0 },
        images: { total: 0, missingAlt: 0 },
        issues: [{ severity: "warning", code: "html-too-large", message: "HTML document is too large to analyze safely" }],
      },
    };
  }

  let html = await response.text();
  if (html.length > MAX_HTML_BYTES) html = html.slice(0, MAX_HTML_BYTES);

  const data = parseHtml(html, new URL(finalUrl));
  const issues = evaluatePage({ status, responseMs, ...data });
  const score = calculatePageScore(issues);

  return {
    internalLinks: data.internalLinkHrefs,
    publicData: {
      url: finalUrl,
      status,
      contentType,
      responseMs,
      score,
      title: data.title,
      metaDescription: data.metaDescription,
      h1: data.h1,
      h1Count: data.h1Count,
      h2Count: data.h2Count,
      canonical: data.canonical,
      robots: data.robots,
      lang: data.lang,
      wordCount: data.wordCount,
      schemaCount: data.schemaCount,
      links: { internal: data.internalCount, external: data.externalCount },
      images: { total: data.imageCount, missingAlt: data.missingAlt },
      issues,
    },
  };
}

function parseHtml(html, pageUrl) {
  const title = cleanText(matchFirst(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i));
  const metaDescription = cleanText(matchAttrTag(html, "meta", "name", "description", "content"));
  const canonical = cleanText(matchAttrTag(html, "link", "rel", "canonical", "href"));
  const robots = cleanText(matchAttrTag(html, "meta", "name", "robots", "content")).toLowerCase();
  const lang = cleanText((html.match(/<html\b[^>]*\blang=["']?([^"'\s>]+)/i) || [])[1] || "");
  const viewport = cleanText(matchAttrTag(html, "meta", "name", "viewport", "content"));
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => cleanText(stripTags(m[1]))).filter(Boolean);
  const h2Count = [...html.matchAll(/<h2\b[^>]*>/gi)].length;
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const missingAlt = imageTags.filter((tag) => !/\balt\s*=\s*["'][^"']*["']/i.test(tag) && !/\balt\s*=\s*[^\s>]+/i.test(tag)).length;
  const schemaCount = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/gi)].length;
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1].trim()).filter(Boolean);
  const internalLinkHrefs = [];
  let internalCount = 0;
  let externalCount = 0;

  for (const href of hrefs) {
    if (/^(mailto:|tel:|javascript:|data:)/i.test(href) || href.startsWith("#")) continue;
    try {
      const resolved = new URL(href, pageUrl);
      if (!isHttpUrl(resolved)) continue;
      if (resolved.origin === pageUrl.origin) {
        internalCount += 1;
        internalLinkHrefs.push(resolved.href);
      } else {
        externalCount += 1;
      }
    } catch {
      // Ignore malformed href.
    }
  }

  const stripped = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const text = decodeEntities(stripped).replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(" ").filter((w) => w.length > 1).length : 0;

  return {
    title,
    metaDescription,
    canonical,
    robots,
    lang,
    viewport,
    h1: h1s[0] || "",
    h1Count: h1s.length,
    h2Count,
    imageCount: imageTags.length,
    missingAlt,
    schemaCount,
    wordCount,
    internalCount,
    externalCount,
    internalLinkHrefs,
  };
}

function evaluatePage(page) {
  const issues = [];
  if (page.status < 200 || page.status >= 400) issues.push({ severity: "critical", code: "http-status", message: `HTTP status ${page.status}` });
  if (!page.title) issues.push({ severity: "critical", code: "missing-title", message: "Missing page title" });
  else if (page.title.length < 15 || page.title.length > 65) issues.push({ severity: "warning", code: "title-length", message: `Title length is ${page.title.length} characters` });
  if (!page.metaDescription) issues.push({ severity: "warning", code: "missing-description", message: "Missing meta description" });
  else if (page.metaDescription.length < 50 || page.metaDescription.length > 170) issues.push({ severity: "notice", code: "description-length", message: `Meta description length is ${page.metaDescription.length} characters` });
  if (page.h1Count === 0) issues.push({ severity: "critical", code: "missing-h1", message: "Missing H1 heading" });
  else if (page.h1Count > 1) issues.push({ severity: "warning", code: "multiple-h1", message: `${page.h1Count} H1 headings detected` });
  if (!page.canonical) issues.push({ severity: "warning", code: "missing-canonical", message: "Missing canonical URL" });
  if (!page.lang) issues.push({ severity: "notice", code: "missing-lang", message: "Missing HTML language attribute" });
  if (!page.viewport) issues.push({ severity: "warning", code: "missing-viewport", message: "Missing viewport meta tag" });
  if (page.robots.includes("noindex")) issues.push({ severity: "warning", code: "noindex", message: "Page contains a noindex directive" });
  if (page.imageCount && page.missingAlt) issues.push({ severity: "warning", code: "missing-alt", message: `${page.missingAlt} of ${page.imageCount} images are missing alt attributes` });
  if (page.wordCount < 150) issues.push({ severity: "notice", code: "thin-content", message: `Low visible word count: ${page.wordCount}` });
  if (page.responseMs > 2500) issues.push({ severity: "warning", code: "slow-response", message: `Origin response took ${page.responseMs} ms` });
  if (page.internalCount === 0) issues.push({ severity: "notice", code: "no-internal-links", message: "No crawlable internal links detected" });
  return issues;
}

function calculatePageScore(issues) {
  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === "critical" ? 18 : issue.severity === "warning" ? 8 : 3;
  }
  return Math.max(0, score);
}

async function readRobots(target) {
  const robotsUrl = new URL("/robots.txt", target.origin);
  try {
    const response = await fetchWithTimeout(robotsUrl.href, { headers: { "user-agent": BOT_UA } });
    if (!response.ok) return { reachable: false, status: response.status, disallow: [] };
    const text = (await response.text()).slice(0, 200_000);
    return { reachable: true, status: response.status, disallow: parseRobotsDisallow(text) };
  } catch {
    return { reachable: false, status: 0, disallow: [] };
  }
}

function parseRobotsDisallow(text) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/#.*/, "").trim()).filter(Boolean);
  const disallow = [];
  let applies = false;
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") applies = value === "*" || value.toLowerCase().includes("jamesseo");
    if (key === "disallow" && applies && value) disallow.push(value);
  }
  return disallow.slice(0, 200);
}

function isRobotsDisallowed(url, robots) {
  if (!robots?.disallow?.length) return false;
  const path = `${url.pathname}${url.search}`;
  return robots.disallow.some((rule) => rule !== "/" ? path.startsWith(rule) : true);
}

function normalizeTarget(value) {
  if (typeof value !== "string" || !value.trim()) return { ok: false, error: "Enter a website URL" };
  let raw = value.trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const url = new URL(raw);
    if (!isHttpUrl(url)) return { ok: false, error: "Only HTTP and HTTPS URLs are supported" };
    if (!isPublicHostname(url.hostname)) return { ok: false, error: "Private or local network targets are not allowed" };
    url.hash = "";
    return { ok: true, url: canonicalize(url) };
  } catch {
    return { ok: false, error: "Enter a valid website URL" };
  }
}

function isPublicHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (host === "0.0.0.0" || host === "127.0.0.1" || host === "::1") return false;
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return false;
  const private172 = host.match(/^172\.(\d{1,3})\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return false;
  if (host === "metadata.google.internal") return false;
  return true;
}

function canonicalize(url) {
  const next = new URL(url.href);
  next.hash = "";
  for (const key of [...next.searchParams.keys()]) {
    if (/^(utm_|gclid$|fbclid$|msclkid$)/i.test(key)) next.searchParams.delete(key);
  }
  if (next.pathname !== "/" && next.pathname.endsWith("/")) next.pathname = next.pathname.replace(/\/+$/, "/");
  return next;
}

function shouldSkipPath(url) {
  return /\.(?:jpg|jpeg|png|gif|webp|svg|avif|pdf|zip|rar|7z|mp4|mov|avi|mp3|css|js|xml|json|txt|woff2?|ttf|eot)(?:$|\?)/i.test(url.pathname + url.search);
}

function isHttpUrl(url) {
  return url.protocol === "http:" || url.protocol === "https:";
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function matchFirst(html, regex) {
  return (html.match(regex) || [])[1] || "";
}

function matchAttrTag(html, tagName, matchAttr, matchValue, returnAttr) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) || [];
  for (const tag of tags) {
    const attrs = parseAttrs(tag);
    const compare = (attrs[matchAttr] || "").toLowerCase().split(/\s+/);
    if (compare.includes(matchValue.toLowerCase()) && attrs[returnAttr] != null) return attrs[returnAttr];
  }
  return "";
}

function parseAttrs(tag) {
  const attrs = {};
  const regex = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match;
  while ((match = regex.exec(tag))) attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  return attrs;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ");
}

function cleanText(value) {
  return decodeEntities(String(value || "")).replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function safeError(error) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  return message.slice(0, 160);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}
