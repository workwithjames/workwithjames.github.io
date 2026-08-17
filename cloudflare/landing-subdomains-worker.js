/**
 * Cloudflare Worker for James Realty campaign subdomains.
 *
 * Each hostname serves a versioned, noindex fallback file from the GitHub Pages
 * origin. The Worker changes only the robots directive for the canonical host.
 * This keeps one maintainable source file while preventing fallback URLs from
 * competing in search results.
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

export default {
  async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) return plain('Method not allowed', 405, { Allow: 'GET, HEAD' });

    const incoming = new URL(request.url);
    const sourcePath = HOSTS[incoming.hostname];
    if (!sourcePath) return plain('Unknown James Realty landing-page host', 404);

    if (incoming.pathname === '/robots.txt') {
      return plain(`User-agent: *\nAllow: /\nSitemap: https://${incoming.hostname}/sitemap.xml\n`);
    }

    if (incoming.pathname === '/sitemap.xml') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${incoming.hostname}/</loc><lastmod>2026-08-17</lastmod></url></urlset>\n`;
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

    const originalHtml = await upstream.text();
    const indexedHtml = originalHtml.replace(
      'content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"',
      'content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"',
    );
    const headers = new Headers(upstream.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400');
    Object.entries(SECURITY_HEADERS).forEach(([name, value]) => headers.set(name, value));
    headers.delete('content-security-policy');
    headers.delete('content-length');
    return new Response(request.method === 'HEAD' ? null : indexedHtml, { status: 200, headers });
  },
};
