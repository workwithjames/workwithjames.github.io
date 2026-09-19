const gscState = { projectId: null, status: null, properties: [], data: null, busy: false };

const style = document.createElement("link");
style.rel = "stylesheet";
style.href = "/gsc.css?v=20260821-1";
document.head.appendChild(style);

const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

bootGscUi();

function bootGscUi() {
  modernizeFutureModules();
  ensureMounts();
  window.addEventListener("hashchange", () => { ensureMounts(); refreshForCurrentProject(); });
  document.addEventListener("change", (event) => {
    if (event.target?.id === "auditProjectSelect") setTimeout(refreshForCurrentProject, 80);
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-project-select], [data-project-audit], .workspace-option")) setTimeout(refreshForCurrentProject, 180);
  });
  const observer = new MutationObserver(() => {
    const id = currentProjectId();
    if (id !== gscState.projectId) refreshForCurrentProject();
  });
  const context = q("#auditProjectContext") || q(".audit-form-panel");
  if (context) observer.observe(context, { childList: true, subtree: true, attributes: true });
  setTimeout(refreshForCurrentProject, 350);
  setTimeout(refreshForCurrentProject, 1200);
}

function ensureMounts() {
  const keywords = q("#view-keywords");
  if (keywords && !q("#gscKeywordsLive", keywords)) {
    q(".module-cards", keywords)?.remove();
    const mount = document.createElement("div");
    mount.id = "gscKeywordsLive";
    mount.className = "gsc-live";
    keywords.appendChild(mount);
  }
  const content = q("#view-content");
  if (content && !q("#gscContentLive", content)) {
    q(".placeholder-module", content)?.remove();
    const mount = document.createElement("div");
    mount.id = "gscContentLive";
    mount.className = "gsc-live";
    content.appendChild(mount);
  }
}

function modernizeFutureModules() {
  const replacements = {
    rank: { title: "Rank tracking is the next market-data layer.", copy: "Track selected keywords by country and device once the SERP provider is connected.", chip: "COMING NEXT" },
    competitors: { title: "Add competitors and compare search visibility.", copy: "Competitor domains are supported at project level. Keyword-gap analysis activates with the market keyword dataset.", chip: "DATA SOURCE REQUIRED" },
    backlinks: { title: "Connect backlink intelligence.", copy: "Analyze referring domains, new and lost links, anchors and competitor link opportunities through a dedicated backlink index.", chip: "DATA SOURCE REQUIRED" },
    "ai-search": { title: "Measure visibility across AI search.", copy: "Track brand mentions, citations and share of answer once the AI visibility data source is connected.", chip: "PLANNED" },
  };
  for (const [view, replacement] of Object.entries(replacements)) {
    const section = q(`#view-${view}`);
    const card = q(".placeholder-module", section);
    if (!card || card.dataset.customerReady) continue;
    q("h2", card).textContent = replacement.title;
    q("p:not(.eyebrow)", card).textContent = replacement.copy;
    const chip = q(".module-chip", card);
    if (chip) chip.textContent = replacement.chip;
    card.dataset.customerReady = "true";
  }
}

async function refreshForCurrentProject() {
  ensureMounts();
  const projectId = currentProjectId();
  if (!projectId) {
    gscState.projectId = null; gscState.status = null; gscState.properties = []; gscState.data = null;
    renderAll();
    return;
  }
  if (gscState.busy && projectId === gscState.projectId) return;
  gscState.projectId = projectId;
  gscState.busy = true;
  renderLoading();
  try {
    gscState.status = await api(`/api/gsc/status?project_id=${encodeURIComponent(projectId)}`);
    gscState.properties = [];
    gscState.data = null;
    if (gscState.status.connected && gscState.status.connection?.selectedProperty) {
      gscState.data = await api(`/api/gsc/data?project_id=${encodeURIComponent(projectId)}`);
    } else if (gscState.status.connected && gscState.status.configured) {
      const properties = await api(`/api/gsc/properties?project_id=${encodeURIComponent(projectId)}`);
      gscState.properties = properties.properties || [];
    }
  } catch (error) {
    gscState.status = { error: error.message };
  } finally {
    gscState.busy = false;
    renderAll();
  }
}

