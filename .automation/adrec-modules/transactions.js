// ============================================================================
// COMPLETE API LOADER FOR GRAPH 1: TOTAL TRANSACTIONS BY TYPE
// Includes all functions from TransactionByType.js + API fetching in one file
// ============================================================================

(function () {
 
  // ============ GLOBALS ============
  window.allData = [];
  window.currentPeriod = null; // Will be set from API lookups to support Arabic mode
  window.chart = null;


  // ============ UI RENDERING ============
    const isMobile = window.innerWidth < 768;

  // Configuration for transaction controls
  const transactionControlsConfig = {
    filterIds: ['txnDropdown', 'assetDropdown', 'metricDropdown', 'monthlyDropdown', 'txnDropdown_m', 'assetDropdown_m', 'metricDropdown_m', 'monthlyDropdown_m'],
    buttonIds: ['exportBtnTransactionDesktop', 'exportBtnTransactionMobile', 'allFiltersBtnTransaction']
  };

  async function transactionByTypeFilters() {
    try {
      // Fetch filter options from API lookups instead of extracting from data
      const lookups = await MD.fetchMultipleLookups([
        'TransactionTypes',
        'AssetClasses',
        'StatisticDescriptions',
        'StatisticTimeAggregations'
      ]);

      const txnTypes = lookups['TransactionTypes'] || [];
      const assetClasses = lookups['AssetClasses'] || [];
      const metrics = lookups['StatisticDescriptions'] || [];
      const timeAggregations = lookups['StatisticTimeAggregations'] || [];

      // Create a debounced version of drawChart to prevent multiple API calls on rapid filter changes
      const debouncedDrawChart = MD.debounce(drawChart, 500);

      // Render filters on both desktop and mobile
      MD.renderSimpleCheckbox('txnFilter', txnTypes, 'filter-check', debouncedDrawChart);
      MD.renderSimpleCheckbox('assetFilter', assetClasses, 'filter-check', debouncedDrawChart);
      MD.renderSimpleRadio('metricFilter', metrics, metrics[0] || '', debouncedDrawChart);
      MD.renderSimpleRadio('statistiTimeFilter', timeAggregations, window.currentPeriod);
      MD.renderSimpleCheckbox('txnFilter_m', txnTypes, 'filter-check', debouncedDrawChart);
      MD.renderSimpleCheckbox('assetFilter_m', assetClasses, 'filter-check', debouncedDrawChart);
      MD.renderSimpleRadio('metricFilter_m', metrics, metrics[0] || '', debouncedDrawChart);
      MD.renderSimpleRadio('statistiTimeFilter_m', timeAggregations, window.currentPeriod);

      // Setup filter display listeners for mobile (only updates in mobile view)
      MD.setupFilterDisplayListener('txnDropdown_m', 'txnFilter_m', 'multi');
      MD.setupFilterDisplayListener('assetDropdown_m', 'assetFilter_m', 'multi');
      MD.setupFilterDisplayListener('metricDropdown_m', 'metricFilter_m', 'single');
      MD.setupFilterDisplayListener('monthlyDropdown_m', 'statistiTimeFilter_m', 'single');
    } catch (err) {
      console.error('Error loading filters from API:', err);
    }
  }

  // ============ CHART RENDERING ============

  function isDarkMode() {
    return document.documentElement.classList.contains('dark') || 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function drawChart() {
    MD.showSkeletonLoader('totalTransactionChart');
const txnContainer = isMobile ? 'txnFilter_m' : 'txnFilter';
const assetContainer = isMobile ? 'assetFilter_m' : 'assetFilter';
const metricName = isMobile ? 'metricFilter_m' : 'metricFilter';

const selectedTxn = MD.getCheckedValues(txnContainer);
const selectedAsset = MD.getCheckedValues(assetContainer);
const selectedMetric = [
  document.querySelector(`input[name="${metricName}"]:checked`)?.value
].filter(Boolean);

    const filtered = window.allData.filter(item =>
      selectedTxn.includes(item.txn_type) &&
      selectedAsset.includes(item.asset_class) &&
      selectedMetric.includes(item.statistic_description) &&
      item.statistic_time_aggregation.toLowerCase() === window.currentPeriod
    );

    const grouped = {};
    const labels = new Set();
    const types = new Set();

    filtered.forEach(item => {
      const date = item.period_description;
      const key = item.txn_type;
      labels.add(date);
      types.add(key);
      grouped[date] = grouped[date] || {};
      grouped[date][key] = (grouped[date][key] || 0) + item.statistic_value;
    });

    const sortedLabels = Array.from(labels).sort();
    const formattedLabels = sortedLabels.map(d => MD.formatPeriodLabel ? MD.formatPeriodLabel(d, window.currentPeriod) : MD.formatLabelYear(d));

    const datasets = Array.from(types).map(type => ({
      label: MD.cap(type),
      data: sortedLabels.map(date => grouped[date]?.[type] || 0),
      backgroundColor: MD.getColor(type),
      stack: 'stack1',
      borderRadius: 4,
      datalabels: {
        display: false,
        color: isDarkMode() ? '#F5F5F5' : '#3E3957',
        font: { weight: '400', size: 11 },
        anchor: 'center',
        align: 'center',
        formatter: function(value, context) {
          const bar = context.chart.getDatasetMeta(context.datasetIndex).data[context.dataIndex];
          if (!bar) return '';
          const start = bar.getProps(['y', 'base'], true).base;
          const end = bar.getProps(['y', 'base'], true).y;
          const height = Math.abs(start - end);
          if (height < 15) return '';
          return value > 0 ? MD.formatValue(value) : '';
        }
      }
    }));

    const AxisLabelsWithArrows = {
      id: "AxisLabelsWithArrows",
      afterDraw(chart) {
        const { ctx, chartArea: { left, right, top, bottom } } = chart;
        const isDark = isDarkMode();
        const axisColor = isDark ? '#F5F5F5' : '#3E3957';
        ctx.save();
        ctx.strokeStyle = axisColor;
        ctx.fillStyle = axisColor;
        ctx.lineWidth = 1.5;

        const yAxisX = left - 12;
        ctx.beginPath();
        ctx.moveTo(yAxisX, bottom);
        ctx.lineTo(yAxisX, top + 8);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(yAxisX, top - 2);
        ctx.lineTo(yAxisX - 7, top + 8);
        ctx.lineTo(yAxisX + 7, top + 8);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.translate(yAxisX - 30, (top + bottom) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.font = "12px";
        ctx.fillStyle = axisColor;
        // Y-axis title removed
        ctx.restore();

        const axisY = bottom;
        const xScale = chart.scales.x;
        const lastIndex = chart.data.labels.length - 1;
        const lastTickX = xScale.getPixelForValue(lastIndex);
        const extraSpacing = 30;
        ctx.beginPath();
        ctx.moveTo(yAxisX, axisY);
        ctx.lineTo(lastTickX + 30, axisY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(lastTickX + extraSpacing + 12, axisY);
        ctx.lineTo(lastTickX + extraSpacing, axisY - 7);
        ctx.lineTo(lastTickX + extraSpacing, axisY + 7);
        ctx.closePath();
        ctx.fill();

        ctx.font = "12px";
        ctx.textAlign = "left";
        ctx.fillStyle = axisColor;
        const isMobile = window.innerWidth < 768;
        ctx.fillText("Time", lastTickX + (isMobile ? 15 : 25), axisY - 18);
        ctx.restore();
      }
    };

    if (window.chart) window.chart.destroy();
    const ctx = document.getElementById('totalTransactionChart');
    if (!ctx) {
      console.error('Canvas element not found');
      MD.hideSkeletonLoader('totalTransactionChart');
      return;
    }

    window.chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: formattedLabels, datasets },
      plugins: [
        ChartDataLabels,
        AxisLabelsWithArrows,
        {
          id: 'barGrandTotal',
          afterDatasetsDraw(chart) {
            return
          }
        }
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { left: 50, right: 40, top: 10, bottom: 10 }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              padding: 20,
              font: { size: 12 },
              color: isDarkMode() ? '#F5F5F5' : "#3E3957"
            },
            maxWidth: 2000
          },
          datalabels: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a',
            titleColor: '#F5F5F5',
            bodyColor: '#F5F5F5',
            padding: 10,
            displayColors: false,
            borderColor: '#000',
            borderWidth: 2,
            cornerRadius: 8,
            titleFont: { size: 10, weight: 'semibold' },
            bodyFont: { size: 12, weight: 'semibold' },
            callbacks: {
              label: ctx => MD.formatValue(ctx.parsed.y),
              title: ctx => ctx[0]?.dataset?.label || ''
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { drawOnChartArea: false, drawTicks: false },
            border: { display: false },
            ticks: {
               maxRotation: isMobile ? 90 : 0,
              minRotation: isMobile ? 90 : 0,
              padding: 10,
              font: { size: isMobile ? 10 : 11 },
              color: isDarkMode() ? '#F5F5F5' : '#3E3957'
            }
          },
          y: {
            stacked: true,
            border: { display: false },
            grid: { display: false },
            ticks: { display: false }
          }
        },
        barRoundness: 0.35
      }
    });
    // Hide skeleton loader after chart is rendered
    setTimeout(() => MD.hideSkeletonLoader('totalTransactionChart'), 100);
  }

  // ============ EVENT LISTENERS ============

  function setupDropdownListeners() {
    ['txnDropdown', 'assetDropdown', 'metricDropdown', 'monthlyDropdown', 'txnDropdown_m', 'assetDropdown_m', 'metricDropdown_m', 'monthlyDropdown_m'].forEach(id => {
      const dropdown = document.getElementById(id);
      if (dropdown) {
        dropdown.addEventListener('click', function (e) {
          if (e.target.closest('.dropdown-header')) {
            this.classList.toggle('open');
          }
        });
      }
    });
  }

  function setupPeriodListener() {
    document.addEventListener('change', function (e) {
      if (e.target.name === 'statistiTimeFilter' || e.target.name === 'statistiTimeFilter_m') {
        window.currentPeriod = e.target.value.toLowerCase();
        const desktopHeader = document.querySelector('#monthlyDropdown .dropdown-header');
        if (desktopHeader) {
          desktopHeader.innerHTML = `${e.target.value} <span><img src="/adrec-assets/images/market-data/dropdown-arrow.svg"></span>`;
        }
        const mobileHeader = document.querySelector('#monthlyDropdown_m .dropdown-header');
        if (mobileHeader) {
          mobileHeader.innerHTML = `${e.target.value} <span><img src="/adrec-assets/images/market-data/dropdown-arrow.svg"></span>`;
        }
        drawChart();
      }
    });
  }


  // ============ API WRAPPER ============

  async function fetchAPI(endpoint, params = {}) {
    try {
      if (typeof MD !== 'undefined' && MD.fetchAPI) return await MD.fetchAPI(endpoint, params);
      // fallback: simple fetch using global base url if available
      const base = (typeof MD !== 'undefined' && MD.CONFIG && MD.CONFIG.BASE_URL) ? MD.CONFIG.BASE_URL : '';
      const url = new URL(endpoint, base + '/');
      Object.keys(params || {}).forEach(k => url.searchParams.append(k, params[k]));
      const res = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });
      return await res.json();
    } catch (e) { console.error('fetchAPI error', e); return null; }
  }


  // ============ LOAD DATA ============

  async function loadGraph1() {
    // Disable controls initially while data is loading
    MD.toggleControls(transactionControlsConfig, true);
    
    // Show skeleton loader before fetching
    SkeletonLoader.showBarChartSkeleton('totalTransactionChart');

    // Fetch lookup options for all time aggregations and metrics from API
    let timePeriods = ['monthly', 'quarterly', 'yearly'];
    let metrics = ['value (AED)', 'volume'];
    try {
      const lookups = await MD.fetchMultipleLookups(['StatisticTimeAggregations', 'StatisticDescriptions']);
      if (lookups['StatisticTimeAggregations']?.length) {
        timePeriods = lookups['StatisticTimeAggregations'].map(v => v.toLowerCase());
        // Initialize currentPeriod to first available time aggregation to support Arabic mode
        window.currentPeriod = timePeriods[0];
        console.log('✓ StatisticTimeAggregations fetched from API:', timePeriods);
      }
      if (lookups['StatisticDescriptions']?.length) {
        metrics = lookups['StatisticDescriptions'];
        console.log('✓ StatisticDescriptions fetched from API:', metrics);
      }
    } catch (e) {
      console.warn('Could not fetch lookup values from API, falling back to defaults', e);
    }

    let allData = [];

    // Fetch data for all time periods and metrics combinations
    for (const period of timePeriods) {
      for (const metric of metrics) {
        const params = {
          txnType: 'all',
          assetClass: 'all',
          statisticTimeAggregation: period,
          statisticDescription: metric,
          language: MD.getLanguage()
        };

        const data = await MD.fetchOnce('/api/feature/MarketData/TotalTransactionsByType', params);
        if (Array.isArray(data)) {
          allData = allData.concat(data);
        }
      }
    }

    if (allData.length > 0) {
      window.allData = allData;
      console.log(`✓ API loaded ${allData.length} records`);
      // Load filters from API lookups instead of extracting from data
      await transactionByTypeFilters();
      setupDropdownListeners();
      setupPeriodListener();
      drawChart();
      SkeletonLoader.hideSkeleton('totalTransactionChart');
      // Enable controls after data is loaded and rendered
      MD.toggleControls(transactionControlsConfig, false);
      console.log('✓ Chart rendered successfully');
    } else {
      console.error('No data returned from API');
      SkeletonLoader.hideSkeleton('totalTransactionChart');
      // Re-enable controls even if no data (so user can try again)
      MD.toggleControls(transactionControlsConfig, false);
    }
  }

  // ============ INIT ============

  document.addEventListener('DOMContentLoaded', () => {
    MD.TabManager.registerTabLoader('tab0', loadGraph1);
    if (MD.TabManager.currentActiveTab === 'tab0') {
      MD.TabManager.loadTab('tab0');
    }
  });
  
  // Expose redraw function globally for clear filters
  window.redrawGraph1 = drawChart;
})();
