import { onRequestGet as fetchPublicData } from './abu-dhabi-data.js';

const RANGES = {
  transactionValue: [1e9, 1e13],
  transactionVolume: [1000, 1e8],
  apartmentSaleIndex: [50, 500],
  villaSaleIndex: [50, 500],
  rentedUnits: [1000, 1e8],
  apartmentRentIndex: [50, 500],
  villaRentIndex: [50, 500],
  ytdTransactionValue: [1e8, 1e13],
  ytdSalesValue: [1e8, 1e13],
  ytdMortgageValue: [1e8, 1e13],
  ytdFdiValue: [1e6, 1e13]
};

function validate(metric, range) {
  if (!metric || typeof metric.value !== 'number' || !Number.isFinite(metric.value)) return null;
  if (metric.value < range[0] || metric.value > range[1]) return null;
  const yoy = typeof metric.yoy === 'number' && Number.isFinite(metric.yoy) && Math.abs(metric.yoy) <= 1000
    ? metric.yoy
    : null;
  return { ...metric, yoy };
}

function validateGroup(group, keys) {
  const source = group || {};
  const result = {};
  for (const key of keys) result[key] = validate(source[key], RANGES[key]);
  return result;
}

function countMetrics(group) {
  return Object.values(group).filter((metric) => metric && typeof metric.value === 'number').length;
}

export async function onRequestGet(context) {
  const baseResponse = await fetchPublicData(context);
  let payload;

  try {
    payload = await baseResponse.json();
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'The public Abu Dhabi data response could not be validated.',
      detail: error instanceof Error ? error.message : String(error)
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  const metrics = validateGroup(payload.metrics, [
    'transactionValue',
    'transactionVolume',
    'apartmentSaleIndex',
    'villaSaleIndex',
    'rentedUnits',
    'apartmentRentIndex',
    'villaRentIndex'
  ]);
  const marketPerformance = validateGroup(payload.marketPerformance, [
    'ytdTransactionValue',
    'ytdSalesValue',
    'ytdMortgageValue',
    'ytdFdiValue'
  ]);

  const available = countMetrics(metrics) + countMetrics(marketPerformance);
  const validated = {
    ...payload,
    ok: available > 0,
    metrics,
    marketPerformance,
    validation: 'Plausibility ranges applied to prevent unrelated page numbers from being displayed as market data.',
    warning: available >= 4
      ? payload.warning || null
      : 'Some official figures are currently rendered only inside ADREC interactive components. Missing cards are intentionally left unavailable rather than estimated.'
  };

  return new Response(JSON.stringify(validated), {
    status: validated.ok ? 200 : 206,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=21600',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
