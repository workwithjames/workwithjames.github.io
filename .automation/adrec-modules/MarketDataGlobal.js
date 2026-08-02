// Global helpers for Market Data pages
(function(){
  window.MD = window.MD || {};

  // Config - this app now calls APIs directly (no base URL or auth required)
  window.MD.CONFIG = window.MD.CONFIG || {
    // Remove BASE_URL/AUTH_URL/BASIC_AUTH usage. Keep placeholders if other code expects them.
    ACCESS_TOKEN: null,
    TOKEN_INITIALIZED: true
  };

  // No auth/token initialization required anymore. Mark token as ready.
  window.MD.fetchAccessToken = async function() { return null; };
  window.MD.initializeAccessToken = async function() { window.MD.CONFIG.TOKEN_INITIALIZED = true; return true; };
  window.MD.waitForTokenReady = async function() { return true; };

  // ============ LANGUAGE DETECTION ============
  // Detects if page is in Arabic mode by checking dir="rtl" or lang attribute
  // Returns 'ar' for Arabic, 'en' for English
  window.MD.getLanguage = function() {
    // Check for dir="rtl" on html or any parent element
    if (document.documentElement.getAttribute('dir') === 'rtl') {
      return 'ar';
    }
    // Check lang attribute
    const lang = document.documentElement.getAttribute('lang') || '';
    if (lang.toLowerCase().startsWith('ar')) {
      return 'ar';
    }
    return 'en';
  };

  window.MD.formatValue = function(value) {
    if (typeof value !== 'number') return value;
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(0) + 'K';
    return value;
  };

  window.MD.cap = function(str) {
    return str ? str.toString().replace(/\b\w/g, c => c.toUpperCase()) : "";
  };

  // ============ FIELD LABEL TRANSLATION ============
  // Translates database field names to user-friendly labels in both English and Arabic
  // Supports underscore-separated field names like "cash_sales", "financed_sales", etc.
  window.MD.translateFieldLabel = function(fieldName) {
    const isArabic = window.MD.getLanguage?.() === 'ar';
    
    // Translation dictionary: field name -> { en: "English", ar: "العربية" }
    const translations = {
      'cash_sales': { en: 'Cash Sales', ar: 'مبيعات نقدية' },
      'financed_sales': { en: 'Financed Sales', ar: 'مبيعات ممولة' },
      'sales': { en: 'Sales', ar: 'مبيعات' },
      'mortgages': { en: 'Mortgages', ar: 'رهون' },
      'other': { en: 'Other', ar: 'أخرى' },
      'residential': { en: 'Residential', ar: 'سكني' },
      'commercial': { en: 'Commercial', ar: 'تجاري' },
      'apartment': { en: 'Apartment', ar: 'شقة' },
      'villa': { en: 'Villa', ar: 'فيلا' },
      'townhouse': { en: 'Townhouse', ar: 'تاونهاوس' },
      'duplex': { en: 'Duplex', ar: 'دوبلكس' },
      'penthouse': { en: 'Penthouse', ar: 'بنتهاوس' }
    };

    const key = (fieldName || '').toLowerCase().trim();
    if (translations[key]) {
      return isArabic ? translations[key].ar : translations[key].en;
    }

    // Fallback: convert underscore-separated to title case
    return fieldName
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  window.MD.getColor = function(type) {
    // Arabic to English mapping for field values
    const arabicToEnglish = {
      // Transaction Types
      "مبيعات": "sales",
      "رهون": "mortgages",
      "آخر": "other",
      // Asset Classes
      "سكني": "residential",
      "تجاري": "commercial",
      "أخرى": "other",
      // Property Types
      "شقة": "apartment",
      "دوپلكس": "duplex",
      "پنتهاوس": "penthouse",
      "تاونهاوس / ڨيلا شبه منفصلة": "townhouse / attached villa",
      "ڨيلا": "villa",
      "أرض سكنية أخرى": "other residential land",
      "أرض لتاونهاوس / ڨيلا شبه منفصلة": "townhouse / attached villa land",
      "أرض لڨيلا": "villa land",
      "أرض لمجمع سكني": "residential complex land",
      "أرض لمجمع سكني (سكن عمال)": "residential complex land workers",
      "مجمع سكني": "residential complex",
      "مجمع سكني (سكن عمال)": "residential complex workers"
    };

    const colors = {
      "sales": "#D5D1B3",
    "others": "#6C7281",
    "mortages": "#3E3957",
    "mortgages": "#3E3957",
    "residential": "#A4C89A",
    "commercial": "#3E3957",
    "other": "#6C7281",
    "ready": "#3E3957",
    "off-plan": "#D5D1B3",
    'cash_sales':"#3E3957",
    "financed_sales": "#D5D1B3",
    'apartment': '#D5D1B3',
    'apartment_rent': '#B6A86A',
    'duplex': '#3E3957',
    'duplex_rent': '#A4C89A',
    'penthouse': '#6C7281',
    'penthouse_rent': '#C4B5A3',
    'townhouse / attached villa': '#B6A86A',
    'townhouse / attached villa_rent': '#9DB98F',
    'villa': '#A4C89A',
    'villa_rent': '#8BA576',
    'other residential land': '#6C7281',
    'townhouse / attached villa land': '#B6A86A',
    'villa land': '#A4C89A',
    'residential complex land': '#A4C89A',
    'residential complex land workers': '#9DB98F',
    'residential complex': '#A4C89A',
    'residential complex workers': '#9DB98F'
    };
    try {
      let typeStr = (type || '').toString();
      
      // If type is in Arabic, convert to English
      if (arabicToEnglish[typeStr]) {
        typeStr = arabicToEnglish[typeStr];
      }
      
      return colors[typeStr.toLowerCase()] || '#999';
    } catch (e) { return '#999'; }
  };

  window.MD.getCheckedValues = function(containerId, className = 'filter-check') {
    try {
      return Array.from(document.querySelectorAll(`#${containerId} .${className}:checked`)).map(cb => cb.value);
    } catch (e) { return []; }
  };

  // ============ DEBOUNCE UTILITY ============
  // Prevents multiple API calls when filters change rapidly (e.g., clicking multiple checkboxes)
  // Returns a debounced version of the provided function that will only execute after 'delay' ms of inactivity
  window.MD.debounce = function(func, delay = 500) {
    let timeoutId = null;
    return function(...args) {
      // Clear previous timeout if user is still changing filters
      if (timeoutId) clearTimeout(timeoutId);
      // Set new timeout: API call will happen only after 'delay' ms with no filter changes
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        timeoutId = null;
      }, delay);
    };
  };

  

  window.MD.renderSimpleCheckbox = function(containerId, items, className = 'filter-check', onChangeFn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" class="${className}" value="${item}" checked> ${item}`;
      container.appendChild(label);
    });
    container.querySelectorAll('input').forEach(cb => {
      cb.addEventListener('change', onChangeFn || function(){ if (window.drawChart) window.drawChart(); });
    });
  };

  window.MD.renderSimpleRadio = function(containerId, options, defaultValue, onChangeFn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    options.forEach(opt => {
      const checked = opt === defaultValue ? 'checked' : '';
      const div = document.createElement('div');
      div.innerHTML = `<label><input type="radio" class="filter-check" name="${containerId}" value="${opt}" ${checked}> ${opt}</label>`;
      container.appendChild(div);
    });
    container.querySelectorAll(`input[name="${containerId}"]`).forEach(rb => rb.addEventListener('change', function(){ 
      if (onChangeFn) onChangeFn();
      else if (window.drawChart) window.drawChart(); 
    }));
  };

  window.MD.setupDropdownListeners = function() {
    ['txnDropdown', 'assetDropdown', 'metricDropdown', 'monthlyDropdown', 'txnDropdown_m', 'assetDropdown_m', 'metricDropdown_m', 'monthlyDropdown_m', 'assetTypeDropdown_txn', 'regionDropdown_txn', 'metricDropdown_txn', 'monthlyDropdown_txn2', 'assetTypeDropdown_txn_m', 'regionDropdown_txn_m', 'metricDropdown_txn_m', 'monthlyDropdown_txn2_m', 'ResiUnitDropdown', 'ResiUnitregionDropdown', 'ResiUnitLayoutDropdown', 'resiMonthlyDropdown', 'ResiUnitDropdown_m', 'ResiUnitregionDropdown_m', 'ResiUnitLayoutDropdown_m', 'resiMonthlyDropdown_m'].forEach(id => {
      const dropdown = document.getElementById(id);
      if (dropdown) {
        dropdown.addEventListener('click', function (e) {
          if (e.target.closest('.dropdown-header')) {
            this.classList.toggle('open');
          }
        });
      }
    });
  };

  window.MD.setupPeriodListener = function() {
    document.addEventListener('change', function (e) {
      if (e.target.name === 'statistiTimeFilter' || e.target.name === 'statistiTimeFilter_m') {
        if (window.currentPeriod !== undefined) window.currentPeriod = e.target.value.toLowerCase();
        const desktopHeader = document.querySelector('#monthlyDropdown .dropdown-header');
        if (desktopHeader) {
          desktopHeader.innerHTML = `${e.target.value} <span><img src="/adrec-assets/images/market-data/dropdown-arrow.svg"></span>`;
        }
        const mobileHeader = document.querySelector('#monthlyDropdown_m .dropdown-header');
        if (mobileHeader) {
          mobileHeader.innerHTML = `${e.target.value} <span><img src="/adrec-assets/images/market-data/dropdown-arrow.svg"></span>`;
        }
        if (window.drawChart) window.drawChart();
      }
    });
  };

  window.MD.fetchAPI = async function(endpoint, params = {}, accessToken) {
    try {
      // Direct API calls: endpoint can be absolute or root-relative (e.g. /api/feature/...)
      // Build URL relative to current origin when needed
      let url;
      if (/^https?:\/\//i.test(endpoint)) {
        url = new URL(endpoint);
      } else {
        url = new URL(endpoint, window.location.origin);
      }
      // Ignore any `payload` key passed in params — keep only query params
      Object.entries(params).forEach(([k, v]) => {
        if (!k) return;
        if (k.toString().toLowerCase() === 'payload') return; // remove payload only
        if (v !== undefined && v !== null) url.searchParams.append(k, v);
      });

      const res = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json'
        }
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Fetch Error:', err);
      return null;
    }
  };

  // Fetch-once helper to avoid duplicate network calls for identical endpoint+params
  window.MD._requestCache = window.MD._requestCache || {};
  window.MD.fetchOnce = function(endpoint, params = {}) {
    try {
      // Normalize params: sort keys so equivalent param objects with different
      // insertion orders produce the same cache key and avoid duplicate network calls.
      let normalized = params || {};
      if (normalized && typeof normalized === 'object' && !Array.isArray(normalized)) {
        const sortedKeys = Object.keys(normalized).sort();
        const obj = {};
        sortedKeys.forEach(k => { obj[k] = normalized[k]; });
        normalized = obj;
      }
      const key = endpoint + '::' + JSON.stringify(normalized || {});
      if (window.MD._requestCache[key]) return window.MD._requestCache[key];
      const p = (async () => {
        try {
          const res = await window.MD.fetchAPI(endpoint, params);
          return res;
        } catch (e) {
          // clear cache on error so retries are possible
          delete window.MD._requestCache[key];
          throw e;
        }
      })();
      window.MD._requestCache[key] = p;
      return p;
    } catch (e) {
      console.error('fetchOnce error', e);
      return window.MD.fetchAPI(endpoint, params);
    }
  };

  // Simple Tab Manager: register lazy loaders per tab and activate based on URL or clicks
  window.MD.TabManager = window.MD.TabManager || (function(){
    const loaders = {};
    const loaded = {};
    let currentActiveTab = null;

    function normalizeTab(t) {
      if (!t && t !== 0) return 'tab0';
      if (typeof t === 'number' || /^\d+$/.test(String(t))) return 'tab' + String(t);
      if (/^tab\d+$/.test(String(t))) return String(t);
      return String(t);
    }

    async function loadTab(tabId) {
      const id = normalizeTab(tabId);
      if (loaded[id]) return;
      loaded[id] = true;
      const fns = loaders[id] || [];
      if (!fns || fns.length === 0) return;
      // Run all registered loaders for this tab simultaneously so skeletons and
      // API calls start at the same time instead of one-after-another.
      const promises = fns.map(fn => {
        try {
          return Promise.resolve(fn());
        } catch (e) {
          return Promise.reject(e);
        }
      });
      // Await all, but log individual errors without rejecting the whole batch
      await Promise.all(promises.map(p => p.catch(e => { console.error('Tab loader error for', id, e); return null; })));
    }

    function registerTabLoader(tabId, fn) {
      const id = normalizeTab(tabId);
      loaders[id] = loaders[id] || [];
      loaders[id].push(fn);
      // If this tab is already active, run the newly-registered loader
      // immediately so scripts that register after the initial load still execute.
      try {
        if (currentActiveTab === id) {
          // If the tab has not yet been loaded, trigger the tab load which will
          // run all registered loaders once. This avoids running the same loader
          // twice (once here and once in loadTab).
          if (!loaded[id]) {
            // run the tab loaders now (loadTab will set loaded[id])
            loadTab(id);
          } else {
            // Tab was already loaded earlier; run this loader once immediately
            Promise.resolve(fn()).catch(e => console.error('Tab loader error for', id, e));
          }
        }
      } catch (e) { console.error('registerTabLoader run error', e); }
    }

    function setActiveTab(tabId) {
      const id = normalizeTab(tabId);
      currentActiveTab = id;
      // Kick off loading for the active tab
      loadTab(id);
    }

    function initFromLocation() {
      const params = new URLSearchParams(window.location.search);
      let tab = params.get('tab');
      if (!tab) {
        // fallback to data-tab on any .tabs button (first match)
        const btn = document.querySelector('.tabs [data-tab]');
        if (btn) tab = btn.getAttribute('data-tab');
      }
      const id = normalizeTab(tab || 'tab0');
      currentActiveTab = id;
      // load immediately if there are loaders
      setTimeout(() => loadTab(id), 10);

      // Optional: click handler for elements that declare data-tab to switch tabs
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab]');
        if (!btn) return;
        const t = btn.getAttribute('data-tab');
        if (!t) return;
        const nid = normalizeTab(t);
        // set active and load if necessary
        currentActiveTab = nid;
        loadTab(nid);
      });
    }

    return {
      registerTabLoader,
      loadTab,
      setActiveTab,
      initFromLocation,
      get currentActiveTab() { return currentActiveTab; }
    };
  })();

  // ============= LOOKUP FILTERS CACHE =============
  window.MD.lookupsCache = {};

  // Helper: Extract values from API response (handles both arrays and objects)
  window.MD.extractLookupValues = function(data, fieldName = 'name') {
    if (!data) return [];
    
    // If already an array of strings, return as-is
    if (Array.isArray(data) && typeof data[0] === 'string') {
      return data;
    }
    
    // If array of objects, extract the field
    if (Array.isArray(data) && typeof data[0] === 'object') {
      return data.map(item => item[fieldName] || item.name || item.value || item);
    }
    
    return [];
  };

  // Format a date-like string to year only (falls back to original input)
  window.MD.formatLabelYear = function(dateStr) {
    try {
      if (!dateStr && dateStr !== 0) return '';
      // Try native Date first
      const d = new Date(dateStr);
      if (!isNaN(d)) return String(d.getFullYear());

      // Fallback: extract a 4-digit year from common formats like "2025-01", "2025 - 01", "2025/01", or "01-2025"
      const m = String(dateStr).match(/(\d{4})/);
      if (m && m[1]) return m[1];

      return String(dateStr);
    } catch (e) {
      return String(dateStr);
    }
  };

  // Format period labels based on aggregation (monthly, quarterly, yearly)
  window.MD.formatPeriodLabel = function(dateStr, aggregation) {
    try {
      const agg = (aggregation || '').toString().toLowerCase();
      const s = String(dateStr || '');
      
      if (agg === 'monthly' || agg === 'month') {
        // Extract YYYY-MM format from various date string formats
        // Handles formats like "2025-01", "2025 01", "01-2025", "2025/01", etc.
        const monthMatch = s.match(/(\d{4})-(\d{1,2})/) || 
                          s.match(/(\d{4})[\/\s\-](\d{1,2})(?:[\/\s\-]|$)/);
        
        if (monthMatch) {
          const year = monthMatch[1];
          const month = String(monthMatch[2]).padStart(2, '0');
          return `${year}-${month}`;
        }
        
        // If no match found, try alternative formats like "01-2025"
        const altMatch = s.match(/(\d{1,2})-(\d{4})/);
        if (altMatch) {
          const month = String(altMatch[1]).padStart(2, '0');
          const year = altMatch[2];
          return `${year}-${month}`;
        }
        
        return s;
      }
      
      if (agg === 'quarterly' || agg === 'quarter') {
        // Try to extract explicit Q notation like '2025 Q1' or 'Q1 2025' or '2025Q1'
        const qMatch = s.match(/Q\s*([1-4])/i) || s.match(/(\d{4})\s*Q\s*([1-4])/i) || s.match(/(\d{4})Q([1-4])/i);
        const yMatch = s.match(/(\d{4})/);
        let year = yMatch ? yMatch[1] : null;
        let quarter = null;
        if (qMatch) {
          // qMatch may have different capture groups
          quarter = qMatch[1] || qMatch[2];
        }

        // If quarter not found, try to derive from month number
        if (!quarter) {
          const m = s.match(/-(\d{1,2})$/) || s.match(/\/(\d{1,2})$/) || s.match(/-(\d{1,2})-/) || s.match(/(\d{4})-(\d{1,2})/);
          if (m) {
            const month = parseInt(m[m.length - 1], 10);
            if (!isNaN(month)) quarter = String(Math.floor((month - 1) / 3) + 1);
          }
        }

        if (year && quarter) return `${year} Q${quarter}`;
        if (year) return year;
        return s;
      }

      // Yearly/default fallback: return year or formatted year string
      return window.MD.formatLabelYear(dateStr);
    } catch (e) {
      return String(dateStr);
    }
  };

  // Fetch single lookup filter by name
  window.MD.fetchLookup = async function(lookupName, params = {}, fieldName = 'name') {
    const cacheKey = lookupName + JSON.stringify(params);
    if (window.MD.lookupsCache[cacheKey]) return window.MD.lookupsCache[cacheKey];
    try {
      // For StatisticTimeAggregations and StatisticDescriptions, use 'value' field
      const actualFieldName = (lookupName === 'StatisticTimeAggregations' || lookupName === 'StatisticDescriptions') ? 'value' : fieldName;
      
      // New lookup endpoints are exposed under /api/feature/MarketData/{LookupName}
      const endpoint = `/api/feature/MarketData/${lookupName}`;
      // Add language parameter
      const enrichedParams = { ...params, language: this.getLanguage() };
      // Use fetchOnce so identical lookup requests are cached at network level
      const data = await this.fetchOnce(endpoint, enrichedParams);
      const values = this.extractLookupValues(data, actualFieldName);
      if (values && values.length > 0) {
        window.MD.lookupsCache[cacheKey] = values;
        return values;
      }
      return [];
    } catch (err) {
      console.error(`Lookup fetch error for ${lookupName}:`, err);
      return [];
    }
  };

  // Fetch multiple lookups in parallel
  window.MD.fetchMultipleLookups = async function(lookupNames) {
    const promises = lookupNames.map(name => {
      if (Array.isArray(name)) {
        // [name, params] or [name, params, fieldName]
        return this.fetchLookup(name[0], name[1] || {}, name[2] || 'name');
      }
      // just name
      return this.fetchLookup(name);
    });
    
    const results = await Promise.all(promises);
    const lookupMap = {};
    
    lookupNames.forEach((name, idx) => {
      const key = Array.isArray(name) ? name[0] : name;
      lookupMap[key] = results[idx];
    });
    
    return lookupMap;
  };

  // Clear cache if needed
  window.MD.clearLookupsCache = function() {
    window.MD.lookupsCache = {};
  };

  /* ===================== EXPORT CHARTS TO CSV ===================== */
  window.MD.exportChartToCSV = function({ chart, canvasId, filename } = {}) {
    try {
      // Resolve chart instance
      let c = chart || null;
      if (!c && canvasId && typeof Chart !== 'undefined') {
        // Chart.getChart works in Chart.js v3+
        try { c = Chart.getChart(canvasId) || Chart.getChart(document.getElementById(canvasId)); } catch (e) { /* ignore */ }
        if (!c && Chart.instances) {
          c = Object.values(Chart.instances).find(ch => ch && ch.canvas && ch.canvas.id === canvasId);
        }
      }

      // Fallback to common global chart variables - try multiple sources
      if (!c) {
        // Try by canvasId first
        if (canvasId === 'resiFinanceAssetsChart') {
          c = window.graph4?.chart;
        } else if (canvasId === 'resiSalesAssetsChart') {
          c = window.graph3?.chart;
        } else {
          c = window.chart || window.graph2?.chart || window.graph3?.chart || window.graph4?.chart || window.salePricesOverTime?.chart || window.salePriceIndices?.saleChart || window.rentPriceIndices?.rentChart || window.avgChart?.chart || window.leaseGraph1?.chart || window.leaseGraph2?.chart || null;
        }
      }

      if (!c || !c.data) return console.warn('No chart instance found to export');

      const labels = c.data.labels || [];
      const datasets = c.data.datasets || [];

      const header = ['Date'].concat(datasets.map(ds => ds.label || 'Series')).join(',');
      let csv = header + '\n';

      labels.forEach((label, i) => {
        const row = [label];
        datasets.forEach(ds => {
          // handle different dataset data shapes
          const v = Array.isArray(ds.data) ? (ds.data[i] != null ? ds.data[i] : '') : (ds.data?.[i] ?? '');
          row.push(typeof v === 'object' ? JSON.stringify(v) : v);
        });
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || 'chart_data.csv';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
    } catch (err) {
      console.error('exportChartToCSV error', err);
    }
  };

  // Map export button IDs to canvas IDs (desktop + mobile)
  window.MD._exportButtonMap = window.MD._exportButtonMap || {
    exportBtnTransactionDesktop: { canvasId: 'totalTransactionChart', filename: 'total_transactions.csv' },
    exportBtnTransactionMobile: { canvasId: 'totalTransactionChart', filename: 'total_transactions.csv' },
    exportBtnAssetsDesktop: { canvasId: 'salesAssetsChart', filename: 'sales_by_asset.csv' },
    exportBtnAssetsMobile: { canvasId: 'salesAssetsChart', filename: 'sales_by_asset.csv' },
    exportBtnResiSalesDesktop: { canvasId: 'resiSalesAssetsChart', filename: 'resi_sales_by_period.csv' },
    exportBtnResiSalesMobile: { canvasId: 'resiSalesAssetsChart', filename: 'resi_sales_by_period.csv' },
    exportBtnResiFinanceDesktop: { canvasId: 'resiFinanceAssetsChart', filename: 'resi_sales_finance.csv' },
    exportBtnResiFinanceMobile: { canvasId: 'resiFinanceAssetsChart', filename: 'resi_sales_finance.csv' },
    exportBtnLeaseDesktop: { canvasId: 'leaseResidentialChart', filename: 'lease_residential.csv' },
    exportBtnLeaseMobile: { canvasId: 'leaseResidentialChart', filename: 'lease_residential.csv' },
    exportBtnLeasePriceDesktop: { canvasId: 'leaseResidentialPriceChart', filename: 'lease_price_by_period.csv' },
    exportBtnLeasePriceMobile: { canvasId: 'leaseResidentialPriceChart', filename: 'lease_price_by_period.csv' },
    avgExportBtn: { canvasId: 'AverageAnnualRentChartId', filename: 'average_annual_rents.csv' },
    avgExportBtnMobile: { canvasId: 'AverageAnnualRentChartId', filename: 'average_annual_rents.csv' },
    saleExportBtn: { canvasId: 'SalePriceChartId', filename: 'sale_price_index.csv' },
    saleExportBtnMobile: { canvasId: 'SalePriceChartId', filename: 'sale_price_index.csv' },
    rentExportBtn: { canvasId: 'RentPriceChartId', filename: 'rent_price_index.csv' },
    rentExportBtnMobile: { canvasId: 'RentPriceChartId', filename: 'rent_price_index.csv' },
    rentSaleExportBtn: { canvasId: 'RentSalePriceChartId', filename: 'rent_sale_price.csv' },
    rentSaleExportBtnMobile: { canvasId: 'RentSalePriceChartId', filename: 'rent_sale_price.csv' },
    exportTableBtn: { isTable: true, handler: () => window.recentSalesTable?.exportTableData?.(), filename: 'recent_sales.csv' },
    exportTableBtnMobile: { isTable: true, handler: () => window.recentSalesTable?.exportTableData?.(), filename: 'recent_sales.csv' }
};

  // ============= DARK MODE LISTENER =============
  // Detects theme changes and triggers chart redraws
  window.MD.setupDarkModeListener = function() {
    // Debounce redraw to avoid multiple calls in quick succession
    let themeChangeTimeout = null;
    
    // Create a MutationObserver to watch for dark class changes on documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Dark mode class changed, redraw all charts (with debounce)
          if (themeChangeTimeout) clearTimeout(themeChangeTimeout);
          themeChangeTimeout = setTimeout(() => {
            window.MD.redrawAllCharts();
            themeChangeTimeout = null;
          }, 50);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Also listen for matchMedia changes (for system preference changes)
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', () => {
      if (themeChangeTimeout) clearTimeout(themeChangeTimeout);
      themeChangeTimeout = setTimeout(() => {
        window.MD.redrawAllCharts();
        themeChangeTimeout = null;
      }, 50);
    });
  };

  // Redraw all charts when dark mode changes
  // This version directly updates charts without showing skeleton loaders
  window.MD.redrawAllCharts = function() {
    // Identify which charts are already loaded and have Chart.js instances
    const chartInstances = [
      { instance: window.chart, id: 'totalTransactionChart' },
      { instance: window.graph2Chart, id: 'salesByAssetChart' },
      { instance: window.graph3Chart, id: 'resiSalesChart' },
      { instance: window.graph4Chart, id: 'resiFinanceChart' },
      { instance: window.avgRentChart, id: 'avgRentChartCanvas' },
      { instance: window.salePriceChart, id: 'salePriceChartCanvas' },
      { instance: window.rentPriceChart, id: 'rentPriceChartCanvas' },
      { instance: window.leaseGraph1Chart, id: 'leaseUnitsPriceChart' },
      { instance: window.leaseGraph2Chart, id: 'leasePricePeriodChart' },
      { instance: window.salePricesOverTime?.chart, id: 'RentSalePriceChartId' }
    ];

    // Update existing Chart.js instances with new colors
    const isDark = document.documentElement.classList.contains('dark') || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textColor = isDark ? '#F5F5F5' : '#3E3957';

    chartInstances.forEach(({ instance, id }) => {
      if (instance && typeof instance.update === 'function') {
        // Update legend labels color
        if (instance.options?.plugins?.legend?.labels) {
          instance.options.plugins.legend.labels.color = textColor;
        }
        // Update scales color
        if (instance.options?.scales?.x?.ticks) {
          instance.options.scales.x.ticks.color = textColor;
        }
        if (instance.options?.scales?.y?.ticks) {
          instance.options.scales.y.ticks.color = textColor;
        }
        // Re-draw the chart with updated colors
        instance.update('none');
      }
    });

    // Call redraw functions that might do more complex updates
    // These will be called in addition to the Chart.js update above
    // but they should avoid showing skeleton loaders for theme changes
    if (typeof window.drawChartNoSkeleton === 'function') window.drawChartNoSkeleton();
    if (typeof window.redrawGraph1 === 'function') {
      try { 
        // Only redraw if this is a theme change, not initial load
        window.redrawGraph1(true); // Pass flag for theme-only redraw
      } catch(e) { console.warn('redrawGraph1 error during theme change', e); }
    }
    if (typeof window.redrawGraph2 === 'function') {
      try { 
        window.redrawGraph2(true); 
      } catch(e) { console.warn('redrawGraph2 error during theme change', e); }
    }
    if (typeof window.redrawGraph3 === 'function') {
      try { 
        window.redrawGraph3(true); 
      } catch(e) { console.warn('redrawGraph3 error during theme change', e); }
    }
    if (typeof window.redrawGraph4 === 'function') {
      try { 
        window.redrawGraph4(true); 
      } catch(e) { console.warn('redrawGraph4 error during theme change', e); }
    }
    if (typeof window.redrawAvgRent === 'function') {
      try { 
        window.redrawAvgRent(true); 
      } catch(e) { console.warn('redrawAvgRent error during theme change', e); }
    }
    if (typeof window.redrawSalePriceIndices === 'function') {
      try { 
        window.redrawSalePriceIndices(true); 
      } catch(e) { console.warn('redrawSalePriceIndices error during theme change', e); }
    }
    if (typeof window.redrawRentPriceIndices === 'function') {
      try { 
        window.redrawRentPriceIndices(true); 
      } catch(e) { console.warn('redrawRentPriceIndices error during theme change', e); }
    }
    if (typeof window.redrawRentSaleComparison === 'function') {
      try { 
        window.redrawRentSaleComparison(true); 
      } catch(e) { console.warn('redrawRentSaleComparison error during theme change', e); }
    }
    if (typeof window.redrawLeaseGraph1 === 'function') {
      try { 
        window.redrawLeaseGraph1(true); 
      } catch(e) { console.warn('redrawLeaseGraph1 error during theme change', e); }
    }
    if (typeof window.redrawLeaseGraph2 === 'function') {
      try { 
        window.redrawLeaseGraph2(true); 
      } catch(e) { console.warn('redrawLeaseGraph2 error during theme change', e); }
    }
  };

  // Attach listeners after DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize access token first
    window.MD.initializeAccessToken().then(success => {
      if (!success) {
        console.warn('Failed to initialize access token. Some API calls may fail.');
      }
    });

    // Setup dark mode listener
    window.MD.setupDarkModeListener();

    try {
      Object.entries(window.MD._exportButtonMap).forEach(([btnId, cfg]) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', function() {
          // Handle table exports
          if (cfg.isTable && cfg.handler) {
            cfg.handler();
          } 
          // Handle chart exports
          else if (cfg.canvasId) {
            window.MD.exportChartToCSV({ canvasId: cfg.canvasId, filename: cfg.filename });
          }
        });
      });
    } catch (e) { console.error('attach export listeners error', e); }

    // Initialize TabManager from URL or DOM and load the active tab lazily
    try { if (window.MD && MD.TabManager && typeof MD.TabManager.initFromLocation === 'function') MD.TabManager.initFromLocation(); } catch (e) { console.error('TabManager init error', e); }
  });

  /* ===================== GLOBAL AREA FILTER (SAFE ADD) ===================== */

