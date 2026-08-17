const PRIMARY_ORIGIN = 'https://jamesrealty.uk';
const GA4_MEASUREMENT_ID = 'G-2MPZL26C6D';
const ASSET_VERSION = '20260803-5';
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

const VERSIONED_ASSETS = [
  'site.js',
  'header-goal-nav.css',
  'mobile-header.css',
  'mobile-header.js',
  'intent-popup.css',
  'intent-popup.js',
  'contact-goals.css',
  'contact-goals.js',
  'quality-fixes.css',
  'quality-fixes.js',
  'editorial-visuals.css',
  'cta-system.css',
  'buyer-cluster.css',
  'buying-cost-calculator.js'
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

function replacePersonalName(body, pathname) {
  if (pathname.startsWith('/landing/') || pathname.startsWith('/privacy-policy/')) return body;
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

function mobileMenuButton() {
  return '<button class="mobile-menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-site-menu" aria-label="Open site menu"><span class="mobile-menu-label">Menu</span><span class="mobile-menu-icon" aria-hidden="true"><span></span><span></span></span></button>';
}

function standardizeHeaderNavigation(body, contentType, pathname) {
  if (!contentType.includes('text/html') || !body.includes('site-header')) return body;

  const flow = headerFlow(pathname);
  body = body.replace(
    /(<div\b[^>]*class=["'][^"']*\bglobal-links\b[^"']*["'][^>]*>)[\s\S]*?(<\/div>\s*<a\b[^>]*class=["'][^"']*\bnav-cta\b)/i,
    `$1${flow}$2`
  );

  body = body.replace(
    /<nav\b[^>]*class=["'][^"']*\bmobile-page-tabs\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i,
    `<nav id="mobile-site-menu" class="mobile-page-tabs mobile-site-menu" aria-label="Site navigation">${flow}</nav>`
  );

  if (!body.includes('class="mobile-menu-toggle"')) {
    body = body.replace(
      /(<a\b[^>]*class=["'][^"']*\bnav-cta\b)/i,
      `${mobileMenuButton()}$1`
    );
  }

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
        ['/dubai-rental-yield-calculator/', 'Yield Calculator'],
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

function hardenBlankTargets(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body.replace(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi, (tag) => {
    const rel = tag.match(/\brel=(["'])([^"']*)\1/i);
    if (!rel) return tag.slice(0, -1) + ' rel="noopener noreferrer">';

    const tokens = rel[2].split(/\s+/).filter(Boolean);
    if (!tokens.some((token) => token.toLowerCase() === 'noopener')) tokens.push('noopener');
    if (!tokens.some((token) => token.toLowerCase() === 'noreferrer')) tokens.push('noreferrer');
    return tag.replace(rel[0], `rel="${tokens.join(' ')}"`);
  });
}

function normalizeAssetVersions(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  for (const asset of VERSIONED_ASSETS) {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    body = body.replace(
      new RegExp(`/assets/${escaped}(?:\\?v=[^"'\\s>]*)?`, 'g'),
      `/assets/${asset}?v=${ASSET_VERSION}`
    );
  }
  return body;
}

function injectNavigationAssets(body, contentType) {
  if (!contentType.includes('text/html') || !body.includes('site-header')) return body;

  const assets = [];
  if (!body.includes('/assets/header-goal-nav.css')) {
    assets.push(`<link rel="stylesheet" href="/assets/header-goal-nav.css?v=${ASSET_VERSION}"/>`);
  }
  if (!body.includes('/assets/mobile-header.css')) {
    assets.push(`<link rel="stylesheet" href="/assets/mobile-header.css?v=${ASSET_VERSION}"/>`);
  }
  if (!body.includes('/assets/mobile-header.js')) {
    assets.push(`<script defer src="/assets/mobile-header.js?v=${ASSET_VERSION}"></script>`);
  }
  if (body.includes('editorial-hero-media') && !body.includes('/assets/editorial-visuals.css')) {
    assets.push(`<link rel="stylesheet" href="/assets/editorial-visuals.css?v=${ASSET_VERSION}"/>`);
  }

  return assets.length ? body.replace('</head>', `${assets.join('')}</head>`) : body;
}

function injectQualityAssets(body, contentType, pathname) {
  if (!contentType.includes('text/html')) return body;
  if (pathname.startsWith('/landing/') || pathname.startsWith('/privacy-policy/')) return body;

  const assets = [];
  if (!body.includes('/assets/quality-fixes.css')) {
    assets.push(`<link rel="stylesheet" href="/assets/quality-fixes.css?v=${ASSET_VERSION}"/>`);
  }
  if (!body.includes('/assets/quality-fixes.js')) {
    assets.push(`<script defer src="/assets/quality-fixes.js?v=${ASSET_VERSION}"></script>`);
  }

  return assets.length ? body.replace('</head>', `${assets.join('')}</head>`) : body;
}

function shouldInjectIntentPopup(pathname) {
  if (pathname === '/contact/' || pathname === '/about-me/' || pathname === '/cite/') return false;
  if (pathname === '/blog/' || pathname === '/blog/property-news/') return false;
  if (pathname === '/') return true;
  if (pathname.startsWith('/buy-invest-dubai/')) return true;
  if (pathname.startsWith('/sell-dubai-property/')) return true;
  if (pathname.startsWith('/real-estate-marketing/')) return true;
  if (pathname.startsWith('/dubai-data/')) return true;
  if (pathname.startsWith('/abu-dhabi-data/')) return true;
  if (pathname.startsWith('/ajman-data/')) return true;
  if (pathname.startsWith('/dubai-rental-yield-calculator/')) return true;
  if (pathname.startsWith('/blog/')) return true;
  return false;
}

function injectIntentPopupAssets(body, contentType, pathname) {
  if (!contentType.includes('text/html') || !shouldInjectIntentPopup(pathname)) return body;

  const assets = [];
  if (!body.includes('/assets/intent-popup.css')) {
    assets.push(`<link rel="stylesheet" href="/assets/intent-popup.css?v=${ASSET_VERSION}"/>`);
  }
  if (!body.includes('/assets/intent-popup.js')) {
    assets.push(`<script defer src="/assets/intent-popup.js?v=${ASSET_VERSION}"></script>`);
  }

  return assets.length ? body.replace('</head>', `${assets.join('')}</head>`) : body;
}

function replaceMissingSocialPreview(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body.replace(
    /https:\/\/jamesrealty\.uk\/james-realty-social-preview\.jpg/g,
    'https://jamesrealty.uk/images/james-realty-social-preview.webp'
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
  const hostname = requestUrl.hostname.toLowerCase();
  const pathname = requestUrl.pathname;

  if (hostname === 'www.jamesrealty.uk') {
    return Response.redirect(`${PRIMARY_ORIGIN}${pathname}${requestUrl.search}`, 301);
  }

  if (pathname === '/home' || pathname === '/home/') {
    return Response.redirect(`${PRIMARY_ORIGIN}/${requestUrl.search}`, 301);
  }

  if (pathname === '/dubai-transactions' || pathname === '/dubai-transactions/') {
    return Response.redirect(`${PRIMARY_ORIGIN}/dubai-data/${requestUrl.search}`, 301);
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
  body = replacePersonalName(body, pathname);
  body = renameBlogPageLabels(body, contentType);
  body = rewriteDubaiDataContentLinks(body, contentType);
  body = standardizeHeaderNavigation(body, contentType, pathname);
  body = addConversionFooterLinks(body, contentType);
  body = injectNavigationAssets(body, contentType);
  body = injectIntentPopupAssets(body, contentType, pathname);
  body = injectQualityAssets(body, contentType, pathname);
  body = hardenBlankTargets(body, contentType);
  body = replaceMissingSocialPreview(body, contentType);
  body = normalizeAssetVersions(body, contentType);
  body = updateDubaiDashboardScript(body, contentType, pathname);

  headers.delete('content-length');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
