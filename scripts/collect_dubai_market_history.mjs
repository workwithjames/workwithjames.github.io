import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data', 'dubai-market');
const HISTORY_DIR = path.join(DATA_DIR, 'history');
const DUBAI_PAGE = path.join(ROOT, 'dubai-data', 'index.html');
const ENDPOINT = 'https://dxbdata.io/mcp';
const ASSET_TAG = '<script defer src="/assets/dubai-market-history.js?v=1"></script>';
const TYPES = ['Flat', 'Villa'];
const WINDOWS = [7, 30, 90];
const MAX_AREAS = 50;
const SERIES_DAYS = 120;
const PREFERRED = [
  'Business Bay','Burj Khalifa','Marsa Dubai','Al Barsha South Fourth',
  'Hadaeq Sheikh Mohammed Bin Rashid',"Me'Aisem First",'Al Hebiah First',
  'Al Hebiah Second','Al Thanyah Third','Al Barsha South Fifth','Al Merkadh',
  'Nadd Hessa','Madinat Al Mataar','Jabal Ali First','Wadi Al Safa 4',
  'Al Yelayiss 2','Dubai Investment Park First'
];

let requestId = 200;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const cleanNumber = value => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10000) / 10000 : null;
};
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
};
const parseDate = value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
};

async function callTool(name, args = {}, retries = 3) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'user-agent': 'James-Realty-Dubai-Market-History/1.0'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: ++requestId,
          method: 'tools/call',
          params: { name, arguments: args }
        }),
        signal: AbortSignal.timeout(30000)
      });
      if (!response.ok) throw new Error(`${name} returned HTTP ${response.status}`);
      const raw = await response.text();
      let envelope;
      try {
        envelope = JSON.parse(raw);
      } catch {
        const dataLines = raw.split('\n').filter(line => line.startsWith('data:'));
        for (const line of dataLines) {
          try { envelope = JSON.parse(line.slice(5).trim()); } catch {}
        }
      }
      if (!envelope) throw new Error(`${name} returned unreadable MCP data`);
      if (envelope.error) throw new Error(envelope.error.message || `${name} MCP error`);
      const text = envelope.result?.content?.[0]?.text;
      if (!text) throw new Error(`${name} returned no tool payload`);
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      if (attempt + 1 < retries) await sleep(1200 * (2 ** attempt));
    }
  }
  throw lastError;
}

async function rank(type) {
  for (const limit of [100, 50, 25]) {
    try { return await callTool('rank_areas_by_yield', { property_type: type, limit }); }
    catch {}
  }
  return { property_type: type, ranking: [] };
}

function chooseAreas(available, overview, rankings) {
  const allowed = new Set(available);
  const chosen = [];
  const add = area => {
    if (allowed.has(area) && !chosen.includes(area) && chosen.length < MAX_AREAS) chosen.push(area);
  };
  PREFERRED.forEach(add);
  (overview.top_areas_by_volume || []).forEach(row => add(String(row.area || '')));
  for (const type of TYPES) {
    for (const row of rankings[type].ranking || []) add(String(row.area || ''));
  }
  return chosen;
}

function normalize(row, type, rankRow = {}) {
  return {
    area: String(row.area || rankRow.area || '').trim(),
    property_type: type,
    median_price_aed: cleanNumber(row.median_price_aed),
    median_price_per_sqm_aed: cleanNumber(row.median_price_per_sqm_aed ?? rankRow.median_price_per_sqm_aed),
    gross_rental_yield_pct: cleanNumber(row.gross_rental_yield_pct ?? rankRow.gross_rental_yield_pct),
    annual_rent_per_sqm_aed: cleanNumber(row.annual_rent_per_sqm_aed ?? rankRow.annual_rent_per_sqm_aed),
    sample_size: cleanNumber(row.sample_size ?? rankRow.sale_sample),
    sale_sample: cleanNumber(row.sale_sample ?? rankRow.sale_sample ?? row.sample_size),
    rent_sample: cleanNumber(row.rent_sample ?? rankRow.rent_sample)
  };
}

async function singleArea(area, type, rankRow) {
  const snapshot = await callTool('area_snapshot', { area, property_type: type });
  let rental = {};
  try { rental = await callTool('rental_yield', { area, property_type: type }); } catch {}
  return normalize({ ...snapshot, ...rental }, type, rankRow);
}