/**
 * Renders Municipality → District checkbox filter
 * Does NOT interfere with existing MD logic
 */
window.MD.renderAreaFilter = function (containerId, areaMap, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  Object.keys(areaMap).forEach(municipality => {
    const block = document.createElement('div');
    block.className = 'dropdown-group';

    /* ---------- HEADER (matches UI) ---------- */
  const header = document.createElement('div');
header.className = 'flex items-center gap-2 cursor-pointer';

header.innerHTML = `
  <label class="flex items-center gap-2 font-medium">
    <input type="checkbox"
           class="area-parent"
           data-municipality="${municipality}"
           checked>
    ${municipality}
  </label>

  <span class="ml-auto flex items-center">
    <img src="/adrec-assets/images/market-data/dropdown-arrow.svg"
         class="w-5 h-5 transition-transform duration-200 area-arrow dark:brightness-0 dark:invert" />
  </span>
`;

    /* ---------- CHILDREN ---------- */
    const children = document.createElement('div');
    children.className = 'ml-5 mt-2 flex flex-col gap-2';

    areaMap[municipality].forEach(district => {
      children.innerHTML += `
        <label class="flex items-center gap-2">
          <input type="checkbox"
                 class="area-child"
                 data-municipality="${municipality}"
                 value="${district}"
                 checked>
          ${district}
        </label>
      `;
    });

    block.appendChild(header);
    block.appendChild(children);
    container.appendChild(block);

    /* expand / collapse */
    header.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT') return;
      children.classList.toggle('hidden');
       const arrow = header.querySelector('.area-arrow');
  arrow.classList.toggle('rotate-180');
    });
  });

  /* parent → children */
  container.querySelectorAll('.area-parent').forEach(p => {
    p.addEventListener('change', () => {
      container
        .querySelectorAll(`.area-child[data-municipality="${p.dataset.municipality}"]`)
        .forEach(c => (c.checked = p.checked));
      onChange();
    });
  });

  /* child → parent */
  container.querySelectorAll('.area-child').forEach(c => {
    c.addEventListener('change', () => {
      const siblings = container.querySelectorAll(
        `.area-child[data-municipality="${c.dataset.municipality}"]`
      );
      const parent = container.querySelector(
        `.area-parent[data-municipality="${c.dataset.municipality}"]`
      );
      parent.checked = [...siblings].every(x => x.checked);
      onChange();
    });
  });
};