function currentProjectId() {
  return q("#auditProjectSelect")?.value || null;
}

function renderLoading() {
  const html = `<div class="gsc-state-card"><div class="gsc-spinner"></div><div><strong>Loading Search Console</strong><p>Checking the active project's connection and latest search data.</p></div></div>`;
  if (q("#gscKeywordsLive")) q("#gscKeywordsLive").innerHTML = html;
  if (q("#gscContentLive")) q("#gscContentLive").innerHTML = html;
}

function renderAll() {
  renderKeywords();
  renderContent();
}

function renderKeywords() {
  const root = q("#gscKeywordsLive");
  if (!root) return;
  const projectId = gscState.projectId;
  if (!projectId) {
    root.innerHTML = noProjectState("Keywords");
    return;
  }
  if (gscState.status?.error) {
    root.innerHTML = errorState(gscState.status.error);
    return;
  }
  if (!gscState.status?.configured) {
    root.innerHTML = setupState();
    return;
  }
  if (!gscState.status?.connected) {
    root.innerHTML = connectState();
    bindConnect(root);
    return;
  }
  if (!gscState.status.connection?.selectedProperty) {
    root.innerHTML = propertyState();
    bindProperty(root);
    return;
  }
  if (!gscState.data?.sync) {
    root.innerHTML = firstSyncState();
    bindSync(root);
    bindDisconnect(root);
    return;
  }

  const sync = gscState.data.sync;
  const queries = gscState.data.queries || [];
  const striking = queries.filter((row) => row.position >= 4 && row.position <= 15 && row.impressions >= 10).length;
  const lowCtr = queries.filter((row) => row.impressions >= 100 && row.position <= 10 && row.ctr < 0.02).length;
  root.innerHTML = `
    ${toolbarHtml(sync)}
    <div class="gsc-metrics">
      ${metric("CLICKS", fmt(sync.clicks), `${sync.startDate} to ${sync.endDate}`)}
      ${metric("IMPRESSIONS", fmt(sync.impressions), `${sync.queryCount} query rows`)}
      ${metric("CTR", pct(sync.ctr), "Organic click-through rate")}
      ${metric("AVG. POSITION", decimal(sync.position), "Search Console average")}
    </div>
    <div class="gsc-opportunity-strip">
      <div><span>STRIKING DISTANCE</span><strong>${fmt(striking)}</strong><small>queries ranking #4–15</small></div>
      <div><span>CTR OPPORTUNITIES</span><strong>${fmt(lowCtr)}</strong><small>high-impression queries with weak CTR</small></div>
      <div><span>PAGES FOUND</span><strong>${fmt(sync.pageCount)}</strong><small>landing pages in this sync</small></div>
    </div>
    <article class="gsc-panel">
      <div class="gsc-panel-head"><div><span>SEARCH QUERIES</span><h2>Keywords already earning impressions</h2></div><input id="gscQueryFilter" class="gsc-filter" type="search" placeholder="Filter keywords"></div>
      <div class="gsc-table-wrap"><table class="gsc-table"><thead><tr><th>KEYWORD</th><th>CLICKS</th><th>IMPRESSIONS</th><th>CTR</th><th>POSITION</th><th>OPPORTUNITY</th></tr></thead><tbody id="gscQueryRows">${queryRowsHtml(queries)}</tbody></table></div>
    </article>
    <article class="gsc-provider-card"><div><span>MARKET KEYWORD DATA</span><h3>Keyword Explorer</h3><p>Search volume, difficulty, CPC, global markets and SERP discovery will plug into a separate provider layer. Search Console data above is first-party data from the selected website.</p></div><b>PROVIDER NEXT</b></article>
  `;
  bindToolbar(root);
  q("#gscQueryFilter", root)?.addEventListener("input", (event) => {
    const term = event.target.value.trim().toLowerCase();
    q("#gscQueryRows", root).innerHTML = queryRowsHtml(queries.filter((row) => !term || row.query.toLowerCase().includes(term)));
  });
}