async function areaRows(areas, type, ranking) {
  const rankMap = new Map((ranking.ranking || []).map(row => [String(row.area || ''), row]));
  const output = new Map();
  for (let i = 0; i < areas.length; i += 8) {
    const batch = areas.slice(i, i + 8);
    let missing = [...batch];
    if (batch.length > 1) {
      try {
        const compared = await callTool('compare_areas', { areas: batch, property_type: type });
        const returned = compared.areas || [];
        const seen = new Set();
        for (const row of returned) {
          const area = String(row.area || '');
          if (!area) continue;
          seen.add(area);
          output.set(area, normalize(row, type, rankMap.get(area)));
        }
        missing = batch.filter(area => !seen.has(area));
      } catch (error) {
        console.warn(`compare_areas ${type} failed for batch: ${error.message}`);
      }
    }
    for (const area of missing) {
      try {
        output.set(area, await singleArea(area, type, rankMap.get(area)));
        await sleep(100);
      } catch (error) {
        console.warn(`${type} ${area}: ${error.message}`);
      }
    }
  }
  return [...output.values()].sort((a, b) => a.area.localeCompare(b.area));
}

function ensureHistoryScript() {
  const original = fs.readFileSync(DUBAI_PAGE, 'utf8');
  if (original.includes('/assets/dubai-market-history.js')) return false;
  if (!original.includes('</head>')) throw new Error('Dubai Data page has no closing head tag');
  fs.writeFileSync(DUBAI_PAGE, original.replace('</head>', `${ASSET_TAG}\n</head>`));
  return true;
}

