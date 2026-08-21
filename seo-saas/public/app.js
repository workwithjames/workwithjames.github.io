const state = {
  audit: null,
  user: null,
  workspaces: [],
  workspace: null,
  projects: [],
  project: null,
  audits: [],
  currentView: (location.hash || "#overview").slice(1),
};

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "/saas.css?v=20260821-2";
document.head.appendChild(styleLink);

const views = new Set(["overview", "projects", "audit", "keywords", "rank", "competitors", "backlinks", "content", "ai-search"]);
const viewLabels = {
  overview: "Overview", projects: "Projects", audit: "Site Audit", keywords: "Keywords",
  rank: "Rank Tracker", competitors: "Competitors", backlinks: "Backlinks", content: "Content", "ai-search": "AI Search",
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
  if (safeName === "projects") renderProjects();
}

qsa("[data-view]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  showView(link.dataset.view);
}));
window.addEventListener("hashchange", () => showView((location.hash || "#overview").slice(1)));
qs("#openSidebar").addEventListener("click", () => document.body.classList.add("sidebar-open"));
qs("#closeSidebar").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
qs("#sidebarBackdrop").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
qs("#auditForm").addEventListener("submit", runAudit);
qs("#pageSearch").addEventListener("input", renderPages);
qs(".workspace-card").addEventListener("click", toggleWorkspaceMenu);
qs(".avatar-button").addEventListener("click", toggleAccountMenu);

for (const id of ["heroAudit", "newAuditTop"]) {
  qs(`#${id}`).addEventListener("click", () => {
    if (!state.project) {
      showView("projects");
      return;
    }
    showView("audit");
  });
}

bootstrap();

async function bootstrap() {
  try {
    const data = await api("/api/auth/me", { allowUnauthenticated: true });
    if (!data.authenticated) {
      showAuthGate("login");
      return;
    }
    await initializeAuthenticated(data.user);
  } catch (error) {
    showSystemGate(error.message || "The platform is still provisioning its database.");
  }
}

async function initializeAuthenticated(user) {
  state.user = user;
  removeGate();
  updateAccountUI();
  await loadWorkspaces();
  showView(state.currentView);
}

function updateAccountUI() {
  const initials = (state.user?.displayName || state.user?.email || "U").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  qs(".avatar-button").textContent = initials || "U";
  qs(".avatar-button").title = state.user?.email || "Account";
}

async function loadWorkspaces() {
  const data = await api("/api/workspaces");
  state.workspaces = data.workspaces || [];
  if (!state.workspaces.length) {
    state.workspace = null;
    state.projects = [];
    state.project = null;
    updateWorkspaceUI();
    renderProjects();
    openWorkspaceDialog(true);
    return;
  }
  const remembered = localStorage.getItem("jseo_workspace");
  const next = state.workspaces.find((workspace) => workspace.id === remembered) || state.workspaces[0];
  await selectWorkspace(next.id);
}

async function selectWorkspace(workspaceId) {
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return;
  state.workspace = workspace;
  localStorage.setItem("jseo_workspace", workspace.id);
  updateWorkspaceUI();
  closeFloatingMenus();
  await loadProjects();
}

function updateWorkspaceUI() {
  qs(".workspace-copy strong").textContent = state.workspace?.name || "Create workspace";
  const planLine = qs(".plan-line");
  if (planLine && state.workspace) planLine.innerHTML = `<span>${escapeHtml((state.workspace.plan || "free").toUpperCase())} WORKSPACE</span><span>${state.workspace.project_count || state.projects.length || 0} SITES</span>`;
}

async function loadProjects() {
  if (!state.workspace) return;
  const data = await api(`/api/projects?workspace_id=${encodeURIComponent(state.workspace.id)}`);
  state.projects = data.projects || [];
  const remembered = localStorage.getItem(`jseo_project_${state.workspace.id}`);
  state.project = state.projects.find((project) => project.id === remembered) || state.projects[0] || null;
  if (state.project) localStorage.setItem(`jseo_project_${state.workspace.id}`, state.project.id);
  updateWorkspaceUI();
  updateAuditProjectContext();
  renderProjects();
  await loadAuditHistory();
}

