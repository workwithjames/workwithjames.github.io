/**
 * Cloudflare Worker for James Realty campaign subdomains.
 * Digital edge deployment refresh: 2026-08-30.
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

const LAST_MODIFIED = '2026-08-18';
const WHATSAPP = 'https://wa.me/971528420933';

const IMAGE_UPGRADES = {
  'https://jamesrealty.uk/images/investors/uk-dubai-hills-apartment.webp': {
    src: 'https://jamesrealty.uk/images/projects/emaar-golf-community-apartments.webp',
    width: '724', height: '543', alt: 'Representative Emaar golf-community residences for Golf Vale comparison',
  },
  'https://jamesrealty.uk/images/investors/uk-downtown-dubai-apartment.webp': {
    src: 'https://jamesrealty.uk/images/landing/emaar-dubai-waterfront-investment.webp',
    width: '1600', height: '900', alt: 'Representative Emaar waterfront residences for Creek Bay comparison',
  },
  'https://jamesrealty.uk/images/investors/usa-dubai-marina-apartment.webp': {
    src: 'https://jamesrealty.uk/images/landing/emaar-dubai-waterfront-investment.webp',
    width: '1600', height: '900', alt: 'Representative Emaar waterfront residences for Creek Bay comparison',
  },
  'https://jamesrealty.uk/images/investors/usa-dubai-townhouse.webp': {
    src: 'https://jamesrealty.uk/images/landing/damac-branded-waterfront-residences.webp',
    width: '1600', height: '900', alt: 'Representative branded waterfront residences for Chelsea Residences comparison',
  },
  'https://jamesrealty.uk/images/investors/india-dubai-creek-apartment.webp': {
    src: 'https://jamesrealty.uk/images/projects/binghatti-crystalline-apartments.webp',
    width: '724', height: '543', alt: 'Representative geometric Binghatti-style Dubai apartments for Skyflame comparison',
  },
  'https://jamesrealty.uk/images/investors/india-waterfront-offplan.webp': {
    src: 'https://jamesrealty.uk/images/projects/emaar-golf-community-apartments.webp',
    width: '724', height: '543', alt: 'Representative Emaar golf-community residences for Golf Fields comparison',
  },
  'https://jamesrealty.uk/images/investors/arabic-dubai-villa-courtyard.webp': {
    src: 'https://jamesrealty.uk/images/landing/nakheel-dubai-island-waterfront.webp',
    width: '1600', height: '900', alt: 'مساكن على واجهة بحرية في دبي تمثل مقارنة مشروع بالم سنترال في نخلة جبل علي',
  },
  'https://jamesrealty.uk/images/investors/arabic-downtown-apartment.webp': {
    src: 'https://jamesrealty.uk/images/landing/aldar-yas-waterfront-investment.webp',
    width: '1600', height: '900', alt: 'مساكن على واجهة جزيرة ياس البحرية تمثل مقارنة مشروع ذا كانوبيز - ياس بوينت',
  },
};

const LANDING_POLISH_CSS = `
.jr-whatsapp-contact{width:max-content;max-width:100%;gap:10px;margin-top:2px;border-color:var(--accent-2);background:rgba(255,255,255,.08);background:color-mix(in srgb,var(--accent) 28%,transparent);color:#fff}
.jr-whatsapp-contact:hover,.jr-whatsapp-contact:focus-visible{background:var(--accent-2);border-color:var(--accent-2);color:#111411}
.jr-mobile-cta [data-whatsapp-action]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
@media (min-width:761px) and (max-width:1100px){:root{--section:clamp(58px,7vw,78px)}.jr-form-wrap{gap:34px}.jr-map{gap:34px}}
@media(max-width:760px){:root{--section:56px}.jr-hero{min-height:min(760px,100svh)}.jr-hero__inner{min-height:calc(min(760px,100svh) - 68px);padding-block:clamp(52px,8vh,68px) 30px}.jr-form-wrap{gap:28px}.jr-form-copy ul{margin:24px 0;padding:18px 0}.jr-whatsapp-contact{width:100%;justify-content:center}.jr-mobile-cta{grid-template-columns:1.15fr .85fr}}
@media(max-width:420px){:root{--section:52px}.jr-hero h1{font-size:clamp(2.85rem,14vw,4.15rem)}.jr-faq{gap:26px}}
`;

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

function digitalClean(value,maxLength){return typeof value==='string'?value.trim().slice(0,maxLength):''}
function digitalScore(data,type){let s=0;const b=digitalClean(data.budget,80);if(b.includes('$50K+'))s+=5;else if(b.includes('$30K'))s+=4;else if(b.includes('$15K'))s+=3;else if(b.includes('$5K'))s+=2;if(digitalClean(data.website,300))s+=1;if(digitalClean(data.phone,40))s+=1;if(digitalClean(data.need||data.topic,1200).length>80)s+=2;if(type==='call')s+=1;return s}
async function captureDigital(request,env,type){if(!env.LEADS)return json({ok:false,error:'Lead storage is not configured'},503);let data;try{data=await readLimitedJson(request)}catch(e){return json({ok:false,error:'Invalid request'},400)}if(digitalClean(data.honeypot,200))return json({ok:true,lead_id:'accepted'},202);const name=digitalClean(data.name,120),company=digitalClean(data.company,160),email=digitalClean(data.email,180);if(name.length<2||company.length<2||!/^\S+@\S+\.\S+$/.test(email)||data.consent!==true)return json({ok:false,error:'Required fields are incomplete'},422);const id=crypto.randomUUID(),created=new Date().toISOString(),score=digitalScore(data,type),priority=score>=7?'high':score>=4?'medium':'standard';try{await env.LEADS.batch([env.LEADS.prepare(`CREATE TABLE IF NOT EXISTS digital_leads (submission_id TEXT PRIMARY KEY,created_at TEXT NOT NULL,type TEXT NOT NULL,name TEXT NOT NULL,company TEXT NOT NULL,email TEXT NOT NULL,phone TEXT,website TEXT,country TEXT,need TEXT,context TEXT,budget TEXT,timeline TEXT,preferred_time TEXT,timezone TEXT,topic TEXT,lead_score INTEGER NOT NULL,priority TEXT NOT NULL,landing_page TEXT,referrer TEXT,utm_source TEXT,utm_medium TEXT,utm_campaign TEXT,country_code TEXT,status TEXT NOT NULL DEFAULT 'new')`),env.LEADS.prepare('CREATE INDEX IF NOT EXISTS idx_digital_leads_created ON digital_leads(created_at)'),env.LEADS.prepare(`INSERT INTO digital_leads (submission_id,created_at,type,name,company,email,phone,website,country,need,context,budget,timeline,preferred_time,timezone,topic,lead_score,priority,landing_page,referrer,utm_source,utm_medium,utm_campaign,country_code) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,created,type,name,company,email,digitalClean(data.phone,40),digitalClean(data.website,300),digitalClean(data.country,100),digitalClean(data.need,1600),digitalClean(data.context,2400),digitalClean(data.budget,80),digitalClean(data.timeline,80),digitalClean(data.preferred_time,80),digitalClean(data.timezone,120),digitalClean(data.topic,1600),score,priority,digitalClean(data.landing_page,300),digitalClean(data.referrer,500),digitalClean(data.utm_source,120),digitalClean(data.utm_medium,120),digitalClean(data.utm_campaign,180),digitalClean(request.cf?.country,8))]);return json({ok:true,lead_id:id.slice(0,8).toUpperCase(),lead_score:score,priority},201)}catch(e){console.error(JSON.stringify({event:'digital_lead_capture_failed',error:String(e)}));return json({ok:false,error:'Lead storage is temporarily unavailable'},503,{'retry-after':'15'})}}
function digitalOriginPath(path){if(path==='/')return '/digital/index.html';if(path.endsWith('.html'))return '/digital'+path;if(/\.[a-z0-9]+$/i.test(path))return '/digital'+path;if(path.endsWith('/'))return '/digital'+path+'index.html';return '/digital'+path+'.html'}
async function handleDigital(request,env,incoming){if(incoming.pathname==='/api/digital-lead'||incoming.pathname==='/api/digital-call'){if(request.method!=='POST')return json({ok:false,error:'Method not allowed'},405,{Allow:'POST'});return captureDigital(request,env,incoming.pathname.endsWith('call')?'call':'project')}if(!['GET','HEAD'].includes(request.method))return plain('Method not allowed',405,{Allow:'GET, HEAD'});if(incoming.pathname==='/book-call'||incoming.pathname==='/book-call.html')return Response.redirect('https://digital.jamesrealty.uk/request-call',301);if(incoming.pathname==='/custom-engagements'||incoming.pathname==='/custom-engagements.html')return Response.redirect('https://digital.jamesrealty.uk/pricing',301);if(incoming.pathname.endsWith('.html'))return Response.redirect(`https://digital.jamesrealty.uk${incoming.pathname.slice(0,-5)}${incoming.search}`,301);const target=`${ORIGIN}${digitalOriginPath(incoming.pathname)}${incoming.search}`;const up=await fetch(target,{redirect:'follow',headers:{'user-agent':'JamesDigitalEdge/1.0'}});const h=new Headers(up.headers);Object.entries(SECURITY_HEADERS).forEach(([k,v])=>h.set(k,v));h.set('cache-control',incoming.pathname==='/'?'no-cache, no-store, must-revalidate':'public, max-age=300');h.set('x-james-digital-edge','1');h.delete('set-cookie');return new Response(up.body,{status:up.status,statusText:up.statusText,headers:h})}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function normaliseAssetUrl(value) {
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return value;
  }
}

function rewriteHTML(html, hostname, requestUrl) {
  const canonical = `https://${hostname}/`;
  const base = HOSTS[hostname];
  const current = new URL(requestUrl);
  const campaign = current.searchParams.get('utm_campaign') || hostname.split('.')[0];

  html = html
    .replace(/<link rel="canonical" href="[^"]+">/i, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:url" content="[^"]+">/i, `<meta property="og:url" content="${canonical}">`)
    .replaceAll(`href="${base}`, 'href="https://jamesrealty.uk/')
    .replaceAll(`src="${base}`, 'src="https://jamesrealty.uk/');

  html = html.replace(/<img\b([^>]*?)\bsrc="([^"]+)"([^>]*)>/gi, (match, before, src, after) => {
    const upgrade = IMAGE_UPGRADES[normaliseAssetUrl(src)];
    if (!upgrade) return match;
    let attrs = `${before}src="${upgrade.src}"${after}`;
    attrs = attrs.replace(/\s(?:srcset|sizes)="[^"]*"/gi, '');
    attrs = attrs.replace(/\swidth="[^"]*"/gi, '');
    attrs = attrs.replace(/\sheight="[^"]*"/gi, '');
    attrs = attrs.replace(/\salt="[^"]*"/gi, '');
    return `<img${attrs} width="${upgrade.width}" height="${upgrade.height}" alt="${upgrade.alt}">`;
  });

  html = html.replace(/<a\s+([^>]*?data-whatsapp-action[^>]*?)href="[^"]*"([^>]*)>/gi, (match, before, after) => {
    return `<a ${before}href="${WHATSAPP}?text=${encodeURIComponent(`Hello James, I am enquiring from ${hostname}.`)}"${after}>`;
  });

  html = html.replace('</head>', `<style>${LANDING_POLISH_CSS}</style></head>`);
  html = html.replace('</body>', `<script>window.__JR_CANONICAL_HOST=${JSON.stringify(hostname)};window.__JR_CAMPAIGN=${JSON.stringify(campaign)};</script></body>`);
  return html;
}

async function fetchLanding(request, hostname) {
  const base = HOSTS[hostname];
  if (!base) return plain('Unknown landing host', 404);

  const incoming = new URL(request.url);
  let path = incoming.pathname;
  if (path === '/') path = `${base}index.html`;
  else path = `${base}${path.replace(/^\//, '')}`;

  const originUrl = new URL(path, ORIGIN);
  originUrl.search = incoming.search;
  const response = await fetch(originUrl.toString(), {
    redirect: 'follow',
    headers: { 'user-agent': 'JamesRealtyLandingWorker/1.0' },
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return withSecurityHeaders(response);

  let html = await response.text();
  html = rewriteHTML(html, hostname, request.url);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300');
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  headers.delete('set-cookie');
  return new Response(html, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const hostname = incoming.hostname.toLowerCase();
    if (hostname === 'digital.jamesrealty.uk') return handleDigital(request, env, incoming);
    if (!HOSTS[hostname]) return plain('Unknown host', 404);
    if (incoming.pathname === '/api/lead') {
      if (request.method !== 'POST') return plain('Method not allowed', 405, { Allow: 'POST' });
      return captureLead(request, env, hostname);
    }
    if (!['GET', 'HEAD'].includes(request.method)) return plain('Method not allowed', 405, { Allow: 'GET, HEAD' });
    return fetchLanding(request, hostname);
  },
};
