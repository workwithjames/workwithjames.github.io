import { auditTarget, AuditInputError } from "./crawler.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "same-origin",
};
const SESSION_COOKIE = "jseo_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 120_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: env.APP_NAME || "James SEO", version: "0.2.0", database: Boolean(env.DB) });
    }

    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (!env.DB) return json({ error: "Database binding is not configured" }, 503);
    if (!sameOriginMutation(request)) return json({ error: "Cross-origin mutation blocked" }, 403);

    try {
      if (url.pathname === "/api/auth/me" && request.method === "GET") return handleMe(request, env);
      if (url.pathname === "/api/auth/signup" && request.method === "POST") return handleSignup(request, env);
      if (url.pathname === "/api/auth/login" && request.method === "POST") return handleLogin(request, env);
      if (url.pathname === "/api/auth/logout" && request.method === "POST") return handleLogout(request, env);

      const user = await requireUser(request, env);
      if (user instanceof Response) return user;

      if (url.pathname === "/api/workspaces" && request.method === "GET") return listWorkspaces(env, user);
      if (url.pathname === "/api/workspaces" && request.method === "POST") return createWorkspace(request, env, user);
      if (url.pathname === "/api/projects" && request.method === "GET") return listProjects(url, env, user);
      if (url.pathname === "/api/projects" && request.method === "POST") return createProject(request, env, user);
      if (url.pathname === "/api/audits" && request.method === "GET") return listAudits(url, env, user);
      if (url.pathname === "/api/audits" && request.method === "POST") return runProjectAudit(request, env, user);

      const auditMatch = url.pathname.match(/^\/api\/audits\/([^/]+)$/);
      if (auditMatch && request.method === "GET") return getAudit(env, user, auditMatch[1]);

      if (url.pathname === "/api/audit") return json({ error: "Audits now require a saved project. Use /api/audits." }, 410);
      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error("API error", error);
      return json({ error: safeMessage(error) }, 500);
    }
  },
};

async function handleMe(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ authenticated: false, user: null });
  return json({ authenticated: true, user: publicUser(user) });
}

async function handleSignup(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const displayName = cleanName(body.displayName || email.split("@")[0]);
  const workspaceName = cleanName(body.workspaceName || `${displayName}'s Workspace`);

  if (!validEmail(email)) return json({ error: "Enter a valid email address" }, 400);
  if (password.length < 10) return json({ error: "Password must be at least 10 characters" }, 400);
  if (!displayName || !workspaceName) return json({ error: "Name and workspace are required" }, 400);

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return json({ error: "An account with this email already exists" }, 409);

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const salt = randomToken(16);
  const passwordHash = await derivePassword(password, salt);
  const slug = `${slugify(workspaceName) || "workspace"}-${workspaceId.slice(0, 6)}`;

  await env.DB.batch([
    env.DB.prepare("INSERT INTO users (id,email,display_name,password_hash,password_salt) VALUES (?,?,?,?,?)").bind(userId, email, displayName, passwordHash, salt),
    env.DB.prepare("INSERT INTO workspaces (id,name,slug,plan) VALUES (?,?,?,'free')").bind(workspaceId, workspaceName, slug),
    env.DB.prepare("INSERT INTO workspace_members (workspace_id,user_id,role) VALUES (?,?,'owner')").bind(workspaceId, userId),
  ]);

  const user = { id: userId, email, display_name: displayName, is_super_admin: 0 };
  const session = await createSession(env, request, userId);
  return json({ authenticated: true, user: publicUser(user), workspaceId }, 201, { "set-cookie": session.cookie });
}

async function handleLogin(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!validEmail(email) || !password) return json({ error: "Email and password are required" }, 400);

  const user = await env.DB.prepare("SELECT id,email,display_name,password_hash,password_salt,is_super_admin FROM users WHERE email = ?").bind(email).first();
  if (!user?.password_hash || !user?.password_salt) return json({ error: "Invalid email or password" }, 401);
  const candidate = await derivePassword(password, user.password_salt);
  if (!timingSafeEqual(candidate, user.password_hash)) return json({ error: "Invalid email or password" }, 401);

  await env.DB.prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(user.id).run();
  const session = await createSession(env, request, user.id);
  return json({ authenticated: true, user: publicUser(user) }, 200, { "set-cookie": session.cookie });
}