function sourceDate(overview) {
  const value = String(overview.period?.to || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date())
    .filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  const today = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00Z`);
  today.setUTCDate(today.getUTCDate() - 1);
  return today.toISOString().slice(0, 10);
}

function stableSnapshot(snapshot) {
  const { captured_at, ...stable } = snapshot;
  return stable;
}

function writeSnapshot(snapshot) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
  const file = path.join(HISTORY_DIR, `${snapshot.source_date}.json`);
  if (fs.existsSync(file)) {
    const current = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (JSON.stringify(stableSnapshot(current)) === JSON.stringify(stableSnapshot(snapshot))) {
      return { file, changed: false };
    }
  }
  writeJson(file, snapshot);
  return { file, changed: true };
}

function loadHistory() {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
  return fs.readdirSync(HISTORY_DIR)
    .filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort()
    .map(name => JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, name), 'utf8')))
    .filter(snapshot => snapshot.source_date);
}

function pct(current, previous) {
  const a = cleanNumber(current), b = cleanNumber(previous);
  if (a === null || b === null || b === 0) return null;
  return Math.round((((a - b) / b) * 100) * 100) / 100;
}
function pp(current, previous) {
  const a = cleanNumber(current), b = cleanNumber(previous);
  if (a === null || b === null) return null;
  return Math.round((a - b) * 100) / 100;
}
function confidence(point) {
  const sale = cleanNumber(point.sale_sample ?? point.sample_size) || 0;
  const rent = cleanNumber(point.rent_sample);
  if (rent === null) return sale >= 150 ? 'Medium' : sale >= 40 ? 'Low' : 'Insufficient';
  if (sale >= 100 && rent >= 30) return 'High';
  if (sale >= 30 && rent >= 10) return 'Medium';
  if (sale >= 10 && rent >= 5) return 'Low';
  return 'Insufficient';
}

function previousPoint(points, date, days) {
  const target = new Date(date);
  target.setUTCDate(target.getUTCDate() - days);
  const tolerance = { 7: 3, 30: 5, 90: 8 }[days];
  let match = null;
  for (const point of points) {
    const pointDate = parseDate(point.date);
    if (pointDate && pointDate <= target) match = { point, pointDate };
  }
  if (!match || (target - match.pointDate) / 86400000 > tolerance) return null;
  return match.point;
}

function changes(points, current, metrics) {
  const currentDate = parseDate(current.date);
  if (!currentDate) return Object.fromEntries(WINDOWS.map(days => [`${days}d`, {}]));
  const output = {};
  for (const days of WINDOWS) {
    const old = previousPoint(points, currentDate, days);
    output[`${days}d`] = {};
    for (const [name, metric] of Object.entries(metrics)) {
      output[`${days}d`][name] = old
        ? (name.endsWith('_pp') ? pp(current[metric], old[metric]) : pct(current[metric], old[metric]))
        : null;
    }
  }
  return output;
}

function buildTrends(snapshots) {
  const generated = new Date().toISOString();
  if (!snapshots.length) return {
    schema_version: 1, generated_at: generated, history_start: null, snapshots: 0,
    windows: WINDOWS, market: null, areas: { Flat: {}, Villa: {} }
  };

  const marketSeries = [];
  const series = { Flat: {}, Villa: {} };
  for (const snapshot of snapshots) {
    const date = snapshot.source_date;
    marketSeries.push({
      date,
      total_transactions: cleanNumber(snapshot.overview?.total_transactions),
      areas: cleanNumber(snapshot.overview?.areas),
      median_sale_price_aed: cleanNumber(snapshot.overview?.median_sale_price_aed)
    });
    for (const type of TYPES) {
      for (const row of snapshot.areas?.[type] || []) {
        if (!row.area) continue;
        series[type][row.area] ||= [];
        series[type][row.area].push({
          date,
          median_price_aed: cleanNumber(row.median_price_aed),
          median_price_per_sqm_aed: cleanNumber(row.median_price_per_sqm_aed),
          gross_rental_yield_pct: cleanNumber(row.gross_rental_yield_pct),
          annual_rent_per_sqm_aed: cleanNumber(row.annual_rent_per_sqm_aed),
          sample_size: cleanNumber(row.sample_size),
          sale_sample: cleanNumber(row.sale_sample),
          rent_sample: cleanNumber(row.rent_sample)
        });
      }
    }
  }

  const currentMarket = marketSeries.at(-1);
  const market = {
    date: currentMarket.date,
    current: Object.fromEntries(Object.entries(currentMarket).filter(([key]) => key !== 'date')),
    changes: changes(marketSeries, currentMarket, {
      median_sale_price_aed_pct: 'median_sale_price_aed',
      total_transactions_pct: 'total_transactions'
    }),
    series: marketSeries.slice(-SERIES_DAYS)
  };

  const latestDate = snapshots.at(-1).source_date;
  const areas = { Flat: {}, Villa: {} };
  for (const type of TYPES) {
    for (const [area, points] of Object.entries(series[type])) {
      points.sort((a, b) => a.date.localeCompare(b.date));
      const current = points.at(-1);
      if (current.date !== latestDate) continue;
      areas[type][area] = {
        current: Object.fromEntries(Object.entries(current).filter(([key]) => key !== 'date')),
        confidence: confidence(current),
        changes: changes(points, current, {
          median_price_aed_pct: 'median_price_aed',
          median_price_per_sqm_aed_pct: 'median_price_per_sqm_aed',
          gross_rental_yield_pp: 'gross_rental_yield_pct',
          sample_size_pct: 'sample_size'
        }),
        series: points.slice(-SERIES_DAYS)
      };
    }
  }

  return {
    schema_version: 1,
    generated_at: generated,
    history_start: snapshots[0].source_date,
    latest_date: latestDate,
    snapshots: snapshots.length,
    windows: WINDOWS,
    market,
    areas,
    source: {
      provider: 'DXB Data',
      endpoint: ENDPOINT,
      upstream: 'Dubai Land Department open data and Ejari-derived records',
      authentication: 'none'
    }
  };
}

async function main() {
  console.log(`Historical UI asset link: ${ensureHistoryScript() ? 'added' : 'already present'}`);
  const [overview, areaList, flatRank, villaRank] = await Promise.all([
    callTool('market_overview'),
    callTool('list_areas'),
    rank('Flat'),
    rank('Villa')
  ]);
  const rankings = { Flat: flatRank, Villa: villaRank };
  const available = (areaList.areas || []).map(String).filter(Boolean);
  if (!available.length) throw new Error('DXB Data returned no Dubai areas');
  const selected = chooseAreas(available, overview, rankings);
  if (!selected.length) throw new Error('No usable areas selected from DXB Data');

  const areas = {};
  for (const type of TYPES) areas[type] = await areaRows(selected, type, rankings[type]);

  const snapshot = {
    schema_version: 1,
    source_date: sourceDate(overview),
    captured_at: new Date().toISOString(),
    source: {
      provider: 'DXB Data',
      endpoint: ENDPOINT,
      upstream: 'Dubai Land Department open data and Ejari-derived records',
      authentication: 'none'
    },
    overview,
    selected_area_count: selected.length,
    areas
  };

  const saved = writeSnapshot(snapshot);
  console.log(`Snapshot ${snapshot.source_date}: ${saved.changed ? 'written' : 'unchanged'}`);
  const history = loadHistory();
  writeJson(path.join(DATA_DIR, 'trends.json'), buildTrends(history));
  if (history.length) writeJson(path.join(DATA_DIR, 'latest.json'), history.at(-1));
  console.log(`History rebuilt from ${history.length} source-dated snapshot(s).`);
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