async function selectProject(projectId, navigate = false) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;
  state.project = project;
  localStorage.setItem(`jseo_project_${state.workspace.id}`, project.id);
  updateAuditProjectContext();
  renderProjects();
  await loadAuditHistory();
  if (navigate) showView("audit");
}

function renderProjects() {
  const section = qs("#view-projects");
  if (!section) return;
  let mount = qs("#projectsLive", section);
  if (!mount) {
    const placeholder = qs(".placeholder-module", section);
    if (placeholder) placeholder.remove();
    mount = document.createElement("div");
    mount.id = "projectsLive";
    mount.className = "projects-live";
    section.appendChild(mount);
  }

  const workspaceName = state.workspace?.name || "No workspace";
  mount.innerHTML = `
    <div class="project-toolbar">
      <div><strong>${escapeHtml(workspaceName)}</strong><p>${state.projects.length} saved website${state.projects.length === 1 ? "" : "s"}. Each project keeps its audit history isolated.</p></div>
      <button class="project-add-button" id="addProjectButton">+ ADD WEBSITE</button>
    </div>
    ${state.projects.length ? `<div class="project-grid">${state.projects.map(projectCardHtml).join("")}</div>` : `
      <div class="project-empty"><strong>No websites in this workspace yet.</strong><p>Add James Realty, one of its subdomains, another business, or any customer website you are authorized to analyze.</p></div>`}
  `;

  qs("#addProjectButton", mount)?.addEventListener("click", openProjectDialog);
  qsa("[data-project-select]", mount).forEach((button) => button.addEventListener("click", () => selectProject(button.dataset.projectSelect, false)));
  qsa("[data-project-audit]", mount).forEach((button) => button.addEventListener("click", () => selectProject(button.dataset.projectAudit, true)));
}

function projectCardHtml(project) {
  const active = state.project?.id === project.id;
  const score = project.latest_score == null ? "--" : project.latest_score;
  const audited = project.last_audit_at ? formatDate(project.last_audit_at) : "Not audited yet";
  return `<article class="project-card ${active ? "active" : ""}">
    <div class="project-domain">${escapeHtml(project.domain)}</div>
    <h3>${escapeHtml(project.name)}</h3>
    <div class="project-meta">${escapeHtml(project.country_code || "GLOBAL")} ${project.timezone ? `· ${escapeHtml(project.timezone)}` : ""}</div>
    <div class="project-score"><strong>${score}</strong><span>LATEST HEALTH<br>${escapeHtml(audited)}</span></div>
    <div class="project-actions">
      <button class="${active ? "primary" : ""}" data-project-select="${project.id}">${active ? "SELECTED" : "SELECT"}</button>
      <button class="primary" data-project-audit="${project.id}">OPEN AUDIT</button>
    </div>
  </article>`;
}

function updateAuditProjectContext() {
  const panel = qs(".audit-form-panel");
  if (!panel) return;
  let context = qs("#auditProjectContext", panel);
  if (!context) {
    context = document.createElement("div");
    context.id = "auditProjectContext";
    context.className = "audit-project-context";
    panel.prepend(context);
  }

  if (!state.projects.length) {
    context.innerHTML = `<div><small>ACTIVE PROJECT</small><strong>No website saved in this workspace</strong></div><button class="project-add-button" id="contextAddProject">ADD WEBSITE</button>`;
    qs("#contextAddProject", context)?.addEventListener("click", openProjectDialog);
    qs("#auditUrl").value = "";
    qs("#auditUrl").readOnly = true;
    return;
  }

  context.innerHTML = `<div><small>ACTIVE PROJECT</small><strong>${escapeHtml(state.project?.name || "Select website")} · ${escapeHtml(state.project?.domain || "")}</strong></div>
    <select id="auditProjectSelect" aria-label="Select project">${state.projects.map((project) => `<option value="${project.id}" ${project.id === state.project?.id ? "selected" : ""}>${escapeHtml(project.name)} · ${escapeHtml(project.domain)}</option>`).join("")}</select>`;
  qs("#auditProjectSelect", context).addEventListener("change", (event) => selectProject(event.target.value, false));
  if (state.project) {
    qs("#auditUrl").value = `${state.project.protocol || "https"}://${state.project.domain}`;
    qs("#auditUrl").readOnly = true;
  }
}

