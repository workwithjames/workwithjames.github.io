const PRIMARY_ORIGIN = 'https://jamesrealty.uk';
const GA4_MEASUREMENT_ID = 'G-2MPZL26C6D';
const LEGACY_ORIGINS = [
  'https://workwithjames.github.io',
  'http://workwithjames.github.io'
];

const TEXT_CONTENT_TYPES = [
  'text/html',
  'text/plain',
  'text/xml',
  'application/xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/json',
  'application/manifest+json'
];

function isTextResponse(contentType) {
  return TEXT_CONTENT_TYPES.some((type) => contentType.includes(type));
}

function applySecurityHeaders(headers) {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
}

function removeDirectGa4Configuration(body, contentType) {
  if (!contentType.includes('text/html')) {
    return body;
  }

  const escapedMeasurementId = GA4_MEASUREMENT_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const directLoaderPattern = new RegExp(
    `<script\\b[^>]*\\bsrc=["']https:\\/\\/www\\.googletagmanager\\.com\\/gtag\\/js\\?id=${escapedMeasurementId}["'][^>]*><\\/script>`,
    'gi'
  );
  const directConfigPattern = new RegExp(
    `gtag\\(\\s*["']config["']\\s*,\\s*["']${escapedMeasurementId}["'](?:\\s*,\\s*\\{[\\s\\S]*?\\})?\\s*\\)\\s*;?`,
    'g'
  );

  return body
    .replace(directLoaderPattern, '')
    .replace(directConfigPattern, '');
}

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);

  if (requestUrl.hostname.toLowerCase() === 'www.jamesrealty.uk') {
    return Response.redirect(
      `${PRIMARY_ORIGIN}${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
      301
    );
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  const contentType = (headers.get('content-type') || '').toLowerCase();

  applySecurityHeaders(headers);

  if (!isTextResponse(contentType)) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  let body = await response.text();
  for (const legacyOrigin of LEGACY_ORIGINS) {
    body = body.split(legacyOrigin).join(PRIMARY_ORIGIN);
  }
  body = removeDirectGa4Configuration(body, contentType);

  headers.delete('content-length');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
