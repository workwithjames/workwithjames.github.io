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

  function formObject(form){var out={};new FormData(form).forEach(function(v,k){if(!k.startsWith('_'))out[k]=String(v)});return out}
  function contextMeta(obj){var p=new URLSearchParams(location.search);obj.landing_page=location.pathname;obj.referrer=document.referrer||'';obj.utm_source=p.get('utm_source')||'';obj.utm_medium=p.get('utm_medium')||'';obj.utm_campaign=p.get('utm_campaign')||'';obj.consent=true;return obj}
  function setStatus(node,message,state){if(!node)return;node.textContent=message;node.dataset.state=state||''}
  async function submitJson(url,payload){var r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});var data={};try{data=await r.json()}catch(e){}if(!r.ok)throw new Error(data.error||'Request could not be saved');return data}

  var lead=document.getElementById('lead-form');
  if(lead){
    var next=lead.querySelector('[data-lead-next]'), step2=lead.querySelector('[data-step="2"]'), status=lead.querySelector('[data-form-status]');
    if(next)next.addEventListener('click',function(){var bad=Array.from(lead.querySelectorAll('[data-step="1"] [required]')).find(function(el){return !el.checkValidity()});if(bad){bad.reportValidity();return}step2.hidden=false;next.hidden=true;step2.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'})});
    lead.addEventListener('submit',async function(e){e.preventDefault();if(!lead.checkValidity()){lead.reportValidity();return}var btn=lead.querySelector('[type="submit"]');btn.disabled=true;setStatus(status,'Saving your project enquiry securely…','');try{var data=await submitJson('/api/digital-lead',contextMeta(formObject(lead)));setStatus(status,'Enquiry received. Reference '+data.lead_id+'. Response target: within one business day.','success');track('digital_lead_captured',{lead_priority:data.priority||'',lead_score:data.lead_score||0});lead.reset();if(step2)step2.hidden=false}catch(err){setStatus(status,'The secure form could not save your enquiry. Please email james@jamesrealty.uk.','error');track('digital_lead_error',{error:String(err.message||err)})}finally{btn.disabled=false}});
  }
  var call=document.getElementById('call-form');
  if(call){
    var date=call.querySelector('#call-date'),zone=call.querySelector('#call-timezone'),statusCall=call.querySelector('[data-form-status]');
    if(zone)zone.value=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';if(date){var n=new Date();n.setHours(n.getHours()+2);date.min=n.toISOString().slice(0,16)}
    call.addEventListener('submit',async function(e){e.preventDefault();if(!call.checkValidity()){call.reportValidity();return}var btn=call.querySelector('[type="submit"]');btn.disabled=true;setStatus(statusCall,'Saving your call request…','');try{var payload=contextMeta(formObject(call)),data=await submitJson('/api/digital-call',payload);setStatus(statusCall,'Call request received. Reference '+data.lead_id+'. Your preferred time is provisional until confirmed.','success');var cal=call.querySelector('[data-call-calendar]');if(cal&&payload.preferred_time){var s=new Date(payload.preferred_time),en=new Date(s.getTime()+30*60000),stamp=function(d){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')};cal.href='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Provisional call with James Digital')+'&dates='+stamp(s)+'/'+stamp(en)+'&details='+encodeURIComponent('Provisional hold. James will confirm the call separately.')+'&ctz='+encodeURIComponent(payload.timezone||'UTC');cal.hidden=false}track('digital_call_requested')}catch(err){setStatus(statusCall,'The secure call request could not be saved. Please email james@jamesrealty.uk.','error')}finally{btn.disabled=false}});
  }
  if(!document.querySelector('.mobile-conversion-bar')&&!document.body.classList.contains('start-project-page')&&!document.body.classList.contains('request-call-page')){var bar=document.createElement('div');bar.className='mobile-conversion-bar';bar.innerHTML='<a href="/start-project">Start a Project</a><a href="/request-call">Request a Call</a>';document.body.appendChild(bar)}
})();
