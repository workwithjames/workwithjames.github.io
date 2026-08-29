(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dataLayer = window.dataLayer = window.dataLayer || [];

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
    var allCards = document.querySelectorAll(".portfolio-all-grid [data-project-card]");
    var countNode = document.querySelector("[data-visible-count]");

    function applyFilters() {
      cards.forEach(function (card) {
        var service = card.getAttribute("data-service") || "";
        var industry = card.getAttribute("data-industry") || "";
        var classification = card.getAttribute("data-classification") || "";
        var serviceMatch = activeFilters.service === "All" || service.indexOf(activeFilters.service) !== -1;
        var industryMatch = activeFilters.industry === "All" || industry.indexOf(activeFilters.industry) !== -1;
        var classificationMatch = activeFilters.classification === "All" || classification === activeFilters.classification;
        card.hidden = !(serviceMatch && industryMatch && classificationMatch);
      });
      var visible = Array.prototype.filter.call(allCards, function (card) { return !card.hidden; }).length;
      if (countNode) countNode.textContent = String(visible);
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
  }

  var form = document.getElementById("project-form");
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var route = params.get("route") || "project";
    var routeInput = document.getElementById("route");
    var reply = document.getElementById("reply");
    var heading = document.querySelector("[data-form-heading]");
    var intro = document.querySelector("[data-form-intro]");
    var objective = document.getElementById("objective");
    var description = document.getElementById("description");
    var routeLinks = document.querySelectorAll("[data-route-link]");

    routeInput.value = route;
    routeLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-route-link") === route);
    });

    if (route === "call") {
      if (heading) heading.textContent = "Request a focused project call.";
      if (intro) intro.textContent = "Share the context first so the call can begin with the right questions.";
      if (reply) reply.value = "Phone / video call";
    }
    if (route === "email") {
      if (heading) heading.textContent = "Request a detailed email reply.";
      if (intro) intro.textContent = "Share the project context and the email address you want James to use.";
      if (reply) reply.value = "Email";
    }

    var serviceParam = params.get("service");
    if (serviceParam) {
      form.querySelectorAll('input[name="services"]').forEach(function (checkbox) {
        checkbox.checked = checkbox.value === serviceParam;
      });
    }
    var objectiveParam = params.get("objective");
    if (objectiveParam && objective) {
      var matchingOption = Array.prototype.find.call(objective.options, function (option) {
        return option.text.toLowerCase().indexOf(objectiveParam.toLowerCase().replace("i need ", "").replace("my ", "")) !== -1;
      });
      if (matchingOption) objective.value = matchingOption.value;
    }
    var contextParts = [];
    ["package", "project", "industry", "engagement"].forEach(function (key) {
      var value = params.get(key);
      if (value) contextParts.push(key.charAt(0).toUpperCase() + key.slice(1) + ": " + value);
    });
    if (contextParts.length && description) description.value = contextParts.join(String.fromCharCode(10)) + String.fromCharCode(10) + String.fromCharCode(10);

    var started = false;
    form.addEventListener("input", function () {
      if (!started) {
        started = true;
        track("form_start", { form_name: "project_qualification", route: route });
      }
    }, { once: true });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = document.getElementById("form-status");
      var success = document.getElementById("form-success");
      var continueLink = document.getElementById("continue-whatsapp");
      var selectedServices = Array.prototype.map.call(form.querySelectorAll('input[name="services"]:checked'), function (checkbox) {
        return checkbox.value;
      });

      form.querySelectorAll("[aria-invalid]").forEach(function (node) { node.removeAttribute("aria-invalid"); });
      if (!selectedServices.length) {
        if (status) status.textContent = "Select at least one required service.";
        form.querySelector(".service-checkboxes").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        return;
      }
      if (!form.checkValidity()) {
        var invalid = form.querySelector(":invalid");
        if (invalid) {
          invalid.setAttribute("aria-invalid", "true");
          invalid.focus();
        }
        if (status) status.textContent = "Complete the required fields before preparing the brief.";
        return;
      }

      var formData = new FormData(form);
      var lines = [
        "Hi James, I would like to discuss a digital project.",
        "",
        "Name: " + formData.get("name"),
        "Company: " + formData.get("company"),
        formData.get("website") ? "Website: " + formData.get("website") : "",
        "Country: " + formData.get("country"),
        "Contact: " + formData.get("contact"),
        "Required services: " + selectedServices.join(", "),
        "Main objective: " + formData.get("objective"),
        "Budget range: " + formData.get("budget"),
        "Timeline: " + formData.get("timeline"),
        "Preferred reply: " + formData.get("reply"),
        "",
        "Project description:",
        formData.get("description")
      ].filter(Boolean);
      var brief = lines.join(String.fromCharCode(10));
      var whatsappUrl = "https://wa.me/971528420933?text=" + encodeURIComponent(brief);
      continueLink.href = whatsappUrl;
      continueLink.dataset.brief = brief;
      if (status) status.textContent = "";
      success.hidden = false;
      success.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      track("form_submission", {
        form_name: "project_qualification",
        route: route,
        service_count: selectedServices.length,
        budget_range: formData.get("budget"),
        timeline: formData.get("timeline")
      });
    });

    var copyButton = document.getElementById("copy-brief");
    if (copyButton) {
      copyButton.addEventListener("click", function () {
        var brief = document.getElementById("continue-whatsapp").dataset.brief || "";
        if (!brief) return;
        navigator.clipboard.writeText(brief).then(function () {
          copyButton.textContent = "Brief copied";
          track("project_brief_copy");
        }).catch(function () {
          copyButton.textContent = "Select and copy from WhatsApp";
        });
      });
    }
  }
})();