async function runAudit(event) {
  event.preventDefault();
  if (!state.project) {
    showAuditError("Create or select a website project before running an audit.");
    return;
  }
  const maxPages = Number(qs("#maxPages").value || 15);
  setAuditLoading(true);
  hide(qs("#auditError"));
  try {
    const data = await api("/api/audits", { method: "POST", body: { projectId: state.project.id, maxPages } });
    state.audit = data;
    renderAudit(data);
    renderOverview(data);
    show(qs("#auditResults"));
    await loadAuditHistory();
    await refreshProjectsAfterAudit();
  } catch (error) {
    showAuditError(error.message || "The audit could not be completed.");
  } finally {
    setAuditLoading(false);
  }
}

async function refreshProjectsAfterAudit() {
  if (!state.workspace) return;
  const activeId = state.project?.id;
  const data = await api(`/api/projects?workspace_id=${encodeURIComponent(state.workspace.id)}`);
  state.projects = data.projects || [];
  state.project = state.projects.find((project) => project.id === activeId) || state.projects[0] || null;
  renderProjects();
  updateWorkspaceUI();
}

async function loadAuditHistory() {
  ensureAuditHistoryPanel();
  if (!state.project) {
    state.audits = [];
    renderAuditHistory();
    return;
  }
  try {
    const data = await api(`/api/audits?project_id=${encodeURIComponent(state.project.id)}&limit=12`);
    state.audits = data.audits || [];
    renderAuditHistory();
  } catch {
    state.audits = [];
    renderAuditHistory();
  }
}

function ensureAuditHistoryPanel() {
  if (qs("#auditHistoryPanel")) return;
  const formPanel = qs(".audit-form-panel");
  const panel = document.createElement("article");
  panel.id = "auditHistoryPanel";
  panel.className = "panel audit-history";
  panel.innerHTML = `<div class="panel-head"><div><p class="eyebrow">HISTORY</p><h2>Saved audits</h2></div><span class="panel-status" id="historyCount">0 RUNS</span></div><div class="history-list" id="historyList"></div>`;
  formPanel.insertAdjacentElement("afterend", panel);
}

function renderAuditHistory() {
  ensureAuditHistoryPanel();
  qs("#historyCount").textContent = `${state.audits.length} RUN${state.audits.length === 1 ? "" : "S"}`;
  const root = qs("#historyList");
  if (!state.audits.length) {
    root.innerHTML = `<div class="history-empty">No saved audits for this project yet. The next crawl will be stored automatically.</div>`;
    return;
  }
  root.innerHTML = state.audits.map((audit) => `<div class="history-row">
    <div><strong>${escapeHtml(formatDate(audit.completed_at || audit.created_at))}</strong><small>${audit.pages_crawled || 0} pages · ${audit.critical_issues || 0} critical · ${audit.warning_issues || 0} warnings</small></div>
    <div class="history-score">${audit.score == null ? "--" : audit.score}</div>
    <div class="history-status">${escapeHtml(audit.status || "complete")}</div>
    <button data-audit-view="${audit.id}" ${audit.status !== "complete" ? "disabled" : ""}>VIEW RUN</button>
  </div>`).join("");
  qsa("[data-audit-view]", root).forEach((button) => button.addEventListener("click", () => viewSavedAudit(button.dataset.auditView)));
}

