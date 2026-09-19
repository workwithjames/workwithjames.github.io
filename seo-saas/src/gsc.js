const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API = "https://www.googleapis.com/webmasters/v3";
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function gscConfigured(env) {
  return Boolean(env.GSC_CLIENT_ID && env.GSC_CLIENT_SECRET && env.GSC_TOKEN_ENCRYPTION_KEY);
}

export async function handleGscRequest(request, env, user) {
  const url = new URL(request.url);

  if (url.pathname === "/api/gsc/status" && request.method === "GET") return getStatus(url, env, user);
  if (url.pathname === "/api/gsc/connect" && request.method === "GET") return startConnect(url, request, env, user);
  if (url.pathname === "/api/gsc/callback" && request.method === "GET") return oauthCallback(url, request, env, user);
  if (url.pathname === "/api/gsc/properties" && request.method === "GET") return listProperties(url, env, user);
  if (url.pathname === "/api/gsc/property" && request.method === "POST") return selectProperty(request, env, user);
  if (url.pathname === "/api/gsc/sync" && request.method === "POST") return syncProject(request, env, user);
  if (url.pathname === "/api/gsc/data" && request.method === "GET") return getData(url, env, user);
  if (url.pathname === "/api/gsc/disconnect" && request.method === "POST") return disconnect(request, env, user);

  return json({ error: "Search Console endpoint not found" }, 404);
}

async function getStatus(url, env, user) {
  const project = await requireProject(url.searchParams.get("project_id"), env, user);
  if (project instanceof Response) return project;

  const connection = await env.DB.prepare(`
    SELECT selected_property,permission_level,connected_at,updated_at,last_sync_at,last_error
    FROM gsc_connections WHERE project_id=?
  `).bind(project.id).first();
  const latest = await env.DB.prepare(`
    SELECT id,start_date,end_date,clicks,impressions,ctr,position,query_count,page_count,created_at
    FROM gsc_syncs WHERE project_id=? ORDER BY created_at DESC LIMIT 1
  `).bind(project.id).first();

  return json({
    configured: gscConfigured(env),
    connected: Boolean(connection),
    project: publicProject(project),
    connection: connection ? {
      selectedProperty: connection.selected_property || null,
      permissionLevel: connection.permission_level || null,
      connectedAt: connection.connected_at,
      updatedAt: connection.updated_at,
      lastSyncAt: connection.last_sync_at,
      lastError: connection.last_error || null,
    } : null,
    latestSync: latest ? normalizeSync(latest) : null,
  });
}

async function startConnect(url, request, env, user) {
  if (!gscConfigured(env)) return json({ error: "Google Search Console OAuth is not configured yet" }, 503);
  const project = await requireProject(url.searchParams.get("project_id"), env, user);
  if (project instanceof Response) return project;

  await env.DB.prepare("DELETE FROM gsc_oauth_states WHERE datetime(expires_at) <= datetime('now')").run();
  const state = randomToken(32);
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  await env.DB.prepare("INSERT INTO gsc_oauth_states (state,user_id,project_id,expires_at) VALUES (?,?,?,?)")
    .bind(state, user.id, project.id, expiresAt).run();

  const redirectUri = `${new URL(request.url).origin}/api/gsc/callback`;
  const auth = new URL(GOOGLE_AUTH_URL);
  auth.searchParams.set("client_id", env.GSC_CLIENT_ID);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", GSC_SCOPE);
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("include_granted_scopes", "true");
  auth.searchParams.set("state", state);

  return json({ authUrl: auth.toString(), redirectUri, project: publicProject(project) });
}

