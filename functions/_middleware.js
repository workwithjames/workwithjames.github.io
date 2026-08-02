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

function renameBlogPageLabels(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body
    .replace(
      /(<a\b[^>]*\bhref=["']\/blog\/["'][^>]*>)\s*Blog\s*(<\/a>)/gi,
      '$1News$2'
    )
    .replace(/UAE property blog/gi, 'UAE property news');
}

function replacePersonalName(body) {
  const previousName = 'James' + ' Ravi';
  return body.split(previousName).join('James');
}

function addAjmanNavigation(body, contentType) {
  if (!contentType.includes('text/html') || body.includes('href="/ajman-data/"') || body.includes("href='/ajman-data/'")) return body;

  return body.replace(
    /(<a\b[^>]*\bhref=["']\/abu-dhabi-data\/["'][^>]*>\s*Abu Dhabi Data\s*<\/a>)/gi,
    '$1<a href="/ajman-data/">Ajman Data</a>'
  );
}

function addConversionFooterLinks(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body.replace(/(<nav\b[^>]*class=["'][^"']*footer-links[^"']*["'][^>]*>)([\s\S]*?)(<\/nav>)/gi, (match, open, links, close) => {
    if (links.includes('/buy-invest-dubai/')) return match;
    const conversionLinks = '<a href="/buy-invest-dubai/">Buy / Invest</a><a href="/sell-dubai-property/">Sell</a><a href="/real-estate-marketing/">Marketing</a>';
    return open + conversionLinks + links + close;
  });
}

function replaceMissingSocialPreview(body, contentType) {
  if (!contentType.includes('text/html')) return body;

  return body.replace(
    /https:\/\/jamesrealty\.uk\/james-realty-social-preview\.jpg/g,
    'https://jamesrealty.uk/images/dubai-residential-portfolio.webp'
  );
}

function upgradeHomepage(body, contentType, pathname) {
  if (!contentType.includes('text/html') || pathname !== '/' || body.includes('id="conversion-home-hero"')) return body;

  body = body
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>Dubai Property Intelligence &amp; Real Estate Marketing | James Realty</title>')
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i, '<meta name="description" content="For buyers, investors and sellers, explore Dubai property data or start a focused property or real estate marketing enquiry with James Realty."/>')
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, '<meta property="og:title" content="Dubai Property Intelligence &amp; Real Estate Marketing | James Realty"/>')
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, '<meta property="og:description" content="Choose a buyer, investor, seller or real estate marketing journey, supported by practical Dubai property data."/>')
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/i, '<meta name="twitter:title" content="Dubai Property Intelligence &amp; Real Estate Marketing | James Realty"/>')
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/i, '<meta name="twitter:description" content="Dubai property data and focused enquiry paths for buyers, investors, sellers and property businesses."/>');

  if (!body.includes('/assets/conversion.css')) {
    body = body.replace('</head>', '<link rel="stylesheet" href="/assets/conversion.css?v=1"/></head>');
  }

  body = body
    .replace('<main id="main-content" class="market-page">', '<main id="main-content" class="market-page conversion-home">')
    .replace(/<h1 id="market-title">([\s\S]*?)<\/h1>/i, '<h2 id="market-title">$1</h2>')
    .replace('["#market-title","#market-answer"', '["#conversion-title","#market-title","#market-answer"');

  const conversionContent = `
<section id="conversion-home-hero" class="section-shell conversion-hero" aria-labelledby="conversion-title">
  <div class="conversion-hero-copy">
    <span class="eyebrow">Dubai property intelligence and growth</span>
    <h1 id="conversion-title">Choose the right path for your Dubai property goal.</h1>
    <p>Use market data to understand the context, then start a focused journey for buying, investing, selling or building a stronger real estate marketing system.</p>
    <div class="conversion-hero-actions">
      <a class="button button-primary" href="/buy-invest-dubai/">Buy or invest <span aria-hidden="true">→</span></a>
      <a class="button button-outline" href="/sell-dubai-property/">Sell a property</a>
      <a class="button button-outline" href="/real-estate-marketing/">Marketing partnership</a>
    </div>
  </div>
  <aside class="conversion-hero-note">
    <p class="section-kicker">A clearer starting point</p>
    <strong>Data first, then a structured next step.</strong>
    <p>The website separates market research from the action you need to take, so the enquiry starts with useful information rather than a generic contact message.</p>
  </aside>
</section>
<section class="section-shell conversion-paths" aria-labelledby="conversion-paths-title">
  <div class="conversion-paths-heading">
    <div><p class="section-kicker">Choose your journey</p><h2 id="conversion-paths-title">What are you trying to achieve?</h2></div>
    <p>Each path includes a focused page and a structured WhatsApp brief. No account, external form provider or registration is required.</p>
  </div>
  <div class="conversion-path-grid">
    <a class="conversion-path-card" href="/buy-invest-dubai/">
      <span>Buy or invest</span><h3>Find the right Dubai property direction.</h3>
      <p>Clarify budget, purpose, timeline, payment route and property preferences before comparing options.</p>
      <ul><li>Ready and off-plan</li><li>Personal use and investment</li><li>Area and project screening</li></ul>
      <strong>Build a buyer brief →</strong>
    </a>
    <a class="conversion-path-card" href="/sell-dubai-property/">
      <span>Sell a property</span><h3>Prepare the property before marketing it.</h3>
      <p>Organise the property facts, occupancy, expected timeline and selling priorities before going to market.</p>
      <ul><li>Comparable context</li><li>Buyer positioning</li><li>Launch readiness</li></ul>
      <strong>Build a seller brief →</strong>
    </a>
    <a class="conversion-path-card" href="/real-estate-marketing/">
      <span>Property business</span><h3>Connect campaigns with lead conversion.</h3>
      <p>Discuss project launches, investor acquisition, performance marketing, CRM follow-up and reporting.</p>
      <ul><li>Lead generation</li><li>International campaigns</li><li>CRM and automation</li></ul>
      <strong>Build a marketing brief →</strong>
    </a>
  </div>
</section>
<section class="section-shell conversion-proof" aria-label="James Realty approach">
  <article><strong>Market context</strong><p>Dubai, Abu Dhabi and Ajman data pages support research before a decision.</p></article>
  <article><strong>Focused enquiries</strong><p>Each journey collects the details needed for a more useful first conversation.</p></article>
  <article><strong>No external form account</strong><p>The qualification tools prepare private WhatsApp messages in the visitor's browser.</p></article>
  <article><strong>Property and marketing</strong><p>The website serves buyers, owners and real estate businesses without mixing their goals.</p></article>
</section>`;

  return body.replace(
    '<section class="section-shell market-hero" aria-labelledby="market-title">',
    conversionContent + '<section class="section-shell market-hero market-entry" aria-labelledby="market-title">'
  );
}

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);

  if (requestUrl.hostname.toLowerCase() === 'www.jamesrealty.uk') {
    return Response.redirect(`${PRIMARY_ORIGIN}${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`, 301);
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
  for (const legacyOrigin of LEGACY_ORIGINS) body = body.split(legacyOrigin).join(PRIMARY_ORIGIN);
  body = removeDirectGa4Configuration(body, contentType);
  body = renameBlogPageLabels(body, contentType);
  body = replacePersonalName(body);
  body = addAjmanNavigation(body, contentType);
  body = addConversionFooterLinks(body, contentType);
  body = replaceMissingSocialPreview(body, contentType);
  body = upgradeHomepage(body, contentType, requestUrl.pathname);

  headers.delete('content-length');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}