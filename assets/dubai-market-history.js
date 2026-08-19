(() => {
  'use strict';

  if (location.pathname !== '/dubai-data/' && location.pathname !== '/dubai-data') return;

  const TRENDS_URL = '/data/dubai-market/trends.json';
  const STYLE = `
    .jr-history-panel{margin-top:24px;padding:24px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:linear-gradient(135deg,rgba(255,255,255,.055),rgba(255,255,255,.018));box-shadow:0 20px 50px rgba(0,0,0,.12)}
    .jr-history-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:18px}
    .jr-history-head p{margin:0;color:var(--muted,#9ea2b3)}
    .jr-history-head h3{margin:.3rem 0 0;font-size:clamp(1.35rem,2.4vw,2rem)}
    .jr-history-meta{font-size:.75rem;text-align:right;color:var(--muted,#9ea2b3)}
    .jr-history-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .jr-history-stat{padding:16px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(0,0,0,.12)}
    .jr-history-stat span{display:block;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#9ea2b3)}
    .jr-history-stat strong{display:block;margin-top:8px;font-size:1.15rem}
    .jr-history-stat small{display:block;margin-top:5px;color:var(--muted,#9ea2b3)}
    .jr-trend-positive{color:#61c995}.jr-trend-negative{color:#ff8f8f}.jr-trend-neutral{color:inherit}
    .jr-history-spark{width:100%;height:58px;margin-top:16px;display:block}
    .jr-history-spark polyline{fill:none;stroke:currentColor;stroke-width:2;vector-effect:non-scaling-stroke}
    .jr-history-spark .jr-history-base{stroke:rgba(255,255,255,.14);stroke-width:1}
    .jr-area-history{margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,.12)}
    .jr-area-history__head{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:12px}
    .jr-area-history__head strong{font-size:.92rem}
    .jr-area-history__head span{font-size:.72rem;color:var(--muted,#9ea2b3)}
    .jr-area-history__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .jr-area-history__grid div{padding:12px;border-radius:13px;background:rgba(255,255,255,.04)}
    .jr-area-history__grid span{display:block;font-size:.62rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#9ea2b3)}
    .jr-area-history__grid strong{display:block;margin-top:5px;font-size:.92rem}
    .jr-confidence{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);font-size:.62rem;line-height:1}
    .jr-compare-history{display:block;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.1);font-size:.72rem;color:var(--muted,#9ea2b3)}
    .jr-yield-confidence{display:inline-flex;margin-top:5px;padding:3px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.12);font-size:.56rem;font-weight:600;color:var(--muted,#9ea2b3)}
    @media(max-width:820px){.jr-history-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jr-area-history__grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jr-history-head{align-items:flex-start;flex-direction:column}.jr-history-meta{text-align:left}}
    @media(max-width:520px){.jr-history-panel{padding:18px}.jr-history-grid{grid-template-columns:1fr 1fr}.jr-history-stat{padding:13px}.jr-history-stat strong{font-size:1rem}}
  `;

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function injectStyle() {
    if (q('style[data-dubai-history]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-dubai-history', '');
    style.textContent = STYLE;
    document.head.append(style);
  }

  function fmtDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00Z`);
    return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  function fmtPct(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Building history';
    const n = Number(value);
    return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
  }

  function fmtPp(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Building history';
    const n = Number(value);
    return `${n > 0 ? '+' : ''}${n.toFixed(2)} pp`;
  }

  function trendClass(value) {
    if (value === null || value === undefined || Number(value) === 0) return 'jr-trend-neutral';
    return Number(value) > 0 ? 'jr-trend-positive' : 'jr-trend-negative';
  }

  function sparkline(points, metric) {
    const values = (points || [])
      .map(point => Number(point[metric]))
      .filter(value => Number.isFinite(value) && value > 0);
    if (values.length < 2) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = Math.max(max - min, Math.abs(max) * 0.01, 1);
    const coords = values.map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 52 - ((value - min) / spread) * 44;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

    return `<svg class="jr-history-spark" viewBox="0 0 100 58" preserveAspectRatio="none" aria-hidden="true"><line class="jr-history-base" x1="0" y1="52" x2="100" y2="52"></line><polyline points="${coords}"></polyline></svg>`;
  }

  function renderMarketHistory(data) {
    const market = data.market;
    const stats = q('.market-overview .market-stats');
    if (!market || !stats || q('#market-history-panel')) return;

    const changes = market.changes || {};
    const get = days => changes[`${days}d`]?.median_sale_price_aed_pct ?? null;
    const panel = document.createElement('div');
    panel.className = 'jr-history-panel';
    panel.id = 'market-history-panel';
    panel.innerHTML = `
      <div class="jr-history-head">
        <div>
          <p class="section-kicker">James Realty historical layer</p>
          <h3>Dubai market momentum</h3>
        </div>
        <div class="jr-history-meta">${data.snapshots} stored source snapshot${data.snapshots === 1 ? '' : 's'}<br>${data.history_start ? `History from ${fmtDate(data.history_start)}` : 'History collection is starting'}</div>
      </div>
      <div class="jr-history-grid">
        ${[7, 30, 90].map(days => {
          const value = get(days);
          return `<div class="jr-history-stat"><span>${days} day median price</span><strong class="${trendClass(value)}">${fmtPct(value)}</strong><small>Change in citywide median</small></div>`;
        }).join('')}
        <div class="jr-history-stat"><span>Stored coverage</span><strong>${data.snapshots}</strong><small>Source-dated observations</small></div>
      </div>
      ${sparkline(market.series, 'median_sale_price_aed')}
    `;
    stats.insertAdjacentElement('afterend', panel);
  }

  function areaEntry(data, area, propertyType) {
    return data.areas?.[propertyType]?.[area] || null;
  }

  function renderAreaHistory(data) {
    const box = q('#area-result');
    if (!box || box.hidden) return;

    const area = q('.market-result-heading h3', box)?.textContent?.trim();
    const propertyType = q('#market-area-type')?.value || 'Flat';
    if (!area) return;

    const existing = q('.jr-area-history', box);
    if (existing?.dataset.area === area && existing?.dataset.type === propertyType) return;
    existing?.remove();

    const entry = areaEntry(data, area, propertyType);
    if (!entry) return;

    const history = document.createElement('div');
    history.className = 'jr-area-history';
    history.dataset.area = area;
    history.dataset.type = propertyType;

    const change = days => entry.changes?.[`${days}d`]?.median_price_per_sqm_aed_pct ?? null;
    const yieldChange = entry.changes?.['30d']?.gross_rental_yield_pp ?? null;
    history.innerHTML = `
      <div class="jr-area-history__head">
        <strong>Historical momentum</strong>
        <span class="jr-confidence">Data confidence: ${entry.confidence || 'Insufficient'}</span>
      </div>
      <div class="jr-area-history__grid">
        ${[7, 30, 90].map(days => {
          const value = change(days);
          return `<div><span>${days} day price/m²</span><strong class="${trendClass(value)}">${fmtPct(value)}</strong></div>`;
        }).join('')}
        <div><span>30 day yield move</span><strong class="${trendClass(yieldChange)}">${fmtPp(yieldChange)}</strong></div>
      </div>
      ${sparkline(entry.series, 'median_price_per_sqm_aed')}
    `;
    box.append(history);
  }

  function renderComparisonHistory(data) {
    const propertyType = q('#compare-property-type')?.value || 'Flat';
    qa('#comparison-results .comparison-card').forEach(card => {
      if (q('.jr-compare-history', card)) return;
      const area = q('h3', card)?.textContent?.trim();
      const entry = area && areaEntry(data, area, propertyType);
      if (!entry) return;
      const value = entry.changes?.['30d']?.median_price_per_sqm_aed_pct ?? null;
      const note = document.createElement('span');
      note.className = 'jr-compare-history';
      note.innerHTML = `30 day price/m²: <strong class="${trendClass(value)}">${fmtPct(value)}</strong> · confidence ${entry.confidence || 'Insufficient'}`;
      card.append(note);
    });
  }

  function renderYieldConfidence(data) {
    const propertyType = q('[data-yield-type].is-active')?.dataset.yieldType || 'Flat';
    qa('#yield-table-body tr').forEach(row => {
      if (q('.jr-yield-confidence', row)) return;
      const area = q('td strong', row)?.textContent?.trim();
      const entry = area && areaEntry(data, area, propertyType);
      if (!entry) return;
      const badge = document.createElement('span');
      badge.className = 'jr-yield-confidence';
      badge.textContent = `${entry.confidence || 'Insufficient'} data confidence`;
      q('td', row)?.append(badge);
    });
  }

  function observe(data) {
    const areaResult = q('#area-result');
    if (areaResult) {
      new MutationObserver(() => renderAreaHistory(data)).observe(areaResult, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden'],
      });
    }

    const comparison = q('#comparison-results');
    if (comparison) {
      new MutationObserver(() => renderComparisonHistory(data)).observe(comparison, {
        childList: true,
        subtree: true,
      });
    }

    const yields = q('#yield-table-body');
    if (yields) {
      new MutationObserver(() => renderYieldConfidence(data)).observe(yields, {
        childList: true,
        subtree: true,
      });
    }

    q('#market-area-type')?.addEventListener('change', () => {
      q('.jr-area-history', q('#area-result'))?.remove();
      setTimeout(() => renderAreaHistory(data), 80);
    });
    q('#compare-property-type')?.addEventListener('change', () => {
      qa('#comparison-results .jr-compare-history').forEach(node => node.remove());
      setTimeout(() => renderComparisonHistory(data), 80);
    });
    qa('[data-yield-type]').forEach(button => button.addEventListener('click', () => {
      setTimeout(() => {
        qa('#yield-table-body .jr-yield-confidence').forEach(node => node.remove());
        renderYieldConfidence(data);
      }, 120);
    }));
  }

  async function boot() {
    injectStyle();
    try {
      const response = await fetch(`${TRENDS_URL}?v=${Date.now()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-cache',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || !data.market) return;

      renderMarketHistory(data);
      renderAreaHistory(data);
      renderComparisonHistory(data);
      renderYieldConfidence(data);
      observe(data);
    } catch (_error) {
      // The live dashboard continues to work even if the optional history layer is unavailable.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
