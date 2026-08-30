(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dataLayer = window.dataLayer = window.dataLayer || [];

  /* Shared layout repair: fixed header and balanced footer across Digital pages. */
  var layoutStyle = document.createElement("style");
  layoutStyle.setAttribute("data-digital-layout-fix", "20260830");
  layoutStyle.textContent = [
    ":root{--header:78px}",
    "body{padding-top:var(--header)}",
    ".site-header{position:fixed!important;top:0!important;left:0!important;right:0!important;width:100%!important;z-index:1000!important}",
    ".site-header.is-scrolled{box-shadow:0 12px 34px rgba(0,0,0,.22)}",
    ".site-footer{position:relative;padding:72px 0 44px!important;overflow:hidden}",
    ".site-footer:before{content:'';position:absolute;top:0;left:50%;width:min(1240px,calc(100% - 48px));height:1px;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(240,208,131,.34),transparent);pointer-events:none}",
    ".footer-grid{grid-template-columns:minmax(260px,1.35fr) minmax(140px,.62fr) minmax(160px,.72fr) minmax(230px,.95fr)!important;gap:clamp(30px,4vw,58px)!important;align-items:start}",
    ".footer-brand{margin-bottom:18px}",
    ".footer-grid>div:first-child p{max-width:360px!important;margin:0;color:#9b8f80!important;line-height:1.7!important}",
    ".footer-grid nav{gap:12px!important}",
    ".footer-grid nav strong{margin-bottom:9px!important;color:#a69580!important}",
    ".footer-grid nav a{display:inline-flex;width:max-content;max-width:100%;padding:2px 0;transition:color .2s ease,transform .2s ease}",
    ".footer-grid nav a:hover{color:#f0d083!important;transform:translateX(2px)}",
    ".footer-meta{position:relative;grid-template-columns:1fr!important;gap:14px!important;padding-left:24px;border-left:1px solid rgba(240,208,131,.13);line-height:1.65!important}",
    "@media(max-width:1050px){.footer-grid{grid-template-columns:1.25fr .75fr .85fr!important}.footer-meta{grid-column:1/-1!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;padding:24px 0 0!important;border-left:0!important;border-top:1px solid rgba(240,208,131,.11)}}",
    "@media(max-width:900px){:root{--header:70px}.nav-shell{min-height:var(--header)!important}.site-footer{padding:58px 0 34px!important}.footer-grid{grid-template-columns:1.15fr .85fr!important;gap:34px 28px!important}.footer-grid>div:first-child{grid-column:1/-1}.footer-grid>div:first-child p{max-width:520px!important}.footer-meta{grid-column:1/-1!important;grid-template-columns:1fr!important;gap:9px!important;padding-top:22px!important}.mobile-nav{max-height:calc(100svh - var(--header));overflow-y:auto}}",
    "@media(max-width:560px){.section-shell,.nav-shell{width:min(var(--max),calc(100% - 32px))}.site-footer:before{width:calc(100% - 32px)}.site-footer{padding:50px 0 30px!important}.footer-grid{grid-template-columns:1fr 1fr!important;gap:30px 22px!important}.footer-grid>div:first-child,.footer-meta{grid-column:1/-1!important}.footer-grid nav a{width:auto}.footer-meta{font-size:.76rem!important}.footer-brand{margin-bottom:14px}}"
  ].join("");
  document.head.appendChild(layoutStyle);

  function ensureGTM() {
    var containerId = "GTM-M74SL57L";
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js?id=' + containerId + '"]')) return;
    dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(containerId);
    document.head.appendChild(script);
  }
  ensureGTM();

  if (!reducedMotion) root.classList.add("js-motion");

  function track(eventName, details) {
    var payload = Object.assign({ event: eventName, page_path: window.location.pathname }, details || {});
    dataLayer.push(payload);
  }

  var header = document.querySelector(".site-header");
  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  var menuButton = document.querySelector(".menu-button");
  var mobileNav = document.getElementById("mobile-nav");
  function setMenu(open) {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute("aria-expanded", String(open));
    var label = menuButton.querySelector("span");
    if (label) label.textContent = open ? "Close" : "Menu";
    mobileNav.hidden = !open;
    body.classList.toggle("menu-open", open);
  }
  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setMenu(false);
    }, { passive: true });
  }

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = new Date().getFullYear();
  });

  document.querySelectorAll(".section-heading,.split-heading,.work-card,.problem-grid article,.capability-grid article,.trust-grid article,.process-rail li,.price-grid article,.case-sections>section,.fit-grid article,.engagement-model-grid article").forEach(function (node) {
    node.setAttribute("data-reveal", "");
  });

  if (!reducedMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });
    document.querySelectorAll("[data-reveal]").forEach(function (node) {
      revealObserver.observe(node);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (node) {
      node.classList.add("is-visible");
    });
  }

  document.querySelectorAll("[data-event]").forEach(function (node) {
    node.addEventListener("click", function () {
      var eventName = node.getAttribute("data-event");
      var details = {};
      if (node.getAttribute("data-case-study")) details.case_study = node.getAttribute("data-case-study");
      if (node.href) details.link_url = node.href;
      track(eventName, details);
    });
  });

  var pageType = body.getAttribute("data-page-type");
  if (pageType === "portfolio") track("portfolio_view");
  if (pageType === "pricing") track("pricing_view");
  if (pageType === "case-study") {
    var caseNode = document.querySelector("[data-case-title]");
    track("case_study_view", { case_study: caseNode ? caseNode.getAttribute("data-case-title") : document.title });
  }

  if ("IntersectionObserver" in window) {
    var viewObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          track(entry.target.getAttribute("data-view-event"));
          viewObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.28 });
    document.querySelectorAll("[data-view-event]").forEach(function (node) {
      viewObserver.observe(node);
    });
  }

  var filterGroups = document.querySelectorAll("[data-filter-group]");
  if (filterGroups.length) {
    var activeFilters = { service: "All", industry: "All", classification: "All" };
    var cards = document.querySelectorAll("[data-project-card]");
    var featuredCards = document.querySelectorAll(".portfolio-featured [data-project-card]");
    var allCards = document.querySelectorAll(".portfolio-all-grid [data-project-card]");
    var countNode = document.querySelector("[data-visible-count]");
    var featuredIds = new Set(Array.prototype.map.call(featuredCards, function (card) {
      var link = card.querySelector("[data-case-study]");
      return link ? link.getAttribute("data-case-study") : "";
    }).filter(Boolean));

    allCards.forEach(function (card) {
      var link = card.querySelector("[data-case-study]");
      var id = link ? link.getAttribute("data-case-study") : "";
      if (id && featuredIds.has(id)) card.setAttribute("data-portfolio-duplicate", "true");
    });

    var moreLabel = document.querySelector(".all-projects-label .kicker");
    var moreCopy = document.querySelector(".all-projects-label .kicker + p");
    if (moreLabel) moreLabel.textContent = "More projects";
    if (moreCopy) moreCopy.textContent = "Additional public examples beyond the featured selection.";

    function cardMatches(card) {
      var service = card.getAttribute("data-service") || "";
      var industry = card.getAttribute("data-industry") || "";
      var classification = card.getAttribute("data-classification") || "";
      var serviceMatch = activeFilters.service === "All" || service.indexOf(activeFilters.service) !== -1;
      var industryMatch = activeFilters.industry === "All" || industry.indexOf(activeFilters.industry) !== -1;
      var classificationMatch = activeFilters.classification === "All" || classification === activeFilters.classification;
      return serviceMatch && industryMatch && classificationMatch;
    }

    function applyFilters() {
      cards.forEach(function (card) {
        var duplicate = card.getAttribute("data-portfolio-duplicate") === "true";
        card.hidden = !cardMatches(card) || duplicate;
      });
      var visibleFeatured = Array.prototype.filter.call(featuredCards, function (card) { return !card.hidden; }).length;
      var visibleMore = Array.prototype.filter.call(allCards, function (card) { return !card.hidden; }).length;
      if (countNode) countNode.textContent = String(visibleFeatured + visibleMore);
    }

    filterGroups.forEach(function (group) {
      var groupName = group.getAttribute("data-filter-group");
      group.querySelectorAll("button[data-filter]").forEach(function (button) {
        button.addEventListener("click", function () {
          group.querySelectorAll("button").forEach(function (item) { item.classList.remove("is-active"); });
          button.classList.add("is-active");
          activeFilters[groupName] = button.getAttribute("data-filter");
          applyFilters();
          track("portfolio_filter", {
            filter_group: groupName,
            filter_value: activeFilters[groupName]
          });
        });
      });
    });
    applyFilters();
  }

  function formObject(form) {
    var out = {};
    new FormData(form).forEach(function (value, key) {
      if (!key.startsWith("_")) out[key] = String(value);
    });
    return out;
  }

  function sourceContext(params) {
    var keys = ["service", "industry", "objective", "project"];
    var parts = keys.map(function (key) {
      var value = params.get(key);
      return value ? key + ": " + value : "";
    }).filter(Boolean);
    return parts.length ? "Enquiry source context\n" + parts.join("\n") : "";
  }

  function contextMeta(obj) {
    var params = new URLSearchParams(location.search);
    var intent = sourceContext(params);
    obj.landing_page = location.pathname + location.search;
    obj.referrer = document.referrer || "";
    obj.utm_source = params.get("utm_source") || "";
    obj.utm_medium = params.get("utm_medium") || "";
    obj.utm_campaign = params.get("utm_campaign") || "";
    obj.consent = obj.consent === true || obj.consent === "true" || obj.consent === "on" || obj.consent === "yes";
    if (intent) {
      if (Object.prototype.hasOwnProperty.call(obj, "topic")) obj.topic = [obj.topic || "", intent].filter(Boolean).join("\n\n");
      else obj.context = [obj.context || "", intent].filter(Boolean).join("\n\n");
    }
    return obj;
  }

  function localDateTimeValue(date) {
    function pad(value) { return String(value).padStart(2, "0"); }
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function setStatus(node, message, state) {
    if (!node) return;
    node.textContent = message;
    node.dataset.state = state || "";
  }

  async function submitJson(url, payload) {
    var response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    var data = {};
    try { data = await response.json(); } catch (error) {}
    if (!response.ok) throw new Error(data.error || "Request could not be saved");
    return data;
  }

  var lead = document.getElementById("lead-form");
  if (lead) {
    var next = lead.querySelector("[data-lead-next]");
    var step2 = lead.querySelector('[data-step="2"]');
    var status = lead.querySelector("[data-form-status]");
    if (next) next.addEventListener("click", function () {
      var invalid = Array.from(lead.querySelectorAll('[data-step="1"] [required]')).find(function (element) { return !element.checkValidity(); });
      if (invalid) {
        invalid.reportValidity();
        return;
      }
      step2.hidden = false;
      next.hidden = true;
      step2.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
    lead.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!lead.checkValidity()) {
        lead.reportValidity();
        return;
      }
      var button = lead.querySelector('[type="submit"]');
      button.disabled = true;
      setStatus(status, "Saving your project enquiry securely…", "");
      try {
        var data = await submitJson("/api/digital-lead", contextMeta(formObject(lead)));
        setStatus(status, "Enquiry received. Reference " + data.lead_id + ". Response target: within one business day.", "success");
        track("digital_lead_captured", { lead_priority: data.priority || "", lead_score: data.lead_score || 0 });
        lead.reset();
        if (step2) step2.hidden = false;
      } catch (error) {
        setStatus(status, "The secure form could not save your enquiry. Please email james@jamesrealty.uk.", "error");
        track("digital_lead_error", { error: String(error.message || error) });
      } finally {
        button.disabled = false;
      }
    });
  }

  var call = document.getElementById("call-form");
  if (call) {
    var date = call.querySelector("#call-date");
    var zone = call.querySelector("#call-timezone");
    var statusCall = call.querySelector("[data-form-status]");
    var detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    if (zone) {
      zone.value = detectedZone;
      zone.readOnly = true;
    }
    if (date) {
      var minimum = new Date(Date.now() + 2 * 60 * 60 * 1000);
      date.min = localDateTimeValue(minimum);
    }
    call.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!call.checkValidity()) {
        call.reportValidity();
        return;
      }
      var button = call.querySelector('[type="submit"]');
      button.disabled = true;
      setStatus(statusCall, "Saving your call request…", "");
      try {
        var payload = contextMeta(formObject(call));
        var data = await submitJson("/api/digital-call", payload);
        setStatus(statusCall, "Call request received. Reference " + data.lead_id + ". Your preferred time is provisional until confirmed.", "success");
        var calendar = call.querySelector("[data-call-calendar]");
        if (calendar && payload.preferred_time) {
          var start = new Date(payload.preferred_time);
          var end = new Date(start.getTime() + 30 * 60000);
          var stamp = function (value) { return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
          calendar.href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Provisional call with James Digital") + "&dates=" + stamp(start) + "/" + stamp(end) + "&details=" + encodeURIComponent("Provisional hold. James will confirm the call separately.") + "&ctz=" + encodeURIComponent(payload.timezone || detectedZone);
          calendar.hidden = false;
        }
        track("digital_call_requested");
      } catch (error) {
        setStatus(statusCall, "The secure call request could not be saved. Please email james@jamesrealty.uk.", "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  if (!document.querySelector(".mobile-conversion-bar") && !document.body.classList.contains("start-project-page") && !document.body.classList.contains("request-call-page")) {
    var bar = document.createElement("div");
    bar.className = "mobile-conversion-bar";
    bar.innerHTML = '<a href="/start-project">Start a Project</a><a href="/request-call">Request a Call</a>';
    document.body.appendChild(bar);
  }
})();