async function viewSavedAudit(auditId) {
  try {
    const data = await api(`/api/audits/${encodeURIComponent(auditId)}`);
    state.audit = data;
    renderAudit(data);
    renderOverview(data);
    show(qs("#auditResults"));
    showView("audit");
  } catch (error) {
    showAuditError(error.message || "Could not load the saved audit.");
  }
}

function renderAudit(data) {
  const counts = data.issueCounts || {};
  qs("#auditScore").textContent = data.score ?? 0;
  qs("#scoreRing").style.setProperty("--score", data.score ?? 0);
  qs("#scoreLabel").textContent = scoreLabel(data.score);
  qs("#scoreSubtext").textContent = `${data.pagesCrawled} page${data.pagesCrawled === 1 ? "" : "s"} crawled${data.auditedAt ? ` · ${formatDate(data.auditedAt)}` : ""}.`;
  qs("#resultCritical").textContent = counts.critical || 0;
  qs("#resultWarning").textContent = counts.warning || 0;
  qs("#resultNotice").textContent = counts.notice || 0;
  qs("#factTarget").textContent = data.origin || data.target || "-";
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
    root.innerHTML = `<div class="empty-state compact"><div class="empty-icon">✓</div><div><strong>No issues in the checks performed.</strong><p>This crawl passed the current technical rules.</p></div></div>`;
    return;
  }
  root.innerHTML = items.map((item) => `<div class="issue-row">
    <span class="issue-severity ${escapeHtml(item.severity)}">${escapeHtml(item.severity).toUpperCase()}</span>
    <div class="issue-message"><strong>${escapeHtml(item.message)}</strong><p title="${escapeHtml(item.urls[0])}">${escapeHtml(shortUrl(item.urls[0]))}${item.urls.length > 1 ? ` + ${item.urls.length - 1} more` : ""}</p></div>
    <span class="issue-count">${item.urls.length}</span>
  </div>`).join("");
}

function renderPages() {
  if (!state.audit) return;
  const query = qs("#pageSearch").value.trim().toLowerCase();
  const pages = (state.audit.pages || []).filter((page) => !query || page.url.toLowerCase().includes(query) || (page.title || "").toLowerCase().includes(query));
  qs("#pagesTableBody").innerHTML = pages.map((page) => `<tr>
    <td class="url-cell"><strong title="${escapeHtml(page.url)}">${escapeHtml(shortUrl(page.url))}</strong><small>${escapeHtml(page.canonical || "No canonical detected")}</small></td>
    <td><span class="status-code">${page.status || "-"}</span></td><td><span class="score-mini">${page.score ?? "-"}</span></td>
    <td>${escapeHtml(truncate(page.title || "Missing", 56))}</td><td>${escapeHtml(truncate(page.h1 || "Missing", 48))}</td>
    <td>${formatNumber(page.wordCount || 0)}</td><td><span class="${(page.issues?.length || 0) ? "issue-mini" : ""}">${page.issues?.length || 0}</span></td>
    <td>${formatDuration(page.responseMs || 0)}</td>
  </tr>`).join("");
}

function renderOverview(data) {
  const counts = data.issueCounts || {};
  qs("#metricScore").textContent = data.score ?? "--";
  qs("#metricScoreCaption").textContent = scoreLabel(data.score);
  qs("#metricPages").textContent = formatNumber(data.pagesCrawled || 0);
  qs("#metricPagesCaption").textContent = state.project?.domain || shortUrl(data.origin || data.target || "Current session");
  qs("#metricCritical").textContent = counts.critical || 0;
  qs("#metricWarnings").textContent = counts.warning || 0;
  renderOpportunities(data.pages || []);
}

