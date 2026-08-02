const CACHE_SECONDS = 3600;

const SOURCES = {
  dashboardEn: 'https://adrec.gov.ae/en/property_and_index/adrec-dashboards',
  dashboardAr: 'https://adrec.gov.ae/ar-ae/property_and_index/adrec-dashboards',
  homeEn: 'https://adrec.gov.ae/en',
  homeAr: 'https://adrec.gov.ae/'
};

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function normalizeDigits(value) {
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  return String(value || '')
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٬،]/g, ',')
    .replace(/٫/g, '.');
}

function visibleText(html) {
  return normalizeDigits(
    decodeEntities(
      String(html || '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    )
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function rawText(html) {
  return normalizeDigits(decodeEntities(String(html || ''))).replace(/\\u0026/g, '&');
}

function compactNumber(value) {
  const match = String(value || '')
    .trim()
    .match(/-?\d[\d,]*(?:\.\d+)?\s*(?:trillion|billion|million|bn|mn|tn|b|m|k)?/i);
  return match ? match[0].replace(/\s+/g, '') : null;
}

function parseNumber(value) {
  if (!value) return null;
  const cleaned = String(value).toLowerCase().replace(/,/g, '').trim();
  const match = cleaned.match(/(-?\d+(?:\.\d+)?)(trillion|billion|million|bn|mn|tn|b|m|k)?/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const suffix = match[2] || '';
  const multiplier = {
    trillion: 1e12,
    tn: 1e12,
    billion: 1e9,
    bn: 1e9,
    b: 1e9,
    million: 1e6,
    mn: 1e6,
    m: 1e6,
    k: 1e3
  }[suffix] || 1;
  return amount * multiplier;
}

function findOccurrences(text, label) {
  const positions = [];
  let offset = 0;
  const source = text.toLowerCase();
  const needle = label.toLowerCase();
  while (offset < source.length) {
    const index = source.indexOf(needle, offset);
    if (index === -1) break;
    positions.push(index);
    offset = index + needle.length;
  }
  return positions;
}

function extractMetricFromText(text, labels, occurrence = 0) {
  for (const label of labels) {
    const positions = findOccurrences(text, label);
    if (!positions.length) continue;
    const position = positions[Math.min(occurrence, positions.length - 1)];
    const window = text.slice(position + label.length, position + label.length + 280);
    const value = compactNumber(window);
    if (!value) continue;

    const valueIndex = window.indexOf(value);
    const afterValue = valueIndex >= 0 ? window.slice(valueIndex + value.length, valueIndex + value.length + 180) : window;
    const percentMatch = afterValue.match(/(?:up|down|increase|decrease|ارتفاع|انخفاض)?\s*[:：]?\s*(-?\d+(?:\.\d+)?)\s*%/i);
    const directionMatch = afterValue.match(/\b(down|decrease)\b|انخفاض/i);

    return {
      display: value,
      value: parseNumber(value),
      yoy: percentMatch ? Number(percentMatch[1]) * (directionMatch ? -1 : 1) : null
    };
  }
  return null;
}

function extractMetric(html, labels, occurrence = 0) {
  return (
    extractMetricFromText(visibleText(html), labels, occurrence) ||
    extractMetricFromText(rawText(html), labels, occurrence)
  );
}

function mergeMetric(...metrics) {
  return metrics.find((metric) => metric && metric.value !== null) || null;
}

function parseDashboard(htmlEn, htmlAr) {
  return {
    transactionValue: mergeMetric(
      extractMetric(htmlEn, ['Total Transactional Value', 'Total Transaction Value']),
      extractMetric(htmlAr, ['إجمالي قيمة المعاملات', 'إجمالي قيمة التصرفات'])
    ),
    transactionVolume: mergeMetric(
      extractMetric(htmlEn, ['Total Transactional Volume', 'Total Transaction Volume']),
      extractMetric(htmlAr, ['إجمالي حجم المعاملات', 'إجمالي عدد المعاملات'])
    ),
    apartmentSaleIndex: mergeMetric(
      extractMetric(htmlEn, ['Apartment Sale Price Index']),
      extractMetric(htmlAr, ['مؤشر أسعار بيع الشقق'])
    ),
    villaSaleIndex: mergeMetric(
      extractMetric(htmlEn, ['Villa Sale Price Index']),
      extractMetric(htmlAr, ['مؤشر أسعار بيع الفلل']),
      extractMetric(htmlEn, ['Apartment Sale Price Index'], 1)
    ),
    rentedUnits: mergeMetric(
      extractMetric(htmlEn, ['Rented Residential Units']),
      extractMetric(htmlAr, ['الوحدات السكنية المؤجرة'])
    ),
    apartmentRentIndex: mergeMetric(
      extractMetric(htmlEn, ['Apartment Rent Price Index']),
      extractMetric(htmlAr, ['مؤشر أسعار إيجار الشقق'])
    ),
    villaRentIndex: mergeMetric(
      extractMetric(htmlEn, ['Villa Rent Price Index']),
      extractMetric(htmlAr, ['مؤشر أسعار إيجار الفلل'])
    )
  };
}

function parseHome(htmlEn, htmlAr) {
  return {
    ytdTransactionValue: mergeMetric(
      extractMetric(htmlEn, ['Transaction Value']),
      extractMetric(htmlAr, ['قيمة التصرفات العقارية', 'قيمة المعاملات العقارية'])
    ),
    ytdSalesValue: mergeMetric(
      extractMetric(htmlEn, ['Sales Value']),
      extractMetric(htmlAr, ['قيمة المبيعات'])
    ),
    ytdMortgageValue: mergeMetric(
      extractMetric(htmlEn, ['Mortgage Value']),
      extractMetric(htmlAr, ['قيمة الرهن', 'قيمة الرهون'])
    ),
    ytdFdiValue: mergeMetric(
      extractMetric(htmlEn, ['Foreign Direct Investment Transaction', 'Foreign Direct Investment']),
      extractMetric(htmlAr, ['قيمة الاستثمار الأجنبي المباشر', 'الاستثمار الأجنبي المباشر'])
    )
  };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-AE,en;q=0.9,ar;q=0.6',
      'User-Agent': 'JamesRealty-AbuDhabiData/1.0'
    },
    redirect: 'follow',
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
  });

  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return {
    html: await response.text(),
    lastModified: response.headers.get('last-modified') || null,
    etag: response.headers.get('etag') || null,
    finalUrl: response.url
  };
}

function responseJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=300, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=21600`,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function metricCount(metrics) {
  return Object.values(metrics).filter((metric) => metric && metric.value !== null).length;
}

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const cacheKey = new Request(`${requestUrl.origin}/api/abu-dhabi-data?v=3`, context.request);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const settled = await Promise.allSettled([
      fetchHtml(SOURCES.dashboardEn),
      fetchHtml(SOURCES.dashboardAr),
      fetchHtml(SOURCES.homeEn),
      fetchHtml(SOURCES.homeAr)
    ]);

    const [dashboardEn, dashboardAr, homeEn, homeAr] = settled.map((result) =>
      result.status === 'fulfilled' ? result.value : null
    );

    if (!dashboardEn && !dashboardAr) {
      throw new Error('The public ADREC dashboard pages could not be retrieved');
    }

    const dashboard = parseDashboard(dashboardEn?.html || '', dashboardAr?.html || '');
    const marketPerformance = parseHome(homeEn?.html || '', homeAr?.html || '');
    const availableMetrics = metricCount(dashboard) + metricCount(marketPerformance);

    const payload = {
      ok: availableMetrics > 0,
      source: 'Abu Dhabi Real Estate Centre and DARI',
      sourceUrl: SOURCES.dashboardEn,
      officialDashboardUrl: SOURCES.dashboardEn,
      dariDashboardUrl: 'https://www.dari.ae/adrec/MarketDetails.html',
      updateFrequency: 'Daily and automatic according to DARI',
      fetchedAt: new Date().toISOString(),
      sourceLastModified: dashboardEn?.lastModified || dashboardAr?.lastModified || null,
      metrics: dashboard,
      marketPerformance,
      coverage: {
        transactions: ['Sales', 'Mortgages', 'Other transactions', 'Residential', 'Commercial', 'Monthly', 'Quarterly', 'Yearly'],
        residentialSales: ['Apartments', 'Villas', 'Townhouses', 'Penthouses', 'Plots', 'Ready', 'Off-plan', 'Court-mandated'],
        leases: ['Rented residential units', 'Residential lease values', 'Average annual rents', 'Apartment rent index', 'Villa rent index'],
        geography: ['Abu Dhabi City', 'Al Ain City', 'Al Dhafra Region', 'District', 'Community', 'Project'],
        recentSales: ['Asset type', 'Property type', 'Sale type', 'District', 'Community', 'Project', 'Layout']
      },
      warning: availableMetrics > 0
        ? null
        : 'The official pages loaded, but their current figures were not exposed in readable public page markup.'
    };

    const response = responseJson(payload, payload.ok ? 200 : 206);
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return responseJson({
      ok: false,
      source: 'Abu Dhabi Real Estate Centre and DARI',
      sourceUrl: SOURCES.dashboardEn,
      officialDashboardUrl: SOURCES.dashboardEn,
      dariDashboardUrl: 'https://www.dari.ae/adrec/MarketDetails.html',
      fetchedAt: new Date().toISOString(),
      error: 'The public Abu Dhabi market data could not be retrieved at this moment.',
      detail: error instanceof Error ? error.message : String(error)
    }, 502);
  }
}
