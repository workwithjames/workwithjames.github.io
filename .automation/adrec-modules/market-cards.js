const LANGUAGE = (() => typeof window?.MD?.getLanguage === 'function' ? window.MD.getLanguage() : 'en')(); // Dynamically detect language mode

/* -------------------- HELPERS -------------------- */

function formatBillion(value) {
  if (!value) return "--";
  return (value / 1e9).toFixed(2) + "bn";
}

function formatNumber(value) {
  return value ? value.toLocaleString("en-US") : "--";
}

function formatValue(value) {
  if (!value) return "--";
  // Format as millions or billions with 2 decimals
  if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + "bn";
  } else if (value >= 1e6) {
    return (value / 1e6).toFixed(2) + "m";
  }
  // For regular numbers, add thousand separators (no decimals for whole numbers)
  const numValue = parseFloat(value);
  if (Number.isInteger(numValue)) {
    return numValue.toLocaleString("en-US");
  }
  return numValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatYoY(value) {
  if (value === null || value === undefined) {
    return { text: "N/A", isPositive: true };
  }
  // For non-index YoY changes: multiply by 100 and add percent sign
  const percentValue = value * 100;
  return {
    text: `${percentValue.toFixed(2)}% YoY`,
    isPositive: value >= 0
  };
}

function formatIndexYoY(value) {
  if (value === null || value === undefined) {
    return { text: "N/A", isPositive: true };
  }
  // For index YoY changes: no multiplication, no percent sign
  return {
    text: `${value.toFixed(2)} YoY`,
    isPositive: value >= 0
  };
}

function applyYoY(el, yoy) {
  const span = el.querySelector('span') || el;
  span.textContent = yoy.text;
  el.classList.add(yoy.isPositive ? "bg-successGreen" : "bg-red-600");
}

/* -------------------- API CALLS -------------------- */

async function fetchJSON(url) {
  const u = new URL(url, window.location.origin);
  return MD.fetchAPI(u.pathname, Object.fromEntries(u.searchParams));
}

async function loadCards() {
  try {
    /* Card 1 – Transactional Value */
    try {
      const response = await MD.fetchAPI('/api/feature/MarketData/TotalTransactionalValue', { language: MD.getLanguage() });
      const valueData = response;
      const txnEl = document.getElementById("txnValue");
      if (txnEl && valueData) txnEl.textContent = formatValue(valueData.txn_value_aed);
      const yoYEl = document.getElementById("txnValueYoY");
      if (yoYEl && valueData) {
        const yoYFormatted = formatYoY(valueData.value_yoy_change);
        yoYEl.textContent = yoYFormatted.text;
      }
    } catch (e) {
      console.error('Error loading TotalTransactionalValue:', e);
      const txnEl = document.getElementById("txnValue");
      if (txnEl) txnEl.textContent = 'N/A';
    }

    /* Card 2 – Transactional Volume */
    try {
      const response = await MD.fetchAPI('/api/feature/MarketData/TotalTransactionalVolume', { language: MD.getLanguage() });
      const volumeData = response?.Data || response;
      const volEl = document.getElementById("txnVolume");
      if (volEl && volumeData) volEl.textContent = formatValue(volumeData.txn_volume);
      const volYoYEl = document.getElementById("txnVolumeYoY");
      if (volYoYEl && volumeData) {
        const volYoYFormatted = formatYoY(volumeData.volume_yoy_change);
        volYoYEl.textContent = volYoYFormatted.text;
      }
    } catch (e) {
      console.error('Error loading TotalTransactionalVolume:', e);
      const volEl = document.getElementById("txnVolume");
      if (volEl) volEl.textContent = 'N/A';
    }

    /* Card 3 – Apartment Sale Price Index */
    try {
      const response = await MD.fetchAPI(
        '/api/feature/MarketData/GetSalePriceIndex',
        { propertyType: 'apartment', language: LANGUAGE }
      );
      const aptData = response?.Data || response;
      const aptEl = document.getElementById("aptSaleIndex");
      if (aptEl && aptData) aptEl.textContent = aptData.sale_index_value?.toFixed(2) ?? "N/A";
      const aptYoYEl = document.getElementById("aptSaleIndexYoY");
      if (aptYoYEl && aptData) {
        const aptYoYFormatted = formatIndexYoY(aptData.index_yoy_change);
        aptYoYEl.textContent = aptYoYFormatted.text;
      }
    } catch (e) {
      console.error('Error loading GetSalePriceIndex (apartment):', e);
      const aptEl = document.getElementById("aptSaleIndex");
      if (aptEl) aptEl.textContent = 'N/A';
    }

    /* Card 4 – Villa Sale Price Index */
    try {
      const response = await MD.fetchAPI(
        '/api/feature/MarketData/GetSalePriceIndex',
        { propertyType: 'villa', language: LANGUAGE }
      );
      const villaData = response?.Data || response;
      const villaEl = document.getElementById("villaSaleIndex");
      if (villaEl && villaData) villaEl.textContent = villaData.sale_index_value?.toFixed(2) ?? "N/A";
      const villaYoYEl = document.getElementById("villaSaleIndexYoY");
      if (villaYoYEl && villaData) {
        const villaYoYFormatted = formatIndexYoY(villaData.index_yoy_change);
        villaYoYEl.textContent = villaYoYFormatted.text;
      }
    } catch (e) {
      console.error('Error loading GetSalePriceIndex (villa):', e);
      const villaEl = document.getElementById("villaSaleIndex");
      if (villaEl) villaEl.textContent = 'N/A';
    }

  } catch (err) {
    console.error("Market cards error:", err);
  }
}

/* -------------------- INIT -------------------- */
// Register with TabManager for lazy loading (only loads when tab0 is active)
document.addEventListener("DOMContentLoaded", () => {
  // Clear initial "--" placeholders and show skeleton loaders
  const showSkeletons = () => {
    const cardElements = ['txnValue', 'txnVolume', 'aptSaleIndex', 'villaSaleIndex'];
    cardElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = '';
        el.innerHTML = '<div class="skeleton-loader-card"></div>';
      }
    });
  };
  
  showSkeletons(); // Show skeletons immediately
  
  MD.TabManager.registerTabLoader('tab0', loadCards);
  
  // If already on tab0, load immediately
  if (MD.TabManager.currentActiveTab === 'tab0') {
    MD.TabManager.loadTab('tab0');
  }
});