/**
 * Render hierarchical area filter with radio buttons (single-select)
 * Structure: Municipality → District (radio buttons)
 * Only one district can be selected across all municipalities
 */
window.MD.renderAreaFilterRadio = function (containerId, areaMap, defaultDistrict, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  Object.keys(areaMap).forEach(municipality => {
    const block = document.createElement('div');
    block.className = 'dropdown-group';

    /* ---------- HEADER ---------- */
    const header = document.createElement('div');
    header.className = 'flex items-center gap-2 cursor-pointer';
    header.innerHTML = `
      <span class="font-medium">${municipality}</span>
      <span class="ml-auto flex items-center">
        <img src="/adrec-assets/images/market-data/dropdown-arrow.svg"
             class="w-5 h-5 transition-transform duration-200 area-arrow-radio dark:brightness-0 dark:invert" />
      </span>
    `;

    /* ---------- CHILDREN (RADIO BUTTONS) ---------- */
    const children = document.createElement('div');
    children.className = 'ml-5 mt-2 flex flex-col gap-2';

    areaMap[municipality].forEach(district => {
      const isDefault = district === defaultDistrict;
      children.innerHTML += `
        <label class="flex items-center gap-2">
          <input type="radio"
                 class="area-district-radio"
                 name="${containerId}"
                 data-municipality="${municipality}"
                 value="${district}"
                 ${isDefault ? 'checked' : ''}>
          ${district}
        </label>
      `;
    });

    block.appendChild(header);
    block.appendChild(children);
    container.appendChild(block);

    /* expand / collapse */
    header.addEventListener('click', () => {
      children.classList.toggle('hidden');
      const arrow = header.querySelector('.area-arrow-radio');
      arrow.classList.toggle('rotate-180');
    });
  });

  /* Radio button change handler */
  container.querySelectorAll('.area-district-radio').forEach(radio => {
    radio.addEventListener('change', onChange || function(){});
  });
};


