const BASE = 'https://adrec.gov.ae';
const SOURCE_URL = `${BASE}/en/market-data`;
const CACHE_SECONDS = 3600;

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function metric(value, yoy) {
  const parsed = number(value);
  if (parsed === null) return null;
  return { value: parsed, yoy: number(yoy) };
}

async function fetchJson(path, params = {}) {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-AE,en;q=0.9',
      Referer: SOURCE_URL,
      'User-Agent': 'JamesRealty-AbuDhabiData/2.0'
    },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
  });

  if (!response.ok) throw new Error(`${url.pathname} returned ${response.status}`);
  return response.json();
}

function unwrap(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && value.Data ? value.Data : value;
}

function compactSale(row) {
  return {
    assetClass: row.asset_class || row.assetClass || '',
    propertyType: row.property_type || row.propertyType || '',
    registration: row.sale_application_datetime || row.registration_date || row.date || '',
    soldAreaSqm: number(row.property_sold_area_sqm),
    plotAreaSqm: number(row.land_plot_ground_area_sqm),
    rateAedSqm: number(row.rate_aed_per_sqm),
    layout: row.property_layout || row.layout || '',
    district: row.district || '',
    community: row.community || '',
    project: row.project_name || row.project || '',
    priceAed: number(row.property_sale_price_aed || row.price_aed),
    saleType: row.sale_type || '',
    sequence: row.sequence || row.id || ''
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

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const force = requestUrl.searchParams.has('refresh');
  const cache = caches.default;
  const cacheKey = new Request(`${requestUrl.origin}/api/abu-dhabi-data?v=6`, context.request);
  if (!force) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 120);
  const iso = (date) => date.toISOString().slice(0, 10);

  const requests = {
    transactionValue: fetchJson('/api/feature/MarketData/TotalTransactionalValue', { language: 'en' }),
    transactionVolume: fetchJson('/api/feature/MarketData/TotalTransactionalVolume', { language: 'en' }),
    apartmentSale: fetchJson('/api/feature/MarketData/GetSalePriceIndex', { propertyType: 'apartment', language: 'en' }),
    villaSale: fetchJson('/api/feature/MarketData/GetSalePriceIndex', { propertyType: 'villa', language: 'en' }),
    rentedUnits: fetchJson('/api/feature/MarketData/GetRentedResiUnits', { language: 'en' }),
    apartmentRent: fetchJson('/api/feature/MarketData/GetRentPriceIndex', { propertyType: 'apartment', language: 'en' }),
    villaRent: fetchJson('/api/feature/MarketData/GetRentPriceIndex', { propertyType: 'villa', language: 'en' }),
    recentSales: fetchJson('/api/feature/MarketData/RecentSales', {
      page: 0,
      size: 100,
      fromDate: iso(from),
      toDate: iso(now),
      language: 'en'
    }),
    transactionSeries: fetchJson('/api/feature/MarketData/TotalTransactionsByType', {
      txnType: 'all',
      assetClass: 'all',
      statisticTimeAggregation: 'monthly',
      statisticDescription: 'value',
      language: 'en'
    }),
    salesByAsset: fetchJson('/api/feature/MarketData/GetTotalSalesByAsset', {
      assetClass: 'all',
      area: 'all',
      statisticTimeAggregation: 'monthly',
      statisticDescription: 'value',
      language: 'en'
    })
  };

  const names = Object.keys(requests);
  const settled = await Promise.allSettled(Object.values(requests));
  const data = {};
  const errors = {};
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') data[names[index]] = unwrap(result.value);
    else errors[names[index]] = result.reason instanceof Error ? result.reason.message : String(result.reason);
  });

  try {
    const tv = data.transactionValue || {};
    const volume = data.transactionVolume || {};
    const apartmentSale = data.apartmentSale || {};
    const villaSale = data.villaSale || {};
    const rented = data.rentedUnits || {};
    const apartmentRent = data.apartmentRent || {};
    const villaRent = data.villaRent || {};

    const metrics = {
      transactionValue: metric(tv.txn_value_aed, tv.value_yoy_change),
      transactionVolume: metric(volume.txn_volume, volume.volume_yoy_change),
      apartmentSaleIndex: metric(apartmentSale.sale_index_value, apartmentSale.index_yoy_change),
      villaSaleIndex: metric(villaSale.sale_index_value, villaSale.index_yoy_change),
      rentedUnits: metric(rented.rented_units, rented.rented_units_yoy_change),
      apartmentRentIndex: metric(apartmentRent.rent_index_value, apartmentRent.index_yoy_change),
      villaRentIndex: metric(villaRent.rent_index_value, villaRent.index_yoy_change)
    };

    const recent = data.recentSales || {};
    const recentRows = Array.isArray(recent.content)
      ? recent.content.map(compactSale)
      : Array.isArray(recent)
        ? recent.map(compactSale)
        : [];

    const availableMetrics = Object.values(metrics).filter(Boolean).length;
    if (!availableMetrics) throw new Error('ADREC public JSON endpoints returned no usable headline metrics');

    const payload = {
      ok: true,
      source: 'Abu Dhabi Real Estate Centre',
      sourceUrl: SOURCE_URL,
      officialDashboardUrl: SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      updateFrequency: 'Daily and automatic according to ADREC',
      period: 'Headline cards cover the last 12 months',
      metrics,
      recentSales: {
        from: iso(from),
        to: iso(now),
        total: number(recent.totalElements) || recentRows.length,
        rows: recentRows
      },
      transactionSeries: Array.isArray(data.transactionSeries) ? data.transactionSeries : [],
      salesByAsset: Array.isArray(data.salesByAsset) ? data.salesByAsset : [],
      partialErrors: errors
    };

    const response = responseJson(payload);
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return responseJson({
      ok: false,
      source: 'Abu Dhabi Real Estate Centre',
      sourceUrl: SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      error: 'The official Abu Dhabi public JSON data could not be retrieved at this moment.',
      detail: error instanceof Error ? error.message : String(error),
      partialErrors: errors
    }, 502);
  }
}
