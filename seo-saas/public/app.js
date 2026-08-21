const state = {
  audit: null,
  currentView: (location.hash || "#overview").slice(1),
};

const views = new Set(["overview", "projects", "audit", "keywords", "rank", "competitors", "backlinks", "content", "ai-search"]);
const viewLabels = {
  overview: "Overview",
  projects: "Projects",
  audit: "Site Audit",
  keywords: "Keywords",
  rank: "Rank Tracker",
  competitors: "Competitors",
  backlinks: "Backlinks",
  content: "Content",
  "ai-search": "AI Search",
};

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function showView(name) {
  const safeName = views.has(name) ? name : "overview";
  state.currentView = safeName;
  qsa("[data-view-panel]").forEach((el) => el.classList.toggle("active", el.dataset.viewPanel === safeName));
  qsa("[data-view]").forEach((el) => el.classList.toggle("active", el.dataset.view === safeName));
  qs("#currentCrumb").textContent = viewLabels[safeName] || safeName;
  if (location.hash !== `#${safeName}`) history.replaceState(null, "", `#${safeName}`);
  document.body.classList.remove("sidebar-open");
  window.scrollTo({ top: 0, behavior: "instant" });
}

qsa("[data-view]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  showView(link.dataset.view);
}));

window.addEventListener("hashchange", () => showView((location.hash || "#overview").slice(1)));
qs("#openSidebar").addEventListener("click", () => document.body.classList.add("sidebar-open"));
qs("#closeSidebar").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
qs("#sidebarBackdrop").addEventListener("click", () => document.body.classList.remove("sidebar-open"));

for (const id of ["heroAudit", "newAuditTop"]) {
  qs(`#${id}`).addEventListener("click", () => {
    showView("audit");
    setTimeout(() => qs("#auditUrl").focus(), 0);
  });
}

qs("#auditForm").addEventListener("submit", runAudit);
qs("#pageSearch").addEventListener("input", renderPages);

async function runAudit(event) {
  event.preventDefault();
  const url = qs("#auditUrl").value.trim();
  const maxPages = Number(qs("#maxPages").value || 15);
  if (!url) return;

  setAuditLoading(true);
  hide(qs("#auditError"));
  try {
    const response = await fetch("/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, maxPages }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Audit failed");
    state.audit = payload;
    renderAudit(payload);
    renderOverview(payload);
    show(qs("#auditResults"));
  } catch (error) {
    qs("#auditError").textContent = error?.message || "The audit could not be completed.";
    show(qs("#auditError"));
  } finally {
    setAuditLoading(false);
  }
}

function renderAudit(data) {
  const counts = data.issueCounts || {};
  qs("#auditScore").textContent = data.score ?? 0;
  qs("#scoreRing").style.setProperty("--score", data.score ?? 0);
  qs("#scoreLabel").textContent = scoreLabel(data.score);
  qs("#scoreSubtext").textContent = `${data.pagesCrawled} page${data.pagesCrawled === 1 ? "" : "s"} crawled in this session.`;
  qs("#resultCritical").textContent = counts.critical || 0;
  qs("#resultWarning").textContent = counts.warning || 0;
  qs("#resultNotice").textContent = counts.notice || 0;

  qs("#factTarget").textContent = data.origin || data.target;
  qs("#factPages").textContent = String(data.pagesCrawled || 0);
  qs("#factDuration").textContent = formatDuration(data.durationMs || 0);
  qs("#factRobots").textContent = data.robots?.reachable ? `HTTP ${data.robots.status}, ${data.robots.disallowCount} disallow rule${data.robots.disallowCount === 1 ? "" : "s"}` : "Not available";
  qs("#factOk").textContent = String(data.statusCounts?.ok || 0);

  renderIssues(data.pages || []);
  renderPages();
}