async function handleLogout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256(token);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return json({ ok: true }, 200, { "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });
}

async function listWorkspaces(env, user) {
  const result = await env.DB.prepare(`
    SELECT w.id,w.name,w.slug,w.plan,w.created_at,w.updated_at,wm.role,
      (SELECT COUNT(*) FROM projects p WHERE p.workspace_id = w.id) AS project_count
    FROM workspaces w
    JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = ?
    ORDER BY w.updated_at DESC, w.created_at ASC
  `).bind(user.id).all();
  return json({ workspaces: result.results || [] });
}

async function createWorkspace(request, env, user) {
  const body = await readJson(request);
  const name = cleanName(body.name);
  if (!name) return json({ error: "Workspace name is required" }, 400);
  const id = crypto.randomUUID();
  const slug = `${slugify(name) || "workspace"}-${id.slice(0, 6)}`;
  await env.DB.batch([
    env.DB.prepare("INSERT INTO workspaces (id,name,slug,plan) VALUES (?,?,?,'free')").bind(id, name, slug),
    env.DB.prepare("INSERT INTO workspace_members (workspace_id,user_id,role) VALUES (?,?,'owner')").bind(id, user.id),
  ]);
  return json({ workspace: { id, name, slug, plan: "free", role: "owner", project_count: 0 } }, 201);
}

async function listProjects(url, env, user) {
  const workspaceId = url.searchParams.get("workspace_id") || "";
  if (!workspaceId) return json({ error: "workspace_id is required" }, 400);
  if (!await hasWorkspaceAccess(env, user.id, workspaceId)) return json({ error: "Workspace not found" }, 404);

  const result = await env.DB.prepare(`
    SELECT p.id,p.workspace_id,p.name,p.domain,p.protocol,p.country_code,p.timezone,p.created_at,p.updated_at,
      (SELECT score FROM audits a WHERE a.project_id = p.id AND a.status = 'complete' ORDER BY a.created_at DESC LIMIT 1) AS latest_score,
      (SELECT created_at FROM audits a WHERE a.project_id = p.id AND a.status = 'complete' ORDER BY a.created_at DESC LIMIT 1) AS last_audit_at
    FROM projects p WHERE p.workspace_id = ? ORDER BY p.updated_at DESC, p.created_at DESC
  `).bind(workspaceId).all();
  return json({ projects: result.results || [] });
}

async function createProject(request, env, user) {
  const body = await readJson(request);
  const workspaceId = String(body.workspaceId || "");
  const access = await workspaceRole(env, user.id, workspaceId);
  if (!access) return json({ error: "Workspace not found" }, 404);
  if (!["owner", "admin"].includes(access.role)) return json({ error: "You do not have permission to add projects" }, 403);

  const target = normalizeProjectDomain(body.domain);
  if (!target) return json({ error: "Enter a valid public website domain" }, 400);
  const name = cleanName(body.name || target.domain);
  const id = crypto.randomUUID();

  try {
    await env.DB.prepare(`
      INSERT INTO projects (id,workspace_id,name,domain,protocol,country_code,timezone)
      VALUES (?,?,?,?,?,?,?)
    `).bind(id, workspaceId, name, target.domain, target.protocol, cleanCode(body.countryCode), cleanText(body.timezone, 64)).run();
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) return json({ error: "That domain already exists in this workspace" }, 409);
    throw error;
  }

  return json({ project: { id, workspace_id: workspaceId, name, domain: target.domain, protocol: target.protocol, country_code: cleanCode(body.countryCode), timezone: cleanText(body.timezone, 64) } }, 201);
}