function renderOpportunities(pages) {
  const groups = new Map();
  for (const page of pages) for (const issue of page.issues || []) {
    const key = issue.code || issue.message;
    const entry = groups.get(key) || { ...issue, count: 0 };
    entry.count += 1;
    groups.set(key, entry);
  }
  const priority = { critical: 0, warning: 1, notice: 2 };
  const top = [...groups.values()].sort((a, b) => (priority[a.severity] ?? 9) - (priority[b.severity] ?? 9) || b.count - a.count).slice(0, 5);
  const root = qs("#opportunityFeed");
  if (!top.length) {
    root.className = "opportunity-feed empty-state compact";
    root.innerHTML = `<div class="empty-icon">✓</div><div><strong>No immediate issues from this crawl.</strong><p>Connect Search Console next to add ranking and traffic opportunities.</p></div>`;
    return;
  }
  root.className = "opportunity-feed";
  root.innerHTML = top.map((item) => `<div class="opportunity-item"><i class="opportunity-line ${escapeHtml(item.severity)}"></i><div><strong>${escapeHtml(item.message)}</strong><p>${item.count} affected page${item.count === 1 ? "" : "s"} in the latest crawl.</p></div><span>${escapeHtml(item.severity).toUpperCase()}</span></div>`).join("");
}

function toggleWorkspaceMenu() {
  closeFloatingMenus("workspace");
  const existing = qs("#workspaceMenu");
  if (existing) { existing.remove(); return; }
  const rect = qs(".workspace-card").getBoundingClientRect();
  const menu = document.createElement("div");
  menu.id = "workspaceMenu";
  menu.className = "workspace-menu";
  menu.style.left = `${Math.max(14, rect.left)}px`;
  menu.style.top = `${rect.bottom + 8}px`;
  menu.innerHTML = `${state.workspaces.map((workspace) => `<button class="workspace-option ${workspace.id === state.workspace?.id ? "active" : ""}" data-workspace-id="${workspace.id}"><span><strong>${escapeHtml(workspace.name)}</strong><span>${workspace.project_count || 0} websites · ${escapeHtml(workspace.plan || "free")}</span></span><em>${escapeHtml(workspace.role || "member")}</em></button>`).join("")}<div class="workspace-menu-sep"></div><button class="workspace-add" id="newWorkspaceButton">+ NEW WORKSPACE</button>`;
  document.body.appendChild(menu);
  qsa("[data-workspace-id]", menu).forEach((button) => button.addEventListener("click", () => selectWorkspace(button.dataset.workspaceId)));
  qs("#newWorkspaceButton", menu).addEventListener("click", () => openWorkspaceDialog(false));
}

function toggleAccountMenu(event) {
  event.stopPropagation();
  closeFloatingMenus("account");
  const existing = qs("#accountMenu");
  if (existing) { existing.remove(); return; }
  const rect = qs(".avatar-button").getBoundingClientRect();
  const menu = document.createElement("div");
  menu.id = "accountMenu";
  menu.className = "account-menu";
  menu.style.top = `${rect.bottom + 8}px`;
  menu.style.right = `${Math.max(14, window.innerWidth - rect.right)}px`;
  menu.innerHTML = `<strong>${escapeHtml(state.user?.displayName || "Account")}</strong><small>${escapeHtml(state.user?.email || "")}</small><button id="logoutButton">SIGN OUT</button>`;
  document.body.appendChild(menu);
  qs("#logoutButton", menu).addEventListener("click", logout);
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".workspace-card") && !event.target.closest("#workspaceMenu")) qs("#workspaceMenu")?.remove();
  if (!event.target.closest(".avatar-button") && !event.target.closest("#accountMenu")) qs("#accountMenu")?.remove();
});

function closeFloatingMenus(except) {
  if (except !== "workspace") qs("#workspaceMenu")?.remove();
  if (except !== "account") qs("#accountMenu")?.remove();
}