/**
 * Returns selected districts only
 * Used safely inside existing filters
 */
window.MD.getSelectedDistricts = function (containerId) {
  return Array.from(
    document.querySelectorAll(`#${containerId} .area-child:checked`)
  ).map(cb => cb.value);
};

/**
 * Show skeleton loader for a chart
 * @param {string} canvasId - The ID of the canvas element
 * @param {string} type - 'bar' or 'line' (defaults to 'bar')
 */
window.MD.showSkeletonLoader = function (canvasId, type = 'bar') {
  if (typeof SkeletonLoader !== 'undefined') {
    SkeletonLoader.showSkeleton(canvasId, type);
  }
};

/**
 * Hide skeleton loader for a chart
 * @param {string} canvasId - The ID of the canvas element
 */
window.MD.hideSkeletonLoader = function (canvasId) {
  if (typeof SkeletonLoader !== 'undefined') {
    SkeletonLoader.hideSkeleton(canvasId);
  }
};

/**
 * Pre-show all chart skeletons on page load for a tab
 * Call this before loading data so all skeletons display simultaneously
 * @param {array} canvasIds - Array of canvas IDs to show skeletons for
 */
window.MD.preShowSkeletons = function(canvasIds = []) {
  if (!Array.isArray(canvasIds)) return;
  canvasIds.forEach(canvasId => {
    if (typeof SkeletonLoader !== 'undefined') {
      SkeletonLoader.showSkeleton(canvasId, 'bar');
    }
  });
};