function renderIssues(pages) {
  const groups = new Map();
  for (const page of pages) {
    for (const issue of page.issues || []) {
      const key = issue.code || issue.message;
      const entry = groups.get(key) || { ...issue, urls: [] };
      entry.urls.push(page.url);
      groups.set(key, entry);
    }
  }
  const rank = { critical: 0, warning: 1, notice: 2 };
  const items = [...groups.values()].sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9) || b.urls.length - a.urls.length);
  const total = items.reduce((sum, item) => sum + item.urls.length, 0);
  qs("#issueCountLabel").textContent = `${total} ISSUE${total === 1 ? "" : "S"}`;
  const root = qs("#issuesList");
  if (!items.length) {
    root.innerHTML = `<div class="empty-state compact"><div class="empty-icon">✓</div><div><strong>No issues in the checks performed.</strong><p>This does not replace a full enterprise crawler, but this crawl passed the current MVP rules.</p></div></div>`;
    return;
  }
  root.innerHTML = items.map((item) => `
    <div class="issue-row">
      <span class="issue-severity ${escapeHtml(item.severity)}">${escapeHtml(item.severity).toUpperCase()}</span>
      <div class="issue-message"><strong>${escapeHtml(item.message)}</strong><p title="${escapeHtml(item.urls[0])}">${escapeHtml(shortUrl(item.urls[0]))}${item.urls.length > 1 ? ` + ${item.urls.length - 1} more` : ""}</p></div>
      <span class="issue-count">${item.urls.length}</span>
    </div>`).join("");
}

function renderPages() {
  if (!state.audit) return;
  const query = qs("#pageSearch").value.trim().toLowerCase();
  const pages = (state.audit.pages || []).filter((page) => !query || page.url.toLowerCase().includes(query) || (page.title || "").toLowerCase().includes(query));
  qs("#pagesTableBody").innerHTML = pages.map((page) => `
    <tr>
      <td class="url-cell"><strong title="${escapeHtml(page.url)}">${escapeHtml(shortUrl(page.url))}</strong><small>${escapeHtml(page.canonical || "No canonical detected")}</small></td>
      <td><span class="status-code">${page.status || "-"}</span></td>
      <td><span class="score-mini">${page.score ?? "-"}</span></td>
      <td>${escapeHtml(truncate(page.title || "Missing", 56))}</td>
      <td>${escapeHtml(truncate(page.h1 || "Missing", 48))}</td>
      <td>${formatNumber(page.wordCount || 0)}</td>
      <td><span class="${(page.issues?.length || 0) ? "issue-mini" : ""}">${page.issues?.length || 0}</span></td>
      <td>${formatDuration(page.responseMs || 0)}</td>
    </tr>`).join("");
}

function renderOverview(data) {
  const counts = data.issueCounts || {};
  qs("#metricScore").textContent = data.score ?? "--";
  qs("#metricScoreCaption").textContent = scoreLabel(data.score);
  qs("#metricPages").textContent = formatNumber(data.pagesCrawled || 0);
  qs("#metricPagesCaption").textContent = shortUrl(data.origin || data.target || "Current session");
  qs("#metricCritical").textContent = counts.critical || 0;
  qs("#metricWarnings").textContent = counts.warning || 0;
  renderOpportunities(data.pages || []);
}

function renderOpportunities(pages) {
  const groups = new Map();
  for (const page of pages) {
    for (const issue of page.issues || []) {
      const key = issue.code || issue.message;
      const entry = groups.get(key) || { ...issue, count: 0 };
      entry.count += 1;
      groups.set(key, entry);
    }
  }
  const priority = { critical: 0, warning: 1, notice: 2 };
  const top = [...groups.values()].sort((a,b) => (priority[a.severity] ?? 9) - (priority[b.severity] ?? 9) || b.count - a.count).slice(0, 5);
  const root = qs("#opportunityFeed");
  if (!top.length) {
    root.className = "opportunity-feed empty-state compact";
    root.innerHTML = `<div class="empty-icon">✓</div><div><strong>No immediate issues from this crawl.</strong><p>Connect Search Console next to add ranking and traffic opportunities to this feed.</p></div>`;
    return;
  }
  root.className = "opportunity-feed";
  root.innerHTML = top.map((item) => `
    <div class="opportunity-item">
      <i class="opportunity-line ${escapeHtml(item.severity)}"></i>
      <div><strong>${escapeHtml(item.message)}</strong><p>${item.count} affected page${item.count === 1 ? "" : "s"} in the latest crawl.</p></div>
      <span>${escapeHtml(item.severity).toUpperCase()}</span>
    </div>`).join("");
}

function setAuditLoading(isLoading) {
  qs("#auditSubmit").disabled = isLoading;
  qs("#auditSubmit").innerHTML = isLoading ? "CRAWLING..." : "RUN LIVE AUDIT <span>→</span>";
  qs("#auditLoading").classList.toggle("hidden", !isLoading);
}

function scoreLabel(score = 0) {
  if (score >= 90) return "Excellent technical baseline";
  if (score >= 75) return "Healthy with improvements";
  if (score >= 55) return "Needs focused work";
  return "Critical issues detected";
}

function shortUrl(value) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}${url.search}`;
  } catch {
    return value;
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

showView(state.currentView);