function renderContent() {
  const root = q("#gscContentLive");
  if (!root) return;
  if (!gscState.projectId) { root.innerHTML = noProjectState("Content intelligence"); return; }
  if (gscState.status?.error) { root.innerHTML = errorState(gscState.status.error); return; }
  if (!gscState.status?.configured || !gscState.status?.connected || !gscState.status?.connection?.selectedProperty) {
    root.innerHTML = `<div class="gsc-state-card"><div class="gsc-state-icon">↗</div><div><strong>Connect Search Console from Keywords</strong><p>Content intelligence uses the same project's Search Console connection. Open Keywords to connect Google and select the property.</p><button class="gsc-primary" id="openKeywordsForGsc">OPEN KEYWORDS</button></div></div>`;
    q("#openKeywordsForGsc", root)?.addEventListener("click", () => { location.hash = "keywords"; });
    return;
  }
  if (!gscState.data?.sync) {
    root.innerHTML = `<div class="gsc-state-card"><div class="gsc-state-icon">↻</div><div><strong>Sync Search Console first</strong><p>Run the first sync in Keywords. This page will then surface landing-page performance and content opportunities.</p><button class="gsc-primary" id="openKeywordsForSync">OPEN KEYWORDS</button></div></div>`;
    q("#openKeywordsForSync", root)?.addEventListener("click", () => { location.hash = "keywords"; });
    return;
  }
  const pages = gscState.data.pages || [];
  const lowCtr = pages.filter((row) => row.impressions >= 100 && row.position <= 10 && row.ctr < 0.02);
  const striking = pages.filter((row) => row.position >= 4 && row.position <= 15 && row.impressions >= 20);
  const highImpression = [...pages].sort((a,b) => b.impressions-a.impressions).slice(0, 10);
  root.innerHTML = `
    <div class="gsc-content-metrics">
      ${metric("LANDING PAGES", fmt(gscState.data.sync.pageCount), "Pages with Google search data")}
      ${metric("LOW CTR", fmt(lowCtr.length), "Pages worth testing titles/snippets")}
      ${metric("RANKING #4–15", fmt(striking.length), "Pages close to stronger visibility")}
    </div>
    <div class="gsc-content-grid">
      <article class="gsc-panel"><div class="gsc-panel-head"><div><span>OPPORTUNITIES</span><h2>Pages to improve first</h2></div></div><div class="gsc-opportunity-list">${contentOpportunityHtml(lowCtr, striking)}</div></article>
      <article class="gsc-panel"><div class="gsc-panel-head"><div><span>DEMAND</span><h2>Highest-impression pages</h2></div></div><div class="gsc-page-list">${highImpression.map(pageRowCard).join("") || emptyLine("No page rows returned yet.")}</div></article>
    </div>
  `;
}

function toolbarHtml(sync) {
  return `<div class="gsc-toolbar"><div><span>GOOGLE SEARCH CONSOLE</span><strong>${esc(gscState.status.connection.selectedProperty)}</strong><small>Last synced ${gscState.status.connection.lastSyncAt ? esc(formatDate(gscState.status.connection.lastSyncAt)) : "not yet"} · Search Console data is typically delayed by 2–3 days.</small></div><div class="gsc-toolbar-actions"><button class="gsc-secondary" id="gscDisconnect">DISCONNECT</button><button class="gsc-primary" id="gscSync">SYNC 28 DAYS</button></div></div>`;
}

