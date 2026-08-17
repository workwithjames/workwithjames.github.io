/**
 * Cloudflare Worker for James Realty campaign subdomains.
 *
 * Each canonical hostname serves a versioned, noindex fallback file from the
 * GitHub Pages origin. Only the canonical host becomes indexable. This keeps
 * one maintainable source file while preventing /landing/* fallback URLs from
 * competing with the campaign subdomains in search results.
 */

const ORIGIN = 'https://jamesrealty.uk';
const HOSTS = {
  'emaar.jamesrealty.uk': '/landing/emaar/',
  'aldar.jamesrealty.uk': '/landing/aldar/',
  'damac.jamesrealty.uk': '/landing/damac/',
  'binghatti.jamesrealty.uk': '/landing/binghatti/',
  'nakheel.jamesrealty.uk': '/landing/nakheel/',
  'mudon.jamesrealty.uk': '/landing/mudon/',
  'dubai.jamesrealty.uk': '/landing/uk/',
  'dubairealestate.jamesrealty.uk': '/landing/usa/',
  'dubaiproperties.jamesrealty.uk': '/landing/india/',
  'dubaiproperty.jamesrealty.uk': '/landing/ar/',
};

const LAST_MODIFIED = '2026-08-17';

const SECURITY_HEADERS = {
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function plain(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS, ...extra },
  });
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...SECURITY_HEADERS,
      ...extra,
    },
  });
}

async function readLimitedJson(request, maxBytes = 16_384) {
  if (!request.body) throw new Error('EMPTY_BODY');
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel('Payload too large');
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

async function captureLead(request, env, hostname) {
  if (!env.LEADS) return json({ ok: false, error: 'Lead storage is not configured' }, 503);
  let payload;
  try {
    payload = await readLimitedJson(request);
  } catch (error) {
    const status = error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
    return json({ ok: false, error: status === 413 ? 'Payload too large' : 'Invalid JSON payload' }, status);
  }

  if (clean(payload.honeypot, 200)) return json({ ok: true, lead_id: 'accepted' }, 202);
  const lead = {
    id: clean(payload.submission_id, 100) || crypto.randomUUID(),
    name: clean(payload.name, 100),
    phone: clean(payload.phone, 32),
    budget: clean(payload.budget, 80),
    email: clean(payload.email, 160),
    country: clean(payload.country, 80),
    preference: clean(payload.preference, 120),
    notes: clean(payload.notes, 600),
    interest: clean(payload.interest, 160),
    landingPage: clean(payload.landing_page, 180),
    referrer: clean(payload.referrer, 500),
    utmSource: clean(payload.utm_source, 100),
    utmMedium: clean(payload.utm_medium, 100),
    utmCampaign: clean(payload.utm_campaign, 160),
  };
  if (lead.name.length < 2 || lead.phone.length < 7 || !lead.budget || payload.consent !== true) {
    return json({ ok: false, error: 'Required lead fields are incomplete' }, 422);
  }

  const createdAt = new Date().toISOString();
  const countryCode = clean(request.cf?.country, 8);
  const userAgent = clean(request.headers.get('user-agent'), 300);
  try {
    await env.LEADS.batch([
      env.LEADS.prepare(`CREATE TABLE IF NOT EXISTS leads (
        submission_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        source_host TEXT NOT NULL,
        landing_page TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        budget TEXT NOT NULL,
        email TEXT,
        country TEXT,
        preference TEXT,
        notes TEXT,
        interest TEXT,
        referrer TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        country_code TEXT,
        user_agent TEXT,
        status TEXT NOT NULL DEFAULT 'new'
      )`),
      env.LEADS.prepare('CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)'),
      env.LEADS.prepare(`INSERT OR IGNORE INTO leads (
        submission_id, created_at, source_host, landing_page, name, phone, budget,
        email, country, preference, notes, interest, referrer, utm_source, utm_medium,
        utm_campaign, country_code, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          lead.id, createdAt, hostname, lead.landingPage, lead.name, lead.phone, lead.budget,
          lead.email, lead.country, lead.preference, lead.notes, lead.interest, lead.referrer,
          lead.utmSource, lead.utmMedium, lead.utmCampaign, countryCode, userAgent,
        ),
    ]);
    console.log(JSON.stringify({ event: 'lead_captured', submission_id: lead.id, source_host: hostname, created_at: createdAt }));
    return json({ ok: true, lead_id: lead.id }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: 'lead_capture_failed', source_host: hostname, error: String(error) }));
    return json({ ok: false, error: 'Lead storage is temporarily unavailable' }, 503, { 'retry-after': '15' });
  }
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const sourcePath = HOSTS[incoming.hostname];
    if (!sourcePath) return plain('Unknown James Realty landing-page host', 404);

    if (incoming.pathname === '/api/lead') {
      if (request.method === 'POST') return captureLead(request, env, incoming.hostname);
      return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
    }

    if (!['GET', 'HEAD'].includes(request.method)) return plain('Method not allowed', 405, { Allow: 'GET, HEAD' });

    if (incoming.pathname === '/robots.txt') {
      return plain(`User-agent: *\nAllow: /\nSitemap: https://${incoming.hostname}/sitemap.xml\n`);
    }

    if (incoming.pathname === '/sitemap.xml') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${incoming.hostname}/</loc><lastmod>${LAST_MODIFIED}</lastmod><changefreq>weekly</changefreq></url></urlset>\n`;
      return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', ...SECURITY_HEADERS } });
    }

    if (incoming.pathname !== '/') {
      return Response.redirect(`https://${incoming.hostname}/`, 301);
    }

    const upstream = await fetch(`${ORIGIN}${sourcePath}`, {
      cf: { cacheEverything: true, cacheTtl: 300 },
      headers: { 'user-agent': request.headers.get('user-agent') || 'James-Realty-Landing-Worker' },
    });
    if (!upstream.ok) return plain('Landing page temporarily unavailable', 502);

    const headers = new Headers(upstream.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400');
    headers.set('x-robots-tag', 'index, follow');
    headers.set('link', `<https://${incoming.hostname}/>; rel="canonical"`);
    headers.set('content-language', incoming.hostname === 'dubaiproperty.jamesrealty.uk' ? 'ar-AE' : 'en');
    Object.entries(SECURITY_HEADERS).forEach(([name, value]) => headers.set(name, value));
    headers.delete('content-security-policy');
    headers.delete('content-length');
    const response = new Response(request.method === 'HEAD' ? null : upstream.body, { status: 200, headers });
    if (request.method === 'HEAD') return response;
    return new HTMLRewriter()
      .on('meta[name="robots"]', {
        element(element) {
          element.setAttribute('content', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
        },
      })
      .transform(response);
  },
};