async function runProjectAudit(request, env, user) {
  const body = await readJson(request);
  const projectId = String(body.projectId || "");
  const project = await accessibleProject(env, user.id, projectId);
  if (!project) return json({ error: "Project not found" }, 404);

  const requestedPages = Math.max(1, Math.min(25, Number(body.maxPages || 15)));
  const target = `${project.protocol || "https"}://${project.domain}/`;
  const auditId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO audits (id,project_id,status,requested_by_user_id,target_url,started_at)
    VALUES (?,?,'running',?,?,CURRENT_TIMESTAMP)
  `).bind(auditId, project.id, user.id, target).run();

  try {
    const result = await auditTarget(target, requestedPages);
    const statements = result.pages.map((page) => env.DB.prepare(`
      INSERT INTO audit_pages (id,audit_id,url,status_code,score,title,meta_description,h1,canonical,word_count,response_ms,issue_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      crypto.randomUUID(), auditId, page.url, page.status, page.score, page.title || "", page.metaDescription || "",
      page.h1 || "", page.canonical || "", page.wordCount || 0, page.responseMs || 0, JSON.stringify(page.issues || [])
    ));
    if (statements.length) await env.DB.batch(statements);

    await env.DB.batch([
      env.DB.prepare(`
        UPDATE audits SET status='complete',score=?,pages_crawled=?,critical_issues=?,warning_issues=?,notice_issues=?,
          duration_ms=?,queued_remaining=?,robots_json=?,status_counts_json=?,completed_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(result.score, result.pagesCrawled, result.issueCounts.critical || 0, result.issueCounts.warning || 0, result.issueCounts.notice || 0,
        result.durationMs, result.queuedRemaining || 0, JSON.stringify(result.robots || {}), JSON.stringify(result.statusCounts || {}), auditId),
      env.DB.prepare("UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(project.id),
      env.DB.prepare(`INSERT INTO usage_events (id,workspace_id,event_type,units,provider,metadata_json) VALUES (?,?, 'site_audit_pages',?, 'internal',?)`)
        .bind(crypto.randomUUID(), project.workspace_id, result.pagesCrawled, JSON.stringify({ auditId, projectId: project.id })),
    ]);

    return json({ ...result, auditId, projectId: project.id, projectName: project.name }, 201);
  } catch (error) {
    await env.DB.prepare("UPDATE audits SET status='failed',completed_at=CURRENT_TIMESTAMP WHERE id=?").bind(auditId).run();
    if (error instanceof AuditInputError) return json({ error: error.message }, 400);
    throw error;
  }
}

async function listAudits(url, env, user) {
  const projectId = url.searchParams.get("project_id") || "";
  const project = await accessibleProject(env, user.id, projectId);
  if (!project) return json({ error: "Project not found" }, 404);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 12)));
  const result = await env.DB.prepare(`
    SELECT id,project_id,status,score,pages_crawled,critical_issues,warning_issues,notice_issues,target_url,duration_ms,created_at,completed_at
    FROM audits WHERE project_id=? ORDER BY created_at DESC LIMIT ?
  `).bind(projectId, limit).all();
  return json({ audits: result.results || [], project: { id: project.id, name: project.name, domain: project.domain } });
}

async function getAudit(env, user, auditId) {
  const audit = await env.DB.prepare(`
    SELECT a.*,p.name AS project_name,p.domain AS project_domain,p.workspace_id
    FROM audits a
    JOIN projects p ON p.id=a.project_id
    JOIN workspace_members wm ON wm.workspace_id=p.workspace_id
    WHERE a.id=? AND wm.user_id=?
  `).bind(auditId, user.id).first();
  if (!audit) return json({ error: "Audit not found" }, 404);

  const pageResult = await env.DB.prepare(`
    SELECT url,status_code,score,title,meta_description,h1,canonical,word_count,response_ms,issue_json
    FROM audit_pages WHERE audit_id=? ORDER BY rowid ASC
  `).bind(auditId).all();
  const pages = (pageResult.results || []).map((page) => ({
    url: page.url, status: page.status_code, score: page.score, title: page.title || "", metaDescription: page.meta_description || "",
    h1: page.h1 || "", canonical: page.canonical || "", wordCount: page.word_count || 0, responseMs: page.response_ms || 0,
    links: { internal: 0, external: 0 }, images: { total: 0, missingAlt: 0 }, issues: parseJson(page.issue_json, []),
  }));

  return json({
    auditId: audit.id, projectId: audit.project_id, projectName: audit.project_name,
    target: audit.target_url, origin: originOf(audit.target_url), auditedAt: audit.completed_at || audit.created_at,
    durationMs: audit.duration_ms || 0, pagesCrawled: audit.pages_crawled || pages.length, queuedRemaining: audit.queued_remaining || 0,
    score: audit.score || 0,
    issueCounts: { critical: audit.critical_issues || 0, warning: audit.warning_issues || 0, notice: audit.notice_issues || 0 },
    robots: parseJson(audit.robots_json, {}), statusCounts: parseJson(audit.status_counts_json, {}), pages,
  });
}

async function requireUser(request, env) {
  const user = await getSessionUser(request, env);
  return user || json({ error: "Authentication required" }, 401);
}

async function getSessionUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const user = await env.DB.prepare(`
    SELECT u.id,u.email,u.display_name,u.is_super_admin,s.id AS session_id,s.expires_at
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND datetime(s.expires_at) > datetime('now')
  `).bind(tokenHash).first();
  if (!user) return null;
  return user;
}

async function createSession(env, request, userId) {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 300);
  const ip = request.headers.get("cf-connecting-ip") || "";
  const ipHint = ip ? await sha256(ip) : "";
  await env.DB.prepare(`INSERT INTO sessions (id,user_id,token_hash,expires_at,user_agent,ip_hint) VALUES (?,?,?,?,?,?)`)
    .bind(id, userId, tokenHash, expires, userAgent, ipHint).run();
  const cookie = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
  return { cookie };
}

async function hasWorkspaceAccess(env, userId, workspaceId) {
  return Boolean(await workspaceRole(env, userId, workspaceId));
}

async function workspaceRole(env, userId, workspaceId) {
  if (!workspaceId) return null;
  return env.DB.prepare("SELECT role FROM workspace_members WHERE workspace_id=? AND user_id=?").bind(workspaceId, userId).first();
}

async function accessibleProject(env, userId, projectId) {
  if (!projectId) return null;
  return env.DB.prepare(`
    SELECT p.* FROM projects p
    JOIN workspace_members wm ON wm.workspace_id=p.workspace_id
    WHERE p.id=? AND wm.user_id=?
  `).bind(projectId, userId).first();
}

async function derivePassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromBase64Url(salt), iterations: PBKDF2_ITERATIONS }, key, 256);
  return toBase64Url(new Uint8Array(bits));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(digest));
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function randomToken(bytes) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return toBase64Url(data);
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const pair = cookie.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return pair ? pair.slice(name.length + 1) : "";
}

function sameOriginMutation(request) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function readJson(request) {
  try { return await request.json(); }
  catch { throw new Error("Invalid JSON body"); }
}

function normalizeEmail(value) { return String(value || "").trim().toLowerCase().slice(0, 254); }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function cleanName(value) { return cleanText(value, 90); }
function cleanCode(value) { return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8) || null; }
function cleanText(value, max = 200) { return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function slugify(value) { return String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48); }

function normalizeProjectDomain(value) {
  let raw = String(value || "").trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const domain = url.hostname.toLowerCase();
    if (!domain || domain === "localhost" || domain.endsWith(".local") || domain.endsWith(".internal")) return null;
    if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(domain)) return null;
    const private172 = domain.match(/^172\.(\d{1,3})\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return null;
    return { domain, protocol: url.protocol.replace(":", "") };
  } catch { return null; }
}

function publicUser(user) {
  return { id: user.id, email: user.email, displayName: user.display_name || "", isSuperAdmin: Boolean(user.is_super_admin) };
}

function parseJson(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function originOf(value) { try { return new URL(value).origin; } catch { return value || ""; } }
function safeMessage(error) { return (error instanceof Error ? error.message : String(error || "Unexpected error")).slice(0, 240); }

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}