/* ===================== UPDATE MOBILE FILTER DISPLAY ===================== */

/**
 * Update filter display text for mobile dropdowns (only for mobile view)
 * Shows selected items count or names as visual feedback
 * @param {string} dropdownId - ID of the dropdown-wrapper element
 * @param {string} filterId - ID of the filter container (checkbox/radio inputs)
 * @param {string} filterType - 'multi' for checkboxes, 'single' for radio
 * @param {object} translations - Optional object with 'en' and 'ar' keys for custom labels
 */
window.MD.updateFilterDisplay = function(dropdownId, filterId, filterType = 'multi', translations = {}) {
  try {
    // Only update for mobile view (innerWidth < 768)
    if (window.innerWidth >= 768) return;
    
    const dropdown = document.getElementById(dropdownId);
    const filterContainer = document.getElementById(filterId);
    
    if (!dropdown || !filterContainer) {
      console.warn(`updateFilterDisplay: dropdown or filter not found - ${dropdownId}, ${filterId}`);
      return;
    }
    
    const header = dropdown.querySelector('.dropdown-header');
    if (!header) return;
    
    const isArabic = window.MD.getLanguage?.() === 'ar';
    let displayText = '';
    
    if (filterType === 'single') {
      // For radio buttons (single select)
      const checked = filterContainer.querySelector('input[type="radio"]:checked');
      if (checked && checked.value) {
        displayText = checked.value;
      } else {
        displayText = isArabic ? 'اختر' : 'Select';
      }
    } else {
      // For checkboxes (multi-select)
      const allInputs = filterContainer.querySelectorAll('input[type="checkbox"]');
      const checkedInputs = Array.from(filterContainer.querySelectorAll('input[type="checkbox"]:checked'));
      const totalCount = allInputs.length;
      const checkedCount = checkedInputs.length;
      
      if (checkedCount === 0) {
        displayText = isArabic ? 'اختر' : 'Select';
      } else if (checkedCount === totalCount) {
        // All items selected
        displayText = isArabic ? 'تم تحديد الكل' : 'All Selected';
      } else if (checkedCount === 1) {
        displayText = checkedInputs[0].value;
      } else {
        // Multiple selections (but not all): show count
        displayText = isArabic ? `${checkedCount} محدد` : `${checkedCount} selected`;
      }
    }
    
    // Update header text, preserving the arrow icon
    const arrowSpan = header.querySelector('span');
    if (arrowSpan) {
      header.innerHTML = `${displayText} ${arrowSpan.outerHTML}`;
    } else {
      header.innerHTML = `${displayText} <span><img src="/assets/images/dropdown-arrow.svg" class="dark:brightness-0 dark:invert" /></span>`;
    }
  } catch (e) {
    console.error('updateFilterDisplay error:', e);
  }
};