function setupState() {
  return `<div class="gsc-state-card"><div class="gsc-state-icon">G</div><div><strong>Google connection is built, but credentials are not configured.</strong><p>The platform now has OAuth, property selection, secure token storage and Search Console sync support. Add the Google OAuth credentials to the deployment secrets to activate the Connect Google button.</p><div class="gsc-code-row"><code>GSC_CLIENT_ID</code><code>GSC_CLIENT_SECRET</code><code>GSC_TOKEN_ENCRYPTION_KEY</code></div></div></div>`;
}
function connectState() {
  return `<div class="gsc-state-card gsc-connect-card"><div class="gsc-state-icon">G</div><div><span>FIRST-PARTY SEARCH DATA</span><strong>Connect Google Search Console</strong><p>Authorize read-only access for this website to import real queries, pages, clicks, impressions, CTR and average position.</p><button class="gsc-primary" id="gscConnect">CONNECT GOOGLE</button></div></div>`;
}
function propertyState() {
  const options = gscState.properties.length ? gscState.properties.map((item) => `<option value="${escAttr(item.siteUrl)}">${item.suggested ? "★ " : ""}${esc(item.siteUrl)} · ${esc(item.permissionLevel)}</option>`).join("") : `<option value="">No Search Console properties found</option>`;
  return `<div class="gsc-state-card"><div class="gsc-state-icon">✓</div><div class="gsc-property-setup"><span>GOOGLE CONNECTED</span><strong>Select the property for this project</strong><p>Domain properties such as <code>sc-domain:example.com</code> and URL-prefix properties are both supported.</p><div class="gsc-property-row"><select id="gscPropertySelect">${options}</select><button class="gsc-primary" id="gscSaveProperty" ${gscState.properties.length ? "" : "disabled"}>USE PROPERTY</button></div><button class="gsc-text-button" id="gscDisconnect">Disconnect Google</button></div></div>`;
}
function firstSyncState() {
  return `<div class="gsc-state-card"><div class="gsc-state-icon">↻</div><div><span>PROPERTY READY</span><strong>${esc(gscState.status.connection.selectedProperty)}</strong><p>Run the first 28-day sync to populate Keywords and Content with actual Search Console performance.</p><div class="gsc-inline-actions"><button class="gsc-primary" id="gscSync">SYNC SEARCH DATA</button><button class="gsc-secondary" id="gscDisconnect">DISCONNECT</button></div></div></div>`;
}
function noProjectState(label) { return `<div class="gsc-state-card"><div class="gsc-state-icon">◇</div><div><strong>Select a website project</strong><p>${esc(label)} is project-specific. Create or select a website in Projects first.</p><button class="gsc-primary" onclick="location.hash='projects'">OPEN PROJECTS</button></div></div>`; }
function errorState(message) { return `<div class="gsc-state-card gsc-error"><div class="gsc-state-icon">!</div><div><strong>Search Console could not load</strong><p>${esc(message)}</p><button class="gsc-secondary" id="gscRetry">RETRY</button></div></div>`; }

function bindConnect(root) { q("#gscConnect", root)?.addEventListener("click", connectGoogle); }
function bindProperty(root) {
  q("#gscSaveProperty", root)?.addEventListener("click", saveProperty);
  bindDisconnect(root);
}
function bindSync(root) { q("#gscSync", root)?.addEventListener("click", syncGsc); }
function bindDisconnect(root) { q("#gscDisconnect", root)?.addEventListener("click", disconnectGsc); }
function bindToolbar(root) { bindSync(root); bindDisconnect(root); }

document.addEventListener("click", (event) => { if (event.target?.id === "gscRetry") refreshForCurrentProject(); });

async function connectGoogle() {
  try {
    setBusyButton("#gscConnect", "OPENING GOOGLE...");
    const data = await api(`/api/gsc/connect?project_id=${encodeURIComponent(gscState.projectId)}`);
    location.href = data.authUrl;
  } catch (error) { showInlineError(error.message); }
}
async function saveProperty() {
  const select = q("#gscPropertySelect");
  if (!select?.value) return;
  try {
    setBusyButton("#gscSaveProperty", "SAVING...");
    await api("/api/gsc/property", { method: "POST", body: { projectId: gscState.projectId, propertyUrl: select.value } });
    await refreshForCurrentProject();
  } catch (error) { showInlineError(error.message); }
}
async function syncGsc() {
  try {
    setBusyButton("#gscSync", "SYNCING...");
    gscState.data = await api("/api/gsc/sync", { method: "POST", body: { projectId: gscState.projectId, days: 28 } });
    gscState.status = await api(`/api/gsc/status?project_id=${encodeURIComponent(gscState.projectId)}`);
    renderAll();
  } catch (error) { showInlineError(error.message); }
}
async function disconnectGsc() {
  if (!confirm("Disconnect Google Search Console from this project? Saved sync snapshots will remain.")) return;
  try {
    await api("/api/gsc/disconnect", { method: "POST", body: { projectId: gscState.projectId } });
    await refreshForCurrentProject();
  } catch (error) { showInlineError(error.message); }
}