async function oauthCallback(url, request, env, user) {
  if (!gscConfigured(env)) return redirectResult(request, "error", "Google OAuth is not configured");
  const error = url.searchParams.get("error");
  if (error) return redirectResult(request, "error", error);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !state) return redirectResult(request, "error", "Missing OAuth code or state");

  const oauthState = await env.DB.prepare(`
    SELECT state,user_id,project_id,expires_at FROM gsc_oauth_states
    WHERE state=? AND datetime(expires_at) > datetime('now')
  `).bind(state).first();
  if (!oauthState || oauthState.user_id !== user.id) return redirectResult(request, "error", "OAuth session expired or invalid");
  const project = await requireProject(oauthState.project_id, env, user);
  if (project instanceof Response) return redirectResult(request, "error", "Project access changed");

  const redirectUri = `${new URL(request.url).origin}/api/gsc/callback`;
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GSC_CLIENT_ID,
      client_secret: env.GSC_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await safeJson(tokenResponse);
  if (!tokenResponse.ok || !tokenData.access_token) {
    await env.DB.prepare("DELETE FROM gsc_oauth_states WHERE state=?").bind(state).run();
    return redirectResult(request, "error", tokenData.error_description || tokenData.error || "Google token exchange failed");
  }

  const accessEncrypted = await encryptSecret(tokenData.access_token, env.GSC_TOKEN_ENCRYPTION_KEY);
  const refreshEncrypted = tokenData.refresh_token ? await encryptSecret(tokenData.refresh_token, env.GSC_TOKEN_ENCRYPTION_KEY) : null;
  const expiresAt = tokenData.expires_in ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString() : null;
  const connectionId = crypto.randomUUID();

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO gsc_connections (id,project_id,connected_by_user_id,access_token_encrypted,refresh_token_encrypted,token_expires_at,scope)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(project_id) DO UPDATE SET
        connected_by_user_id=excluded.connected_by_user_id,
        access_token_encrypted=excluded.access_token_encrypted,
        refresh_token_encrypted=COALESCE(excluded.refresh_token_encrypted,gsc_connections.refresh_token_encrypted),
        token_expires_at=excluded.token_expires_at,
        scope=excluded.scope,
        updated_at=CURRENT_TIMESTAMP,
        last_error=NULL
    `).bind(connectionId, project.id, user.id, accessEncrypted, refreshEncrypted, expiresAt, tokenData.scope || GSC_SCOPE),
    env.DB.prepare("DELETE FROM gsc_oauth_states WHERE state=?").bind(state),
  ]);

  return redirectResult(request, "connected", "Search Console connected");
}

async function listProperties(url, env, user) {
  const project = await requireProject(url.searchParams.get("project_id"), env, user);
  if (project instanceof Response) return project;
  const connection = await requireConnection(project.id, env);
  if (connection instanceof Response) return connection;

  try {
    const token = await getAccessToken(env, connection);
    const response = await fetch(`${GSC_API}/sites`, { headers: { authorization: `Bearer ${token}` } });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(googleError(data, response.status));
    const properties = (data.siteEntry || []).map((entry) => ({
      siteUrl: entry.siteUrl,
      permissionLevel: entry.permissionLevel || "unknown",
      suggested: propertyMatchesProject(entry.siteUrl, project),
    })).sort((a, b) => Number(b.suggested) - Number(a.suggested) || a.siteUrl.localeCompare(b.siteUrl));
    await clearConnectionError(env, project.id);
    return json({ properties, selectedProperty: connection.selected_property || null });
  } catch (error) {
    await setConnectionError(env, project.id, error);
    return json({ error: safeMessage(error) }, 502);
  }
}

async function selectProperty(request, env, user) {
  const body = await readJson(request);
  const project = await requireProject(body.projectId, env, user);
  if (project instanceof Response) return project;
  const connection = await requireConnection(project.id, env);
  if (connection instanceof Response) return connection;
  const propertyUrl = String(body.propertyUrl || "");
  if (!propertyUrl) return json({ error: "Select a Search Console property" }, 400);

  try {
    const token = await getAccessToken(env, connection);
    const response = await fetch(`${GSC_API}/sites`, { headers: { authorization: `Bearer ${token}` } });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(googleError(data, response.status));
    const property = (data.siteEntry || []).find((entry) => entry.siteUrl === propertyUrl);
    if (!property) return json({ error: "That Search Console property is not available to the connected Google account" }, 400);
    await env.DB.prepare(`
      UPDATE gsc_connections SET selected_property=?,permission_level=?,updated_at=CURRENT_TIMESTAMP,last_error=NULL WHERE project_id=?
    `).bind(property.siteUrl, property.permissionLevel || null, project.id).run();
    return json({ selectedProperty: property.siteUrl, permissionLevel: property.permissionLevel || null });
  } catch (error) {
    await setConnectionError(env, project.id, error);
    return json({ error: safeMessage(error) }, 502);
  }
}

async function syncProject(request, env, user) {
  const body = await readJson(request);
  const project = await requireProject(body.projectId, env, user);
  if (project instanceof Response) return project;
  const connection = await requireConnection(project.id, env);
  if (connection instanceof Response) return connection;
  if (!connection.selected_property) return json({ error: "Select a Search Console property before syncing" }, 400);

  const days = Math.max(7, Math.min(90, Number(body.days || 28)));
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const startDate = isoDate(start);
  const endDate = isoDate(end);

  try {
    const token = await getAccessToken(env, connection);
    const sitePath = encodeURIComponent(connection.selected_property);
    const [totalData, queryData, pageData, dailyData] = await Promise.all([
      searchAnalytics(token, sitePath, { startDate, endDate, rowLimit: 1 }),
      searchAnalytics(token, sitePath, { startDate, endDate, dimensions: ["query"], rowLimit: 500 }),
      searchAnalytics(token, sitePath, { startDate, endDate, dimensions: ["page"], rowLimit: 250 }),
      searchAnalytics(token, sitePath, { startDate, endDate, dimensions: ["date"], rowLimit: 100 }),
    ]);

    const total = (totalData.rows || [])[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const queries = normalizeRows(queryData.rows, "query");
    const pages = normalizeRows(pageData.rows, "page");
    const daily = normalizeRows(dailyData.rows, "date");
    const syncId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO gsc_syncs (id,project_id,property_url,start_date,end_date,clicks,impressions,ctr,position,query_count,page_count)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).bind(syncId, project.id, connection.selected_property, startDate, endDate, number(total.clicks), number(total.impressions), number(total.ctr), number(total.position), queries.length, pages.length).run();

    const statements = [
      ...queries.map((row) => env.DB.prepare(`INSERT INTO gsc_query_rows (id,sync_id,query,clicks,impressions,ctr,position) VALUES (?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(), syncId, row.key, row.clicks, row.impressions, row.ctr, row.position)),
      ...pages.map((row) => env.DB.prepare(`INSERT INTO gsc_page_rows (id,sync_id,page,clicks,impressions,ctr,position) VALUES (?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(), syncId, row.key, row.clicks, row.impressions, row.ctr, row.position)),
      ...daily.map((row) => env.DB.prepare(`INSERT INTO gsc_daily_rows (id,sync_id,date,clicks,impressions,ctr,position) VALUES (?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(), syncId, row.key, row.clicks, row.impressions, row.ctr, row.position)),
    ];
    await runBatches(env.DB, statements, 50);
    await env.DB.prepare("UPDATE gsc_connections SET last_sync_at=CURRENT_TIMESTAMP,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE project_id=?").bind(project.id).run();
    await env.DB.prepare(`INSERT INTO usage_events (id,workspace_id,event_type,units,provider,metadata_json) VALUES (?,?,'gsc_sync',1,'google',?)`)
      .bind(crypto.randomUUID(), project.workspace_id, JSON.stringify({ projectId: project.id, property: connection.selected_property, startDate, endDate })).run();

    return getProjectData(env, project.id);
  } catch (error) {
    await setConnectionError(env, project.id, error);
    return json({ error: safeMessage(error) }, 502);
  }
}