function openWorkspaceDialog(required = false) {
  closeFloatingMenus();
  const backdrop = document.createElement("div");
  backdrop.className = "dialog-backdrop";
  backdrop.innerHTML = `<form class="dialog-card" id="workspaceDialog"><h3>Create workspace</h3><p>Use a workspace for a business, brand, agency, or client group. Website data remains isolated inside it.</p><div class="auth-field"><label>Workspace name<input name="name" maxlength="90" placeholder="James Realty" required></label></div><div class="auth-error" id="workspaceDialogError"></div><div class="dialog-actions">${required ? "" : `<button type="button" class="dialog-cancel">CANCEL</button>`}<button type="submit" class="dialog-primary">CREATE</button></div></form>`;
  document.body.appendChild(backdrop);
  qs(".dialog-cancel", backdrop)?.addEventListener("click", () => backdrop.remove());
  qs("#workspaceDialog", backdrop).addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    try {
      const data = await api("/api/workspaces", { method: "POST", body: { name } });
      backdrop.remove();
      await loadWorkspaces();
      if (data.workspace?.id) await selectWorkspace(data.workspace.id);
    } catch (error) { qs("#workspaceDialogError").textContent = error.message; }
  });
}

function openProjectDialog() {
  if (!state.workspace) { openWorkspaceDialog(true); return; }
  const backdrop = document.createElement("div");
  backdrop.className = "dialog-backdrop";
  backdrop.innerHTML = `<form class="dialog-card" id="projectDialog"><h3>Add website</h3><p>Create one project per domain or subdomain. This supports your own websites, other businesses, and external customer sites.</p><div class="project-form"><label>Project name<input name="name" maxlength="90" placeholder="James Realty"></label><label>Domain<input name="domain" placeholder="jamesrealty.uk" required></label><div class="project-form-grid"><label>Country<input name="countryCode" maxlength="8" placeholder="AE"></label><label>Timezone<input name="timezone" maxlength="64" placeholder="Asia/Dubai"></label></div></div><div class="auth-error" id="projectDialogError"></div><div class="dialog-actions"><button type="button" class="dialog-cancel">CANCEL</button><button type="submit" class="dialog-primary">ADD WEBSITE</button></div></form>`;
  document.body.appendChild(backdrop);
  qs(".dialog-cancel", backdrop).addEventListener("click", () => backdrop.remove());
  qs("#projectDialog", backdrop).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("/api/projects", { method: "POST", body: { workspaceId: state.workspace.id, name: form.get("name"), domain: form.get("domain"), countryCode: form.get("countryCode"), timezone: form.get("timezone") } });
      backdrop.remove();
      await loadProjects();
      if (data.project?.id) await selectProject(data.project.id, false);
      renderProjects();
    } catch (error) { qs("#projectDialogError").textContent = error.message; }
  });
}

