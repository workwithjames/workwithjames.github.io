// ============================================================================
// TAB 1 CARDS: RESIDENTIAL LEASES CARDS
// Uses GLOBAL MD BASE_URL + TOKEN HANDLER
// ============================================================================

(function () {
  const LANGUAGE = (() => typeof window?.MD?.getLanguage === 'function' ? window.MD.getLanguage() : 'en')(); // Dynamically detect language mode

  /* -------------------- HELPERS -------------------- */

  function formatNumber(value) {
    return typeof value === "number" ? value.toLocaleString("en-US") : "--";
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
    console.log("formatYoY value:", value, "percentValue:", percentValue);
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
    if (!el) return;
    el.textContent = yoy.text;
    el.classList.remove("bg-successGreen", "bg-red-600");
    el.classList.add(yoy.isPositive ? "bg-successGreen" : "bg-red-600");
  }

  /* -------------------- DATA LOAD -------------------- */

  async function loadLeaseCards() {
    try {
      // ✅ Ensure token is ready
      await window.MD.waitForTokenReady();

      /* ---------------- Card 1: Rented Residential Units ---------------- */

      const unitsData = await window.MD.fetchAPI(
        "/api/feature/MarketData/GetRentedResiUnits",
        { language: LANGUAGE }
      );

      if (unitsData) {
        document.getElementById("rentedUnits").textContent =
          formatValue(unitsData.rented_units);

        applyYoY(
          document.getElementById("rentedUnitsYoY"),
          formatYoY(unitsData.rented_units_yoy_change)
        );
      }

      /* ---------------- Card 2: Apartment Rent Price Index ---------------- */

      const apartmentData = await window.MD.fetchAPI(
        "/api/feature/MarketData/GetRentPriceIndex",
        {
          propertyType: "apartment",
          language: LANGUAGE
        }
      );

      if (apartmentData) {
        document.getElementById("apartmentRPI").textContent =
          apartmentData.rent_index_value?.toFixed(2) ?? "N/A";

        applyYoY(
          document.getElementById("apartmentRPIYoY"),
          formatIndexYoY(apartmentData.index_yoy_change)
        );
      }

      /* ---------------- Card 3: Villa Rent Price Index ---------------- */

      const villaData = await window.MD.fetchAPI(
        "/api/feature/MarketData/GetRentPriceIndex",
        {
          propertyType: "villa",
          language: LANGUAGE
        }
      );

      if (villaData) {
        document.getElementById("villaRPI").textContent =
          villaData.rent_index_value?.toFixed(2) ?? "N/A";

        applyYoY(
          document.getElementById("villaRPIYoY"),
          formatIndexYoY(villaData.index_yoy_change)
        );
      }

    } catch (err) {
      console.error("Lease cards load error:", err);
    }
  }

  /* -------------------- INIT -------------------- */
  // Register with TabManager for lazy loading (only loads when tab1 is active)
  document.addEventListener("DOMContentLoaded", () => {
    // Show skeleton loaders immediately when tab loads
    const showSkeletons = () => {
      const cardElements = ['rentedUnits', 'apartmentRPI', 'villaRPI'];
      cardElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.innerHTML = '<div class="skeleton-loader-card"></div>';
        }
      });
    };
    
    showSkeletons(); // Show skeletons immediately
    
    MD.TabManager.registerTabLoader('tab1', loadLeaseCards);
    
    // If already on tab1, load immediately
    if (MD.TabManager.currentActiveTab === 'tab1') {
      MD.TabManager.loadTab('tab1');
    }
  });

})();