async function getData(url, env, user) {
  const project = await requireProject(url.searchParams.get("project_id"), env, user);
  if (project instanceof Response) return project;
  const data = await getProjectData(env, project.id);
  return json({ ...data, project: publicProject(project) });
}

async function disconnect(request, env, user) {
  const body = await readJson(request);
  const project = await requireProject(body.projectId, env, user);
  if (project instanceof Response) return project;
  await env.DB.prepare("DELETE FROM gsc_connections WHERE project_id=?").bind(project.id).run();
  return json({ ok: true });
}

async function getProjectData(env, projectId) {
  const sync = await env.DB.prepare(`
    SELECT id,property_url,start_date,end_date,clicks,impressions,ctr,position,query_count,page_count,created_at
    FROM gsc_syncs WHERE project_id=? ORDER BY created_at DESC LIMIT 1
  `).bind(projectId).first();
  if (!sync) return { sync: null, queries: [], pages: [], daily: [] };

  const [queriesResult, pagesResult, dailyResult] = await Promise.all([
    env.DB.prepare("SELECT query,clicks,impressions,ctr,position FROM gsc_query_rows WHERE sync_id=? ORDER BY clicks DESC,impressions DESC LIMIT 500").bind(sync.id).all(),
    env.DB.prepare("SELECT page,clicks,impressions,ctr,position FROM gsc_page_rows WHERE sync_id=? ORDER BY clicks DESC,impressions DESC LIMIT 250").bind(sync.id).all(),
    env.DB.prepare("SELECT date,clicks,impressions,ctr,position FROM gsc_daily_rows WHERE sync_id=? ORDER BY date ASC").bind(sync.id).all(),
  ]);
  return { sync: normalizeSync(sync), queries: queriesResult.results || [], pages: pagesResult.results || [], daily: dailyResult.results || [] };
}

