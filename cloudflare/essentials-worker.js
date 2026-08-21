const ORIGIN = 'https://jamesrealty.uk/essentials/';

const SECURITY_HEADERS = {
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD', ...SECURITY_HEADERS } });
    }
    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS } });
    }
    if (url.pathname !== '/') return Response.redirect('https://essentials.jamesrealty.uk/', 301);
    const upstream = await fetch(ORIGIN, { cf: { cacheEverything: true, cacheTtl: 300 } });
    if (!upstream.ok) return new Response('Essentials is temporarily unavailable', { status: 502, headers: SECURITY_HEADERS });
    const headers = new Headers(upstream.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400');
    headers.set('x-robots-tag', 'noindex, nofollow');
    Object.entries(SECURITY_HEADERS).forEach(([name, value]) => headers.set(name, value));
    headers.delete('content-security-policy');
    headers.delete('content-length');
    return new Response(request.method === 'HEAD' ? null : upstream.body, { status: 200, headers });
  },
};