/**
 * Setup listener for a filter to update display on change (mobile only)
 * Call this after rendering filter options
 * @param {string} dropdownId - ID of the dropdown-wrapper element
 * @param {string} filterId - ID of the filter container (checkbox/radio inputs)
 * @param {string} filterType - 'multi' for checkboxes, 'single' for radio
 */
window.MD.setupFilterDisplayListener = function(dropdownId, filterId, filterType = 'multi') {
  try {
    const filterContainer = document.getElementById(filterId);
    if (!filterContainer) return;
    
    // Update display immediately on load
    window.MD.updateFilterDisplay(dropdownId, filterId, filterType);
    
    // Listen for changes and update display
    filterContainer.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', function() {
        window.MD.updateFilterDisplay(dropdownId, filterId, filterType);
      });
    });
  } catch (e) {
    console.error('setupFilterDisplayListener error:', e);
  }
};

/* ===================== CLEAR MOBILE FILTERS ===================== */

/**
 * Generic function to reset all filters in a container to default (all checked)
 * @param {array} filterIds - Array of filter container IDs to reset
 * @param {function} redrawFn - Optional function to call after resetting filters
 */
window.MD.clearFiltersInContainers = function(filterIds = [], redrawFn = null) {
  try {
    filterIds.forEach(filterId => {
      const container = document.getElementById(filterId);
      if (!container) return;
      
      // Check all checkboxes
      container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
      });
      
      // Reset radio buttons to first option
      container.querySelectorAll('input[type="radio"]').forEach(radio => {
        const firstRadio = container.querySelector(`input[type="radio"][name="${radio.name}"]`);
        if (firstRadio && radio === firstRadio) {
          radio.checked = true;
        }
      });
    });
    
    // Call the appropriate redraw function if provided
    if (redrawFn && typeof redrawFn === 'function') {
      redrawFn();
    }
  } catch (e) {
    console.error('clearFiltersInContainers error:', e);
  }
};