function showAuthGate(mode = "login") {
  removeGate();
  const gate = document.createElement("div");
  gate.id = "authGate";
  gate.className = "auth-gate";
  gate.innerHTML = `<div class="auth-card"><div class="auth-brand"><div class="auth-brand-mark">J</div><div><strong>JAMES SEO</strong><span>Multi-tenant SEO intelligence</span></div></div><h2>One platform. Every website.</h2><p>Use it for your own businesses or create isolated workspaces for clients and teams.</p><div class="auth-tabs"><button type="button" class="auth-tab ${mode === "login" ? "active" : ""}" data-auth-mode="login">Sign in</button><button type="button" class="auth-tab ${mode === "signup" ? "active" : ""}" data-auth-mode="signup">Create account</button></div><form class="auth-form" id="authForm"><div id="signupFields" ${mode === "signup" ? "" : "hidden"}><div class="auth-field"><label>Your name<input name="displayName" autocomplete="name" maxlength="90"></label></div><div class="auth-field" style="margin-top:12px"><label>Workspace name<input name="workspaceName" maxlength="90" placeholder="Company or agency"></label></div></div><div class="auth-field"><label>Email<input type="email" name="email" autocomplete="email" required></label></div><div class="auth-field"><label>Password<input type="password" name="password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}" minlength="10" required></label></div><div class="auth-error" id="authError"></div><button class="auth-submit" type="submit">${mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}</button></form><p class="auth-note">Private beta. Passwords are stored as salted PBKDF2 hashes and sessions use secure HttpOnly cookies.</p></div>`;
  document.body.appendChild(gate);
  let currentMode = mode;
  qsa("[data-auth-mode]", gate).forEach((button) => button.addEventListener("click", () => {
    currentMode = button.dataset.authMode;
    qsa("[data-auth-mode]", gate).forEach((item) => item.classList.toggle("active", item.dataset.authMode === currentMode));
    qs("#signupFields", gate).hidden = currentMode !== "signup";
    qs(".auth-submit", gate).textContent = currentMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN";
    qs("[name=password]", gate).autocomplete = currentMode === "signup" ? "new-password" : "current-password";
    qs("#authError", gate).textContent = "";
  }));
  qs("#authForm", gate).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submit = qs(".auth-submit", gate);
    submit.disabled = true;
    submit.textContent = currentMode === "signup" ? "CREATING..." : "SIGNING IN...";
    try {
      const data = await api(`/api/auth/${currentMode === "signup" ? "signup" : "login"}`, { method: "POST", body: { email: form.get("email"), password: form.get("password"), displayName: form.get("displayName"), workspaceName: form.get("workspaceName") }, allowUnauthenticated: true });
      await initializeAuthenticated(data.user);
    } catch (error) {
      qs("#authError", gate).textContent = error.message;
      submit.disabled = false;
      submit.textContent = currentMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN";
    }
  });
}

function showSystemGate(message) {
  removeGate();
  const gate = document.createElement("div");
  gate.id = "authGate";
  gate.className = "auth-gate";
  gate.innerHTML = `<div class="auth-card"><div class="auth-brand"><div class="auth-brand-mark">J</div><div><strong>JAMES SEO</strong><span>Platform setup</span></div></div><h2>Finishing the SaaS foundation.</h2><p>${escapeHtml(message)}</p><button class="auth-submit" id="retryBootstrap">RETRY</button></div>`;
  document.body.appendChild(gate);
  qs("#retryBootstrap").addEventListener("click", bootstrap);
}

function removeGate() { qs("#authGate")?.remove(); }

async function logout() {
  try { await api("/api/auth/logout", { method: "POST" }); } catch {}
  state.user = null; state.workspaces = []; state.workspace = null; state.projects = []; state.project = null; state.audit = null; state.audits = [];
  closeFloatingMenus();
  showAuthGate("login");
}

async function api(path, options = {}) {
  const init = { method: options.method || "GET", headers: {} };
  if (options.body !== undefined) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(path, init);
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    if (response.status === 401 && !options.allowUnauthenticated) showAuthGate("login");
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

function setAuditLoading(isLoading) {
  qs("#auditSubmit").disabled = isLoading;
  qs("#auditSubmit").innerHTML = isLoading ? "CRAWLING..." : "RUN LIVE AUDIT <span>→</span>";
  qs("#auditLoading").classList.toggle("hidden", !isLoading);
}
function showAuditError(message) { qs("#auditError").textContent = message; show(qs("#auditError")); }
function scoreLabel(score = 0) { if (score >= 90) return "Excellent technical baseline"; if (score >= 75) return "Healthy with improvements"; if (score >= 55) return "Needs focused work"; return "Critical issues detected"; }
function shortUrl(value) { try { const url = new URL(value); return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}${url.search}`; } catch { return value; } }
function formatDuration(ms) { if (ms < 1000) return `${Math.round(ms)} ms`; return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`; }
function formatNumber(value) { return new Intl.NumberFormat("en-US").format(value); }
function formatDate(value) { try { return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); } catch { return value || "-"; } }
function truncate(value, max) { return value.length > max ? `${value.slice(0, max - 1)}…` : value; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function show(el) { el?.classList.remove("hidden"); }
function hide(el) { el?.classList.add("hidden"); }
