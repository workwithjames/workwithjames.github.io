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
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/json',
  'application/ld+json',
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
  if (!contentType.includes('text/html')) return body;

  const escapedMeasurementId = GA4_MEASUREMENT_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const directLoaderPattern = new RegExp(
    `<script\\b[^>]*\\bsrc=["']https:\\/\\/www\\.googletagmanager\\.com\\/gtag\\/js\\?id=${escapedMeasurementId}["'][^>]*><\\/script>`,
    'gi'
  );
  const directConfigPattern = new RegExp(
    `gtag\\(\\s*["']config["']\\s*,\\s*["']${escapedMeasurementId}["'](?:\\s*,\\s*\\{[\\s\\S]*?\\})?\\s*\\)\\s*;?`,
    'g'
  );

  return body.replace(directLoaderPattern, '').replace(directConfigPattern, '');
}

function replacePersonalName(body) {
  return body.split('James' + ' Ravi').join('James');
}

function renameBlogPageLabels(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body
    .replace(
      /(<a\b[^>]*\bhref=["']\/blog\/["'][^>]*>)\s*Blog\s*(<\/a>)/gi,
      '$1News$2'
    )
    .replace(/UAE property blog/gi, 'UAE property news');
}

function rewriteDubaiDataContentLinks(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body
    .replace(
      /(<a\b[^>]*\bhref=)["']\/["']([^>]*>\s*Dubai Data\s*<\/a>)/gi,
      '$1"/dubai-data/"$2'
    )
    .replace(/href=["']\/#area-lookup["']/gi, 'href="/dubai-data/#area-lookup"')
    .replace(/href=["']\/#affordability["']/gi, 'href="/dubai-data/#affordability"');
}

function isCurrentPath(pathname, href) {
  if (href === '/') return pathname === '/';
  if (href === '/blog/') return pathname === '/blog/' || pathname.startsWith('/blog/');
  return pathname === href || pathname.startsWith(href);
}

function navLink(pathname, href, label) {
  const current = isCurrentPath(pathname, href) ? ' aria-current="page"' : '';
  return `<a href="${href}"${current}>${label}</a>`;
}

function goalDropdown(pathname) {
  const goalPaths = ['/buy-invest-dubai/', '/sell-dubai-property/', '/real-estate-marketing/'];
  const goalCurrent = goalPaths.some((path) => isCurrentPath(pathname, path));
  return `<details class="goal-nav${goalCurrent ? ' is-current' : ''}"><summary aria-label="Your Goal menu">Your Goal <span class="goal-nav-caret" aria-hidden="true">⌄</span></summary><div class="goal-nav-menu" role="group" aria-label="Your Goal options">${navLink(pathname, '/buy-invest-dubai/', 'Buy / Invest')}${navLink(pathname, '/sell-dubai-property/', 'Sell')}${navLink(pathname, '/real-estate-marketing/', 'Marketing')}</div></details>`;
}

function headerFlow(pathname) {
  return [
    navLink(pathname, '/', 'Home'),
    goalDropdown(pathname),
    navLink(pathname, '/dubai-data/', 'Dubai Data'),
    navLink(pathname, '/abu-dhabi-data/', 'Abu Dhabi Data'),
    navLink(pathname, '/ajman-data/', 'Ajman Data'),
    navLink(pathname, '/about-me/', 'About Me'),
    navLink(pathname, '/blog/', 'News'),
    navLink(pathname, '/contact/', 'Contact Me')
  ].join('');
}

function standardizeHeaderNavigation(body, contentType, pathname) {
  if (!contentType.includes('text/html')) return body;

  const flow = headerFlow(pathname);
  body = body.replace(
    /(<div\b[^>]*class=["'][^"']*\bglobal-links\b[^"']*["'][^>]*>)[\s\S]*?(<\/div>)/i,
    `$1${flow}$2`
  );
  body = body.replace(
    /(<nav\b[^>]*class=["'][^"']*\bmobile-page-tabs\b[^"']*["'][^>]*>)[\s\S]*?(<\/nav>)/i,
    `$1${flow}$2`
  );
  return body;
}

function addConversionFooterLinks(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body.replace(
    /(<nav\b[^>]*class=["'][^"']*footer-links[^"']*["'][^>]*>)([\s\S]*?)(<\/nav>)/gi,
    (match, open, links, close) => {
      let updated = links;
      const additions = [
        ['/buy-invest-dubai/', 'Buy / Invest'],
        ['/sell-dubai-property/', 'Sell'],
        ['/real-estate-marketing/', 'Marketing'],
        ['/dubai-data/', 'Dubai Data'],
        ['/abu-dhabi-data/', 'Abu Dhabi Data'],
        ['/ajman-data/', 'Ajman Data']
      ];

      additions.reverse().forEach(([href, label]) => {
        if (!updated.includes(href)) updated = `<a href="${href}">${label}</a>` + updated;
      });

      return open + updated + close;
    }
  );
}

function injectGoalNavigationAssets(body, contentType) {
  if (!contentType.includes('text/html') || body.includes('/assets/header-goal-nav.css')) return body;
  return body.replace('</head>', '<link rel="stylesheet" href="/assets/header-goal-nav.css?v=1"/></head>');
}

function replaceMissingSocialPreview(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body.replace(
    /https:\/\/jamesrealty\.uk\/james-realty-social-preview\.jpg/g,
    'https://jamesrealty.uk/images/dubai-residential-portfolio.webp'
  );
}

function updateDubaiDashboardScript(body, contentType, pathname) {
  if (!pathname.endsWith('/assets/dubai-market.js') || !contentType.includes('javascript')) return body;

  return body
    .replace(
      "navigator.clipboard.writeText('https://jamesrealty.uk/')",
      "navigator.clipboard.writeText('https://jamesrealty.uk/dubai-data/')"
    )
    .replace(
      'Copy this address: https://jamesrealty.uk/',
      'Copy this address: https://jamesrealty.uk/dubai-data/'
    );
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
  body = replacePersonalName(body);
  body = renameBlogPageLabels(body, contentType);
  body = rewriteDubaiDataContentLinks(body, contentType);
  body = standardizeHeaderNavigation(body, contentType, requestUrl.pathname);
  body = addConversionFooterLinks(body, contentType);
  body = injectGoalNavigationAssets(body, contentType);
  body = replaceMissingSocialPreview(body, contentType);
  body = updateDubaiDashboardScript(body, contentType, requestUrl.pathname);

  headers.delete('content-length');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