/**
 * Clear Transaction Data mobile filters (Graph 1)
 */
window.MD.clearMobileTransactionFilters = function() {
  window.MD.clearFiltersInContainers([
    'txnFilter_m',
    'assetFilter_m',
    'metricFilter_m',
    'statistiTimeFilter_m'
  ], () => window.redrawGraph1?.());
};

/**
 * Clear Asset Sales mobile filters (Graph 2)
 */
window.MD.clearAssetSalesMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'assetTypeFilter_txn_m',
    'metricFilter_txn_m',
    'regionFilter_txn_m'
  ], () => window.redrawGraph2?.());
};

/**
 * Clear Residential Sales mobile filters (Graph 3)
 */
window.MD.clearResiSalesMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'unitResiFilter_m',
    'layoutResiFilter_m',
    'regionFilter_m',
    'metricResiFilter_txn_m'
  ], () => window.redrawGraph3?.());
};

/**
 * Clear Residential Finance mobile filters (Graph 4)
 */
window.MD.clearResiFinanceMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'unitResiFinanceFilter_m',
    'layoutResiFinanceFilter_m',
    'regionResiFinanceFilter_m'
  ], () => window.redrawGraph4?.());
};

/**
 * Clear Recent Sales Table mobile filters
 */
window.MD.clearRecentSalesMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'propertyTypeFilter_m',
    'layoutFilter_m',
    'areaFilter_m'
  ], () => window.reloadRecentSales?.());
};

