const AJMAN_API = 'https://data.ajman.ae/api/explore/v2.1/catalog/datasets';
const SALES_DATASET = 'real-estate-units-sales';
const MORTGAGE_DATASET = 'real-estate-units-mortgage';
const CACHE_SECONDS = 43200;

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

function normalizeHeader(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function csvToObjects(text) {
  const rows = parseCsv(text, detectDelimiter(text));
  if (!rows.length) return [];
  const headers = rows.shift().map(normalizeHeader);

  return rows.map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] === undefined ? '' : cells[index];
    });
    return record;
  });
}

function number(value) {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value, fallback = 'Unknown') {
  const cleaned = String(value ?? '').trim();
  return cleaned || fallback;
}

function compactSales(record) {
  return {
    p: text(record.project_name_english),
    s: text(record.sector_english),
    d: text(record.district_english),
    u: text(record.unit_type_english),
    r: text(record.rooms_count, 'Not stated'),
    v: number(record.total_sales_values_in_aed),
    c: number(record.sales_count),
    m: number(record.max_sales_values_in_aed),
    y: number(record.year),
    q: number(record.quarter)
  };
}

function compactMortgage(record) {
  return {
    p: text(record.project_name_english),
    s: text(record.sector_english),
    d: text(record.district_english),
    u: text(record.unit_type_english),
    r: text(record.rooms_count, 'Not stated'),
    v: number(record.total_mortgage_value_in_aed),
    c: number(record.mortgage_count),
    m: number(record.max_mortgage_value_in_aed),
    y: number(record.year),
    q: number(record.quarter)
  };
}

async function fetchCsv(dataset) {
  const url = new URL(`${AJMAN_API}/${dataset}/exports/csv`);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('timezone', 'Asia/Dubai');
  url.searchParams.set('use_labels', 'false');
  url.searchParams.set('delimiter', ';');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'text/csv, text/plain;q=0.9, */*;q=0.8',
      'User-Agent': 'JamesRealty-AjmanData/1.0'
    },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
  });

  if (!response.ok) {
    throw new Error(`Ajman Data export failed for ${dataset}: ${response.status}`);
  }

  return response.text();
}

function latestPeriod(rows) {
  return rows.reduce(
    (latest, row) => {
      if (row.y > latest.year || (row.y === latest.year && row.q > latest.quarter)) {
        return { year: row.y, quarter: row.q };
      }
      return latest;
    },
    { year: 0, quarter: 0 }
  );
}

function createJson(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=900, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/ajman-data?v=2', context.request.url).toString(), context.request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const [salesCsv, mortgageCsv] = await Promise.all([
      fetchCsv(SALES_DATASET),
      fetchCsv(MORTGAGE_DATASET)
    ]);

    const sales = csvToObjects(salesCsv)
      .map(compactSales)
      .filter((row) => row.y && row.q && (row.v || row.c));
    const mortgages = csvToObjects(mortgageCsv)
      .map(compactMortgage)
      .filter((row) => row.y && row.q && (row.v || row.c));

    if (!sales.length) throw new Error('Ajman sales dataset returned no usable records');

    const payload = {
      ok: true,
      source: 'Ajman Data, Department of Land and Real Estate Regulation',
      sourceUrl: 'https://data.ajman.ae/explore/dataset/real-estate-units-sales/?flg=en-gb',
      licence: 'CC BY 4.0',
      updateFrequency: 'Quarterly',
      fetchedAt: new Date().toISOString(),
      latest: latestPeriod(sales),
      sales,
      mortgages
    };

    const response = createJson(payload);
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return createJson(
      {
        ok: false,
        error: 'The Ajman government dataset could not be retrieved at this moment.',
        detail: error instanceof Error ? error.message : String(error),
        sourceUrl: 'https://data.ajman.ae/explore/dataset/real-estate-units-sales/?flg=en-gb'
      },
      502
    );
  }
}
