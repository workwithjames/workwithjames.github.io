(function () {
  'use strict';

  var state = {
    sales: [],
    mortgages: [],
    latest: { year: 0, quarter: 0 },
    filters: { year: '', quarter: '', sector: '', unit: '', query: '' }
  };

  var els = {};

  function byId(id) { return document.getElementById(id); }
  function number(value) { return Number(value) || 0; }
  function sum(rows, key) { return rows.reduce(function (total, row) { return total + number(row[key]); }, 0); }
  function unique(rows, key) {
    return Array.from(new Set(rows.map(function (row) { return row[key]; }).filter(Boolean))).sort(function (a, b) {
      return String(a).localeCompare(String(b));
    });
  }
  function formatNumber(value) { return new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(number(value)); }
  function formatMoney(value) {
    var amount = number(value);
    if (amount >= 1000000000) return 'AED ' + (amount / 1000000000).toFixed(amount >= 10000000000 ? 1 : 2).replace(/\.00$/, '') + 'B';
    if (amount >= 1000000) return 'AED ' + (amount / 1000000).toFixed(amount >= 100000000 ? 1 : 2).replace(/\.00$/, '') + 'M';
    if (amount >= 1000) return 'AED ' + (amount / 1000).toFixed(amount >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return 'AED ' + formatNumber(amount);
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  function setStatus(message, status) {
    els.status.textContent = message;
    els.status.setAttribute('data-state', status || 'ready');
    els.statusLine.textContent = message;
  }

  function populateSelect(select, values, allLabel) {
    var current = select.value;
    select.innerHTML = '<option value="">' + escapeHtml(allLabel) + '</option>' + values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
    if (values.map(String).indexOf(String(current)) > -1) select.value = current;
  }

  function initialiseFilters() {
    var years = unique(state.sales, 'y').sort(function (a, b) { return b - a; });
    var quarters = unique(state.sales, 'q').sort(function (a, b) { return a - b; }).map(function (q) { return 'Q' + q; });
    populateSelect(els.year, years, 'All years');
    populateSelect(els.quarter, quarters, 'All quarters');
    populateSelect(els.sector, unique(state.sales, 's'), 'All sectors');
    populateSelect(els.unit, unique(state.sales, 'u'), 'All unit types');

    els.year.value = String(state.latest.year);
    els.quarter.value = 'Q' + state.latest.quarter;
    state.filters.year = els.year.value;
    state.filters.quarter = els.quarter.value;
  }

  function matchesBase(row) {
    var query = state.filters.query.toLowerCase();
    return (!state.filters.sector || row.s === state.filters.sector) &&
      (!state.filters.unit || row.u === state.filters.unit) &&
      (!query || [row.p, row.d, row.s, row.u, row.r].join(' ').toLowerCase().indexOf(query) > -1);
  }

  function matchesPeriod(row) {
    return (!state.filters.year || String(row.y) === state.filters.year) &&
      (!state.filters.quarter || 'Q' + row.q === state.filters.quarter);
  }

  function filtered(rows) { return rows.filter(function (row) { return matchesBase(row) && matchesPeriod(row); }); }

  function aggregate(rows, key) {
    var map = {};
    rows.forEach(function (row) {
      var label = row[key] || 'Unknown';
      if (!map[label]) map[label] = { label: label, value: 0, count: 0, max: 0 };
      map[label].value += number(row.v);
      map[label].count += number(row.c);
      map[label].max = Math.max(map[label].max, number(row.m));
    });
    return Object.keys(map).map(function (keyName) { return map[keyName]; }).sort(function (a, b) { return b.value - a.value; });
  }

  function updateKpis(salesRows, mortgageRows) {
    var value = sum(salesRows, 'v');
    var count = sum(salesRows, 'c');
    var maxValue = salesRows.reduce(function (highest, row) { return Math.max(highest, number(row.m)); }, 0);
    var mortgageValue = sum(mortgageRows, 'v');
    var mortgageCount = sum(mortgageRows, 'c');

    els.salesValue.textContent = formatMoney(value);
    els.salesCount.textContent = formatNumber(count);
    els.averageValue.textContent = count ? formatMoney(value / count) : 'No data';
    els.maxValue.textContent = maxValue ? formatMoney(maxValue) : 'No data';
    els.mortgageValue.textContent = formatMoney(mortgageValue);
    els.mortgageCount.textContent = formatNumber(mortgageCount) + ' mortgage transactions';
    els.resultCount.textContent = formatNumber(salesRows.length) + ' aggregated government records match the filters.';
  }

  function renderTrend() {
    var rows = state.sales.filter(matchesBase);
    var trend = {};
    rows.forEach(function (row) {
      var key = row.y + '-Q' + row.q;
      if (!trend[key]) trend[key] = { label: 'Q' + row.q + ' ' + row.y, year: row.y, quarter: row.q, value: 0, count: 0 };
      trend[key].value += number(row.v);
      trend[key].count += number(row.c);
    });
    var points = Object.keys(trend).map(function (key) { return trend[key]; }).sort(function (a, b) {
      return a.year === b.year ? a.quarter - b.quarter : a.year - b.year;
    }).slice(-20);

    if (!points.length) {
      els.trend.innerHTML = '<p class="ajman-empty">No trend data matches the current filters.</p>';
      return;
    }

    var width = 900, height = 280, padX = 48, padY = 28;
    var max = Math.max.apply(Math, points.map(function (point) { return point.value; })) || 1;
    var min = Math.min.apply(Math, points.map(function (point) { return point.value; }));
    var range = Math.max(1, max - min);
    var step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
    var coords = points.map(function (point, index) {
      var x = padX + index * step;
      var y = height - padY - ((point.value - min) / range) * (height - padY * 2);
      return { x: x, y: y, point: point };
    });
    var polyline = coords.map(function (item) { return item.x.toFixed(1) + ',' + item.y.toFixed(1); }).join(' ');
    var labels = coords.filter(function (_, index) { return index === 0 || index === coords.length - 1 || index % Math.ceil(coords.length / 5) === 0; }).map(function (item) {
      return '<text x="' + item.x.toFixed(1) + '" y="267" text-anchor="middle">' + escapeHtml(item.point.label.replace(' ', '\u00a0')) + '</text>';
    }).join('');
    var circles = coords.map(function (item) {
      return '<circle cx="' + item.x.toFixed(1) + '" cy="' + item.y.toFixed(1) + '" r="5"><title>' + escapeHtml(item.point.label + ': ' + formatMoney(item.point.value) + ', ' + formatNumber(item.point.count) + ' sales') + '</title></circle>';
    }).join('');

    els.trend.innerHTML = '<svg class="ajman-trend-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Ajman sales value by quarter"><line x1="48" y1="252" x2="852" y2="252"></line><polyline points="' + polyline + '"></polyline>' + circles + labels + '</svg>';
  }

  function renderBars(container, data, valueLabel) {
    if (!data.length) {
      container.innerHTML = '<p class="ajman-empty">No results match the current filters.</p>';
      return;
    }
    var max = data[0].value || 1;
    container.innerHTML = data.slice(0, 8).map(function (item, index) {
      var width = Math.max(3, (item.value / max) * 100);
      return '<article class="ajman-rank-row"><span class="ajman-rank">' + (index + 1) + '</span><div><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(valueLabel(item)) + '</span><i style="width:' + width.toFixed(1) + '%"></i></div></article>';
    }).join('');
  }

  function renderUnitMix(rows) {
    var data = aggregate(rows, 'u');
    var total = sum(rows, 'v') || 1;
    if (!data.length) {
      els.unitMix.innerHTML = '<p class="ajman-empty">No unit-type data matches the current filters.</p>';
      return;
    }
    els.unitMix.innerHTML = data.slice(0, 6).map(function (item) {
      var share = (item.value / total) * 100;
      return '<article><span>' + escapeHtml(item.label) + '</span><strong>' + formatMoney(item.value) + '</strong><small>' + share.toFixed(1) + '% of value, ' + formatNumber(item.count) + ' sales</small><i><b style="width:' + Math.max(2, share).toFixed(1) + '%"></b></i></article>';
    }).join('');
  }

  function renderProjectTable(rows) {
    var data = aggregate(rows, 'p').slice(0, 12);
    if (!data.length) {
      els.projects.innerHTML = '<tr><td colspan="5">No project records match the current filters.</td></tr>';
      return;
    }
    els.projects.innerHTML = data.map(function (item, index) {
      return '<tr><td>' + (index + 1) + '</td><td><strong>' + escapeHtml(item.label) + '</strong></td><td>' + formatMoney(item.value) + '</td><td>' + formatNumber(item.count) + '</td><td>' + formatMoney(item.count ? item.value / item.count : 0) + '</td></tr>';
    }).join('');
  }

  function render() {
    var salesRows = filtered(state.sales);
    var mortgageRows = filtered(state.mortgages);
    updateKpis(salesRows, mortgageRows);
    renderTrend();
    renderBars(els.districts, aggregate(salesRows, 'd'), function (item) { return formatMoney(item.value) + ', ' + formatNumber(item.count) + ' sales'; });
    renderBars(els.sectors, aggregate(salesRows, 's'), function (item) { return formatMoney(item.value) + ', ' + formatNumber(item.count) + ' sales'; });
    renderUnitMix(salesRows);
    renderProjectTable(salesRows);
    els.period.textContent = state.filters.year || state.filters.quarter ? [state.filters.quarter, state.filters.year].filter(Boolean).join(' ') : 'All published periods';
  }

  function bindFilters() {
    [els.year, els.quarter, els.sector, els.unit].forEach(function (select) {
      select.addEventListener('change', function () {
        state.filters[select.dataset.filter] = select.value;
        render();
      });
    });
    var timer;
    els.query.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.filters.query = els.query.value.trim();
        render();
      }, 180);
    });
    els.reset.addEventListener('click', function () {
      els.year.value = String(state.latest.year);
      els.quarter.value = 'Q' + state.latest.quarter;
      els.sector.value = '';
      els.unit.value = '';
      els.query.value = '';
      state.filters = { year: els.year.value, quarter: els.quarter.value, sector: '', unit: '', query: '' };
      render();
    });
  }

  async function load() {
    try {
      var response = await fetch('/api/ajman-data', { headers: { Accept: 'application/json' } });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Data request failed');

      state.sales = data.sales || [];
      state.mortgages = data.mortgages || [];
      state.latest = data.latest || { year: 0, quarter: 0 };
      initialiseFilters();
      bindFilters();
      render();
      var checked = new Date(data.fetchedAt);
      var checkedText = checked.toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai' });
      els.checked.textContent = 'Government data checked ' + checkedText + ' UAE time';
      setStatus('Connected to Ajman Data', 'ready');
      document.body.classList.add('ajman-data-ready');
    } catch (error) {
      setStatus('Official data temporarily unavailable', 'error');
      els.error.hidden = false;
      els.errorMessage.textContent = error && error.message ? error.message : 'The data source could not be loaded.';
    }
  }

  function init() {
    els = {
      status: byId('ajman-live-status'), statusLine: byId('ajman-status-line'), checked: byId('ajman-checked'),
      year: byId('ajman-year'), quarter: byId('ajman-quarter'), sector: byId('ajman-sector'), unit: byId('ajman-unit'), query: byId('ajman-query'), reset: byId('ajman-reset'),
      salesValue: byId('ajman-sales-value'), salesCount: byId('ajman-sales-count'), averageValue: byId('ajman-average-value'), maxValue: byId('ajman-max-value'), mortgageValue: byId('ajman-mortgage-value'), mortgageCount: byId('ajman-mortgage-count'), resultCount: byId('ajman-result-count'), period: byId('ajman-period'),
      trend: byId('ajman-trend'), districts: byId('ajman-districts'), sectors: byId('ajman-sectors'), unitMix: byId('ajman-unit-mix'), projects: byId('ajman-project-rows'),
      error: byId('ajman-error'), errorMessage: byId('ajman-error-message')
    };
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