/**
 * Clear Lease Units Period mobile filters (Lease Tab Graph 1)
 */
window.MD.clearLeaseUnitsPeriodMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'leasePropertyTypeFilter_m',
    'leasePropertyLayoutFilter_m',
    'leaseRegionFilter_m'
  ], () => window.redrawLeaseGraph1?.());
};

/**
 * Clear Lease Price Period mobile filters (Lease Tab Graph 2)
 */
window.MD.clearLeasePricePeriodMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'leasePricePropertyTypeFilter_m',
    'leasePricePropertyLayoutFilter_m',
    'leasePriceRegionFilter_m'
  ], () => window.redrawLeaseGraph2?.());
};

/**
 * Clear Average Annual Rent mobile filters
 */
window.MD.clearAvgRentMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'propertyType_m',
    'propertyLayout_m',
    'areaRegion_m'
  ], () => window.redrawAvgRent?.());
};

/**
 * Clear Sale Price Indices mobile filters
 */
window.MD.clearSalePriceIndicesMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'salePropertyType_m',
    'salePropertyLayout_m',
    'saleArea_m'
  ], () => window.redrawSalePriceIndices?.());
};

/**
 * Clear Rent Price Indices mobile filters
 */
window.MD.clearRentPriceIndicesMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'rentPropertyType_m',
    'rentPropertyLayout_m',
    'rentArea_m'
  ], () => window.redrawRentPriceIndices?.());
};

/**
 * Clear Rent Sale Comparison mobile filters
 */
window.MD.clearRentSaleMobileFilters = function() {
  window.MD.clearFiltersInContainers([
    'rentSalePropertyType_m',
    'rentSalePropertyLayout_m',
    'rentSaleArea_m'
  ], () => window.redrawRentSaleComparison?.());
};

/**
 * Generic function to disable/enable controls (filters and export buttons)
 * @param {Object} config - Configuration object
 * @param {Array} config.filterIds - Array of filter element IDs
 * @param {Array} config.buttonIds - Array of button element IDs
 * @param {Boolean} isDisable - true to disable, false to enable
 */
window.MD.toggleControls = function(config, isDisable = true) {
  if (!config || (!config.filterIds && !config.buttonIds)) {
    console.warn('MD.toggleControls: Invalid config provided');
    return;
  }

  const toggle = (id) => {
    const element = document.getElementById(id);
    if (element) {
      if (isDisable) {
        element.classList.add('opacity-50');
        element.style.pointerEvents = 'none';
      } else {
        element.classList.remove('opacity-50');
        element.style.pointerEvents = 'auto';
      }
    }
  };

  // Toggle filters
  if (config.filterIds && Array.isArray(config.filterIds)) {
    config.filterIds.forEach(toggle);
  }

  // Toggle buttons
  if (config.buttonIds && Array.isArray(config.buttonIds)) {
    config.buttonIds.forEach(toggle);
  }
};



})();
