(function() {

  const PAGE_SIZE = 10;

  let currentPage = 0;
  let totalElements = 0;
  let rawData = [];
  let sortState = { key: null, dir: null };

  let fromDate = "2019-01-01";
  let toDate = new Date().toISOString().split('T')[0];

  const container = document.getElementById("salesTableContainer");
  const paginationEl = document.getElementById("tablePagination");

  // Controls config for disabling/enabling filters during data loading
  const recentSalesTableControlsConfig = {
    filterIds: [
      'filterAssetType', 'filterAssetTypeMobile',
      'filterPropertyType', 'filterPropertyTypeMobile',
      'filterSaleType', 'filterSaleTypeMobile',
      'filterDistrict', 'filterDistrictMobile',
      'filterCommunity', 'filterCommunityMobile',
      'filterProject', 'filterProjectMobile',
      'filterLayout', 'filterLayoutMobile'
    ],
    buttonIds: ['allFiltersBtnRecentSales', 'exportTableBtn', 'exportTableBtnMobile']
  };

  /* ===================== TRANSLATION SYSTEM ===================== */
  
  const translations = {
    en: {
      "Asset Type": "Asset Type",
      "Property Type": "Property Type",
      "Registration": "Registration",
      "Sold Area (sqm)": "Sold Area (sqm)",
      "Plot Area (sqm)": "Plot Area (sqm)",
      "Rate (AED/sqm)": "Rate (AED/sqm)",
      "Layout": "Layout",
      "District": "District",
      "Community": "Community",
      "Project": "Project",
      "Price (AED)": "Price (AED)",
      "Share": "Share",
      "Sale Type": "Sale Type",
      "Sequence": "Sequence",
      "No data available": "No data available",
      "out of": "out of"
    },
    ar: {
      "Asset Type": "نوع الأصل",
      "Property Type": "نوع الممتلكات",
      "Registration": "التسجيل",
      "Sold Area (sqm)": "المساحة المباعة (متر مربع)",
      "Plot Area (sqm)": "مساحة القطعة (متر مربع)",
      "Rate (AED/sqm)": "السعر (درهم/متر مربع)",
      "Layout": "عدد الغرف",
      "District": "المنطقة",
      "Community": "الحوض",
      "Project": "المشروع",
      "Price (AED)": "السعر (درهم إماراتي)",
      "Share": "الحصة",
      "Sale Type": "نوع البيع",
      "Sequence": "التسلسل",
      "No data available": "لا توجد بيانات متاحة",
      "out of": "من"
    }
  };

  const filterTranslations = {
    en: {
      "Asset Classes": "Asset Type",
      "Property Types": "Property Type",
      "Sale Sequences": "Sale Type",
      "Districts": "District",
      "Communities": "Community",
      "Project Names": "Project",
      "Property Layouts": "Layout"
    },
    ar: {
      "Asset Classes": "نوع الأصل",
      "Property Types": "نوع الممتلكات",
      "Sale Sequences": "نوع البيع",
      "Districts": "المنطقة",
      "Communities": "الحوض",
      "Project Names": "المشروع",
      "Property Layouts": "عدد الغرف"
    }
  };

  function getTranslation(key, type = 'columns') {
    const lang = window.MD.getLanguage();
    if (type === 'filters') {
      return filterTranslations[lang]?.[key] || filterTranslations['en']?.[key] || key;
    }
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }
  
  // Export data storage for global export handler
  window.recentSalesTable = window.recentSalesTable || {
    getSelectedFilters: null,
    getSortState: null,
    getDateRange: null,
    getTotalElements: null
  };

  const filters = [
    { key: "asset_class", mobileId: "filterAssetTypeMobile", desktopId: "filterAssetType", lookupKey: "AssetClasses", labelKey: "Asset Classes" },
    { key: "property_type", mobileId: "filterPropertyTypeMobile", desktopId: "filterPropertyType", lookupKey: "PropertyTypes", labelKey: "Property Types" },
    { key: "sale_sequence", mobileId: "filterSaleTypeMobile", desktopId: "filterSaleType", lookupKey: "SaleSequences", labelKey: "Sale Sequences" },
    { key: "district", mobileId: "filterDistrictMobile", desktopId: "filterDistrict", lookupKey: "Districts", labelKey: "Districts" },
    { key: "community", mobileId: "filterCommunityMobile", desktopId: "filterCommunity", lookupKey: "Communities", labelKey: "Communities" },
    { key: "project_name", mobileId: "filterProjectMobile", desktopId: "filterProject", lookupKey: "ProjectNames", labelKey: "Project Names" },
    { key: "property_layout", mobileId: "filterLayoutMobile", desktopId: "filterLayout", lookupKey: "PropertyLayouts", labelKey: "Property Layouts" }
  ];

  /* ===================== FORMATTERS ===================== */

  const cap = v => v ? v.charAt(0).toUpperCase() + v.slice(1) : "-";
  const fmtDate = v => v ? new Date(v).toLocaleDateString("en-GB") : "-";
  const fmtArea = v => v != null ? Number(v).toLocaleString() + " sqm" : "-";
  const fmtAED = v => v != null ? Number(v).toLocaleString("en-US") : "-";
  const fmtPrice = v => v != null ? "AED " + Number(v).toLocaleString("en-US") : "-";
  const fmtShare = v => {
    if (v == null) return "-";
    const percentage = Number(v) * 100;
    return Number.isInteger(percentage) ? percentage + "%" : percentage.toFixed(2) + "%";
  };

  /* ===================== POPULATE FILTERS FROM LOOKUP API ===================== */

  function initializeFilterPlaceholders() {
    // Translate filter names immediately on page load
    filters.forEach(filter => {
      const translatedLabel = getTranslation(filter.labelKey, 'filters');
      
      // Desktop
      const desktopHeader = document.querySelector(`#${filter.desktopId} .dropdown-header`);
      if (desktopHeader) {
        const iconSpan = desktopHeader.querySelector('span');
        desktopHeader.textContent = translatedLabel;
        if (iconSpan) {
          desktopHeader.appendChild(iconSpan);
        }
      }
      
      // Mobile
      const mobileHeader = document.querySelector(`#${filter.mobileId} .dropdown-header`);
      if (mobileHeader) {
        const iconSpan = mobileHeader.querySelector('span');
        mobileHeader.textContent = translatedLabel;
        if (iconSpan) {
          mobileHeader.appendChild(iconSpan);
        }
      }
    });
  }

  async function populateTableFilters() {
    try {
      MD.toggleControls(recentSalesTableControlsConfig, true);
      const lookupNames = filters.map(f => f.lookupKey);
      const lookupMap = await window.MD.fetchMultipleLookups(lookupNames);

      filters.forEach(filter => {
        const values = lookupMap[filter.lookupKey] || [];
        filter.options = Array.isArray(values) ? values.map(v => String(v)) : [];

        // Update dropdown header with translated name
        const translatedLabel = getTranslation(filter.labelKey, 'filters');
        
        // Desktop dropdown header - preserve the icon span
        const desktopDropdown = document.querySelector(`#${filter.desktopId}`);
        if (desktopDropdown) {
          const desktopHeader = desktopDropdown.querySelector('.dropdown-header');
          if (desktopHeader) {
            // Preserve the icon span by only updating the text node
            const iconSpan = desktopHeader.querySelector('span');
            desktopHeader.textContent = translatedLabel;
            if (iconSpan) {
              desktopHeader.appendChild(iconSpan);
            }
          }
        }

        // Mobile dropdown header - preserve the icon span
        const mobileDropdown = document.querySelector(`#${filter.mobileId}`);
        if (mobileDropdown) {
          const mobileHeader = mobileDropdown.querySelector('.dropdown-header');
          if (mobileHeader) {
            // Preserve the icon span by only updating the text node
            const iconSpan = mobileHeader.querySelector('span');
            mobileHeader.textContent = translatedLabel;
            if (iconSpan) {
              mobileHeader.appendChild(iconSpan);
            }
          }
        }

        // Render to desktop dropdown-body
        const desktopBody = document.querySelector(`#${filter.desktopId} .dropdown-body`);
        if (desktopBody) {
          if (!desktopBody.id) desktopBody.id = `${filter.desktopId}_body`;
          window.MD.renderSimpleCheckbox(desktopBody.id, filter.options, 'filter-check', () => { currentPage = 0; loadData(); });
        }

        // Render to mobile dropdown-body
        const mobileBody = document.querySelector(`#${filter.mobileId} .dropdown-body`);
        if (mobileBody) {
          if (!mobileBody.id) mobileBody.id = `${filter.mobileId}_body`;
          window.MD.renderSimpleCheckbox(mobileBody.id, filter.options, 'filter-check', () => { currentPage = 0; loadData(); });
        }
      });
      
      setupDropdownToggle();
      attachFilterListeners();
      
      // Load data after filters are populated
      await loadData();
      MD.toggleControls(recentSalesTableControlsConfig, false);
    } catch (err) {
      console.error('Error loading table filters from API:', err);
      MD.toggleControls(recentSalesTableControlsConfig, false);
      // Hide skeleton on error
      if (window.SkeletonLoader) {
        window.SkeletonLoader.hideTableSkeleton("salesTableContainer");
      }
    }
  }

  /* ===================== DROPDOWN TOGGLE ===================== */

  function setupDropdownToggle() {
    const allDropdowns = document.querySelectorAll('.dropdown-wrapper');
    allDropdowns.forEach(dropdown => {
      const header = dropdown.querySelector('.dropdown-header');
      if (header) {
        header.addEventListener('click', function(e) {
          e.stopPropagation();
          allDropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
          dropdown.classList.toggle('open');
        });
      }
    });

    document.addEventListener('click', function(e) {
      allDropdowns.forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    });
  }

  /* ===================== ATTACH FILTER LISTENERS ===================== */

  function attachFilterListeners() {
    document.querySelectorAll('.filter-check').forEach(cb => {
      const clone = cb.cloneNode(true);
      cb.parentNode.replaceChild(clone, cb);
      clone.addEventListener('change', function () { currentPage = 0; loadData(); });
    });
    
    // Re-attach display listeners after cloning
    filters.forEach(filter => {
      const mobileBody = document.querySelector(`#${filter.mobileId}_body`);
      if (mobileBody) {
        window.MD.setupFilterDisplayListener(filter.mobileId, `${filter.mobileId}_body`, 'multi');
      }
    });
  }

  /* ===================== GET SELECTED FILTER VALUES ===================== */

  function getSelectedFilters() {
    const selected = {};
    const isMobile = window.innerWidth < 768;
    
    filters.forEach(f => {
      const filterIdToUse = isMobile ? f.mobileId : f.desktopId;
      const checked = window.MD.getCheckedValues(filterIdToUse) || [];

      const allOptions = Array.isArray(f.options) && f.options.length ? f.options : (() => {
        const desktopAll = Array.from(document.querySelectorAll(`#${f.desktopId} .filter-check`)).map(cb => cb.value);
        const mobileAll = Array.from(document.querySelectorAll(`#${f.mobileId} .filter-check`)).map(cb => cb.value);
        return Array.from(new Set([...desktopAll, ...mobileAll]));
      })();

      if (!checked.length) selected[f.key] = 'all';
      else if (checked.length === allOptions.length && allOptions.length > 0) selected[f.key] = 'all';
      else selected[f.key] = checked;
    });

    return selected;
  }

  /* ===================== API LOAD ===================== */

  async function loadData() {
    // Show skeleton loader while fetching data
    if (window.SkeletonLoader) {
      window.SkeletonLoader.showTableSkeleton("salesTableContainer");
    }
    MD.toggleControls(recentSalesTableControlsConfig, true);

    const selected = getSelectedFilters();

    const params = {};
    params.fromDate = fromDate;
    params.toDate = toDate;
    params.saleApplicationType = "all";
    
    params.saleSequence = Array.isArray(selected.sale_sequence) 
      ? selected.sale_sequence.join(',') 
      : selected.sale_sequence;
    
    params.municipality = "all";
    
    params.district = Array.isArray(selected.district) 
      ? selected.district.join(',') 
      : selected.district;
    
    params.projectName = Array.isArray(selected.project_name) 
      ? selected.project_name.join(',') 
      : selected.project_name;
    
    params.assetClass = Array.isArray(selected.asset_class) 
      ? selected.asset_class.join(',') 
      : selected.asset_class;
    
    params.propertyType = Array.isArray(selected.property_type) 
      ? selected.property_type.join(',') 
      : selected.property_type;
    
    params.page = currentPage;
    params.size = PAGE_SIZE;
    
    if (sortState.key && sortState.dir) {
      params.sort = `${sortState.key},${sortState.dir}`;
    } 
    // else {
    //   params.sort = "property_sold_area_sqm,desc";
    // }
    
    params.propertyLayout = Array.isArray(selected.property_layout) 
      ? selected.property_layout.join(',') 
      : selected.property_layout;
    
    // Add language parameter
    params.language = window.MD.getLanguage();

    const data = await window.MD.fetchAPI("/api/feature/MarketData/RecentSales", params);
    if (!data) return;

    rawData = data.content || [];
    totalElements = data.totalElements || 0;

    renderTable();
    renderPagination();
    
    // Hide skeleton loader after data is rendered
    if (window.SkeletonLoader) {
      window.SkeletonLoader.hideTableSkeleton("salesTableContainer");
    }
    MD.toggleControls(recentSalesTableControlsConfig, false);
  }

  /* ===================== TABLE ===================== */

  const COLUMNS_KEYS = [
    { key: "asset_class", label: "Asset Type", fmt: cap },
    { key: "property_type", label: "Property Type", fmt: cap },
    { key: "sale_application_datetime", label: "Registration", fmt: fmtDate },
    { key: "property_sold_area_sqm", label: "Sold Area (sqm)", fmt: fmtArea },
    { key: "land_plot_ground_area_sqm", label: "Plot Area (sqm)", fmt: fmtArea },
    { key: "rate_aed_per_sqm", label: "Rate (AED/sqm)", fmt: fmtAED },
    { key: "property_layout", label: "Layout" },
    { key: "district", label: "District" },
    { key: "community", label: "Community" },
    { key: "project_name", label: "Project" },
    { key: "property_sale_price_aed", label: "Price (AED)", fmt: fmtPrice },
    { key: "property_sold_share", label: "Share", fmt: fmtShare },
    { key: "sale_application_type", label: "Sale Type", fmt: cap },
    { key: "sale_sequence", label: "Sequence", fmt: cap }
  ];

  // Function to get translated columns based on current language
  function getColumns() {
    return COLUMNS_KEYS.map(col => ({
      ...col,
      label: getTranslation(col.label, 'columns')
    }));
  }

  const COLUMNS = COLUMNS_KEYS;

  function renderTable() {
    const wrapper = document.createElement("div");
    wrapper.className = "overflow-x-auto";
    wrapper.style.webkitOverflowScrolling = "touch";
    
    const table = document.createElement("table");
    table.className = "w-full border-collapse";
    table.style.minWidth = "1200px";

    const thead = document.createElement("thead");
    thead.className = "bg-[#DCE6D8] dark:bg-[#1A222C]";
    const trh = document.createElement("tr");

    const translatedColumns = getColumns();

    translatedColumns.forEach(c => {
      const th = document.createElement("th");
      th.className = "px-2 py-3 text-sm font-semibold dark:text-white text-left border-b border-gray-300 whitespace-nowrap";

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flex items-center gap-2 cursor-pointer hover:opacity-70';
      btn.dataset.key = c.key;
      btn.innerHTML = `<span>${c.label}</span>`;

      const sortIndicator = document.createElement('span');
      sortIndicator.className = 'sort-indicator text-xs';
      sortIndicator.style.minWidth = '12px';
      sortIndicator.style.display = 'inline-block';
      sortIndicator.style.marginLeft = '4px';
      if (sortState.key === c.key) {
        sortIndicator.innerHTML = sortState.dir === 'desc' ? '<img src="/adrec-assets/images/market-data/filter-icon.svg" class="dark:brightness-0 dark:invert" />' : '<img src="/adrec-assets/images/market-data/filter-icon.svg" class="dark:brightness-0 dark:invert" />';
      } else {
        sortIndicator.innerHTML = '<img src="/adrec-assets/images/market-data/filter-icon.svg" class="dark:brightness-0 dark:invert" />';
      }
      btn.appendChild(sortIndicator);

      btn.addEventListener('click', function (e) {
        const key = this.dataset.key;
        if (sortState.key === key) {
          sortState.dir = sortState.dir === 'desc' ? 'asc' : 'desc';
        } else {
          sortState.key = key;
          sortState.dir = 'desc';
        }
        currentPage = 0;
        loadData();
      });

      th.appendChild(btn);
      trh.appendChild(th);
    });

    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Only add data rows if there is data
    if (rawData && rawData.length > 0) {
      rawData.forEach((r, idx) => {
        const tr = document.createElement("tr");
        tr.className = idx % 2 === 0 ? "bg-white dark:bg-[#0D1318]" : "bg-[#F5F7F4] dark:bg-[#161D28]";
        
        COLUMNS.forEach(c => {
          const td = document.createElement("td");
          td.className = "px-2 py-3 text-sm dark:text-white whitespace-nowrap";
          const value = c.fmt ? c.fmt(r[c.key]) : (r[c.key] ?? "-");
          td.textContent = value;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    } else {
      // Show empty row with message when no data
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = COLUMNS.length;
      td.className = "px-2 py-4 text-sm text-center dark:text-white";
      td.textContent = getTranslation("No data available", 'columns');
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.innerHTML = "";
    container.appendChild(wrapper);
  }

  /* ===================== PAGINATION ===================== */

  function renderPagination() {
    const totalPages = Math.ceil(totalElements / PAGE_SIZE);
    paginationEl.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "flex items-center gap-2 mb-1";

    const isArabic = window.MD.getLanguage() === 'ar';
    
    // Swap arrow directions for Arabic (RTL)
    const leftDoubleIcon = isArabic ? '/adrec-assets/images/market-data/right-double-icon.svg' : '/adrec-assets/images/market-data/left-double-icon.svg';
    const leftIcon = isArabic ? '/adrec-assets/images/market-data/right-icon.svg' : '/adrec-assets/images/market-data/left-icon.svg';
    const rightIcon = isArabic ? '/adrec-assets/images/market-data/left-icon.svg' : '/adrec-assets/images/market-data/right-icon.svg';
    const rightDoubleIcon = isArabic ? '/adrec-assets/images/market-data/left-double-icon.svg' : '/adrec-assets/images/market-data/right-double-icon.svg';

    const btn = (label, disabled, cb, active = false) => {
      const b = document.createElement("button");
      b.innerHTML = label;
      b.disabled = disabled;
      const isNumeric = /^\d+$/.test(label);
      b.className =
        `${isNumeric ? "min-w-8 px-2" : "w-8"} h-8 rounded border dark:border-[rgba(255,255,255,0.1)] text-sm flex items-center justify-center ${
          active ? "bg-[#CFE0C7] font-semibold" : "bg-[#EBEEF3]"
        } ${disabled ? "opacity-40" : ""}`;
      if (!disabled) b.onclick = cb;
      return b;
    };

    // Only show left arrows if not on first page
    if (currentPage > 0) {
      wrapper.appendChild(btn(`<img src="${leftDoubleIcon}" />`, false, () => { currentPage = 0; loadData(); }));
      wrapper.appendChild(btn(`<img src="${leftIcon}"  />`, false, () => { currentPage--; loadData(); }));
    }

    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, start + 4);

    for (let i = start; i <= end; i++) {
      wrapper.appendChild(
        btn(i + 1, false, () => { currentPage = i; loadData(); }, i === currentPage)
      );
    }

    // Only show right arrows if not on last page
    if (currentPage < totalPages - 1) {
      wrapper.appendChild(btn(`<img src="${rightIcon}" />`, false, () => { currentPage++; loadData(); }));
      wrapper.appendChild(btn(`<img src="${rightDoubleIcon}" />`, false, () => { currentPage = totalPages - 1; loadData(); }));
    }

    const info = document.createElement("div");
    info.className = "md:mx-4 text-sm dark:text-white";
    info.textContent = `${getTranslation("out of", 'columns')} ${totalElements}`;

    paginationEl.appendChild(wrapper);
    paginationEl.appendChild(info);
  }

  /* ===================== EXPORT ===================== */

  window.recentSalesTable.exportTableData = async function() {
    if (totalElements === 0) return { success: false, message: 'No data to export' };

    try {
      const selected = getSelectedFilters();
      const PAGE_LIMIT = 1000;
      let allData = [];
      const totalPages = Math.ceil(totalElements / PAGE_LIMIT);

      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const params = {};
        params.fromDate = fromDate;
        params.toDate = toDate;
        params.saleApplicationType = "all";
        params.saleSequence = Array.isArray(selected.sale_sequence) ? selected.sale_sequence.join(',') : selected.sale_sequence;
        params.municipality = "all";
        params.district = Array.isArray(selected.district) ? selected.district.join(',') : selected.district;
        params.projectName = Array.isArray(selected.project_name) ? selected.project_name.join(',') : selected.project_name;
        params.assetClass = Array.isArray(selected.asset_class) ? selected.asset_class.join(',') : selected.asset_class;
        params.propertyType = Array.isArray(selected.property_type) ? selected.property_type.join(',') : selected.property_type;
        params.page = pageNum;
        params.size = PAGE_LIMIT;
        if (sortState.key) {
          params.sort = `${sortState.key},${sortState.dir}`;
        } else {
          params.sort = "property_sold_area_sqm,desc";
        }
        params.propertyLayout = Array.isArray(selected.property_layout) ? selected.property_layout.join(',') : selected.property_layout;
        
        // Add language parameter
        params.language = window.MD.getLanguage();

        const data = await window.MD.fetchAPI("/api/feature/MarketData/RecentSales", params);
        if (!data || !data.content) break;
        allData = allData.concat(data.content);
      }

      if (!allData.length) {
        return { success: false, message: 'No data to export' };
      }

      const csv = [
        getColumns().map(c => c.label).join(","),
        ...allData.map(r =>
          COLUMNS.map(c => `"${c.fmt ? c.fmt(r[c.key]) : r[c.key] ?? ""}"`).join(",")
        )
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `recent_sales_${new Date().toISOString().split('T')[0]}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
      
      return { success: true };
    } catch (err) {
      console.error('Export error:', err);
      return { success: false, message: err.message };
    }
  };

  /* ===================== INIT ===================== */

  // Initialize filter placeholders immediately
  initializeFilterPlaceholders();

  document.addEventListener('DOMContentLoaded', () => {
    // Show skeleton loader immediately when tab is registered
    MD.TabManager.registerTabLoader('tab0', () => {
      if (window.SkeletonLoader) {
        window.SkeletonLoader.showTableSkeleton("salesTableContainer");
      }
      return populateTableFilters();
    });
    
    if (MD.TabManager.currentActiveTab === 'tab0') {
      if (window.SkeletonLoader) {
        window.SkeletonLoader.showTableSkeleton("salesTableContainer");
      }
      MD.TabManager.loadTab('tab0');
    }
  });
  
  window.reloadRecentSales = loadData;

})();