async function searchAnalytics(token, sitePath, body) {
  const response = await fetch(`${GSC_API}/sites/${sitePath}/searchAnalytics/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await safeJson(response);
  if (!response.ok) throw new Error(googleError(data, response.status));
  return data;
}

async function getAccessToken(env, connection) {
  const expiresAt = connection.token_expires_at ? Date.parse(connection.token_expires_at) : 0;
  if (connection.access_token_encrypted && (!expiresAt || expiresAt > Date.now() + 60_000)) {
    return decryptSecret(connection.access_token_encrypted, env.GSC_TOKEN_ENCRYPTION_KEY);
  }
  if (!connection.refresh_token_encrypted) throw new Error("Google authorization expired. Reconnect Search Console.");
  const refreshToken = await decryptSecret(connection.refresh_token_encrypted, env.GSC_TOKEN_ENCRYPTION_KEY);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GSC_CLIENT_ID,
      client_secret: env.GSC_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await safeJson(response);
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || "Could not refresh Google authorization");
  const encrypted = await encryptSecret(data.access_token, env.GSC_TOKEN_ENCRYPTION_KEY);
  const nextExpiry = data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null;
  await env.DB.prepare("UPDATE gsc_connections SET access_token_encrypted=?,token_expires_at=?,updated_at=CURRENT_TIMESTAMP WHERE project_id=?")
    .bind(encrypted, nextExpiry, connection.project_id).run();
  return data.access_token;
}

async function requireConnection(projectId, env) {
  const connection = await env.DB.prepare("SELECT * FROM gsc_connections WHERE project_id=?").bind(projectId).first();
  if (!connection) return json({ error: "Search Console is not connected for this project" }, 404);
  if (!gscConfigured(env)) return json({ error: "Google Search Console OAuth is not configured on the platform" }, 503);
  return connection;
}

async function requireProject(projectId, env, user) {
  if (!projectId) return json({ error: "project_id is required" }, 400);
  const project = await env.DB.prepare(`
    SELECT p.* FROM projects p JOIN workspace_members wm ON wm.workspace_id=p.workspace_id
    WHERE p.id=? AND wm.user_id=?
  `).bind(String(projectId), user.id).first();
  return project || json({ error: "Project not found" }, 404);
}

async function setConnectionError(env, projectId, error) {
  await env.DB.prepare("UPDATE gsc_connections SET last_error=?,updated_at=CURRENT_TIMESTAMP WHERE project_id=?")
    .bind(safeMessage(error), projectId).run();
}
async function clearConnectionError(env, projectId) {
  await env.DB.prepare("UPDATE gsc_connections SET last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE project_id=?").bind(projectId).run();
}

function propertyMatchesProject(siteUrl, project) {
  const domainProperty = `sc-domain:${project.domain}`;
  if (siteUrl === domainProperty) return true;
  try { return new URL(siteUrl).hostname.toLowerCase() === project.domain.toLowerCase(); } catch { return false; }
}

function normalizeRows(rows, dimension) {
  return (rows || []).map((row) => ({
    key: String((row.keys || [""])[0] || ""),
    dimension,
    clicks: number(row.clicks),
    impressions: number(row.impressions),
    ctr: number(row.ctr),
    position: number(row.position),
  })).filter((row) => row.key);
}

function normalizeSync(sync) {
  return {
    id: sync.id,
    propertyUrl: sync.property_url,
    startDate: sync.start_date,
    endDate: sync.end_date,
    clicks: number(sync.clicks),
    impressions: number(sync.impressions),
    ctr: number(sync.ctr),
    position: number(sync.position),
    queryCount: Number(sync.query_count || 0),
    pageCount: Number(sync.page_count || 0),
    createdAt: sync.created_at,
  };
}

async function runBatches(db, statements, size) {
  for (let i = 0; i < statements.length; i += size) await db.batch(statements.slice(i, i + size));
}

async function encryptSecret(value, passphrase) {
  const key = await encryptionKey(passphrase, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

async function decryptSecret(value, passphrase) {
  const [ivPart, cipherPart] = String(value || "").split(".");
  if (!ivPart || !cipherPart) throw new Error("Stored Google authorization is invalid");
  const key = await encryptionKey(passphrase, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(ivPart) }, key, fromBase64Url(cipherPart));
  return new TextDecoder().decode(plaintext);
}

async function encryptionKey(passphrase, usages) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(passphrase || "")));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, usages);
}

function redirectResult(request, status, message) {
  const target = new URL("/", request.url);
  target.searchParams.set("gsc", status);
  if (message) target.searchParams.set("message", String(message).slice(0, 180));
  target.hash = "keywords";
  return Response.redirect(target.toString(), 302);
}

function publicProject(project) {
  return { id: project.id, name: project.name, domain: project.domain, workspaceId: project.workspace_id };
}
function isoDate(date) { return date.toISOString().slice(0, 10); }
function number(value) { const n = Number(value || 0); return Number.isFinite(n) ? n : 0; }
function safeMessage(error) { return (error instanceof Error ? error.message : String(error || "Unexpected error")).slice(0, 240); }
function googleError(data, status) { return data?.error?.message || data?.error_description || data?.error || `Google API request failed (${status})`; }
async function safeJson(response) { try { return await response.json(); } catch { return {}; } }
async function readJson(request) { try { return await request.json(); } catch { return {}; } }
function json(payload, status = 200) { return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS }); }

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