function queryRowsHtml(rows) {
  if (!rows.length) return `<tr><td colspan="6" class="gsc-empty-cell">No matching query rows.</td></tr>`;
  return rows.slice(0, 500).map((row) => {
    const opportunity = row.position >= 4 && row.position <= 15 ? "STRIKING DISTANCE" : row.impressions >= 100 && row.position <= 10 && row.ctr < .02 ? "LOW CTR" : "";
    return `<tr><td class="gsc-keyword">${esc(row.query)}</td><td>${fmt(row.clicks)}</td><td>${fmt(row.impressions)}</td><td>${pct(row.ctr)}</td><td>${decimal(row.position)}</td><td>${opportunity ? `<span class="gsc-tag">${opportunity}</span>` : `<span class="gsc-muted">—</span>`}</td></tr>`;
  }).join("");
}

function contentOpportunityHtml(lowCtr, striking) {
  const items = [
    ...lowCtr.slice(0, 5).map((row) => ({ type: "LOW CTR", row, detail: `${fmt(row.impressions)} impressions · ${pct(row.ctr)} CTR` })),
    ...striking.slice(0, 5).map((row) => ({ type: "#4–15", row, detail: `Average position ${decimal(row.position)} · ${fmt(row.impressions)} impressions` })),
  ].slice(0, 8);
  if (!items.length) return emptyLine("No high-priority page opportunities matched the current rules.");
  return items.map((item) => `<div class="gsc-opportunity-row"><span>${item.type}</span><div><strong title="${escAttr(item.row.page)}">${esc(shortUrl(item.row.page))}</strong><small>${esc(item.detail)}</small></div></div>`).join("");
}
function pageRowCard(row) { return `<div class="gsc-page-row"><div><strong title="${escAttr(row.page)}">${esc(shortUrl(row.page))}</strong><small>${fmt(row.clicks)} clicks · ${pct(row.ctr)} CTR</small></div><span>${fmt(row.impressions)}<small> impressions</small></span></div>`; }
function emptyLine(text) { return `<div class="gsc-empty-line">${esc(text)}</div>`; }
function metric(label, value, caption) { return `<article class="gsc-metric"><span>${label}</span><strong>${value}</strong><small>${esc(caption)}</small></article>`; }

function showInlineError(message) {
  const root = q("#gscKeywordsLive");
  if (!root) return;
  let error = q(".gsc-inline-error", root);
  if (!error) { error = document.createElement("div"); error.className = "gsc-inline-error"; root.prepend(error); }
  error.textContent = message;
}
function setBusyButton(selector, text) { const button = q(selector); if (button) { button.disabled = true; button.textContent = text; } }

async function api(path, options = {}) {
  const init = { method: options.method || "GET", headers: {} };
  if (options.body !== undefined) { init.headers["content-type"] = "application/json"; init.body = JSON.stringify(options.body); }
  const response = await fetch(path, init);
  let data = {}; try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function fmt(value) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value || 0)); }
function decimal(value) { return Number(value || 0).toFixed(1); }
function pct(value) { return `${(Number(value || 0) * 100).toFixed(1)}%`; }
function formatDate(value) { try { return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); } catch { return value || "-"; } }
function shortUrl(value) { try { const url = new URL(value); return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`; } catch { return value; } }
function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;" }[c])); }
function escAttr(value) { return esc(value); }
