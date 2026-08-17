(function () {
  'use strict';

  const WHATSAPP_NUMBER = '971528420933';
  const body = document.body;
  const nav = document.querySelector('.jr-nav');
  const menuButton = document.querySelector('[data-menu-toggle]');

  function track(event, details) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({
      event,
      landing_page: body.dataset.page || document.title,
      landing_host: window.location.hostname,
    }, details || {}));
  }

  function closeMenu() {
    body.classList.remove('menu-open');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
  }

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      const open = body.classList.toggle('menu-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('.jr-nav__links a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 12);
  }, { passive: true });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  function valueFor(field) {
    if (field.type === 'checkbox') return field.checked ? 'Yes' : '';
    return String(field.value || '').trim();
  }

  function fieldLabel(field) {
    return field.dataset.label || field.name || 'Detail';
  }

  document.querySelectorAll('[data-whatsapp-landing]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const rows = [];
      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        if (!field.name || field.type === 'hidden' || field.name === 'consent') return;
        const value = valueFor(field);
        if (value) rows.push(fieldLabel(field) + ': ' + value);
      });

      const pageName = form.dataset.page || document.title;
      const intro = form.dataset.intro || 'Hello James, I would like current UAE property information.';
      const message = [intro, '', 'Landing page: ' + pageName].concat(rows).join('\n');
      const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
      const status = form.querySelector('[data-form-status]');

      track('landing_lead_whatsapp', {
        lead_country: form.elements.country ? form.elements.country.value : '',
        lead_budget: form.elements.budget ? form.elements.budget.value : '',
        property_preference: form.elements.preference ? form.elements.preference.value : '',
        form_id: form.id || 'landing-enquiry',
      });

      if (status) status.textContent = form.dataset.opening || 'Opening WhatsApp…';
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });

  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (link) {
    link.addEventListener('click', function () {
      track('landing_whatsapp_click', { cta_label: link.textContent.trim(), cta_location: link.dataset.location || 'page' });
    });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener('click', function () {
      track('landing_phone_click', { cta_label: link.textContent.trim(), cta_location: link.dataset.location || 'page' });
    });
  });

  document.querySelectorAll('[data-cta]').forEach(function (link) {
    link.addEventListener('click', function () {
      track('landing_cta_click', {
        cta_label: link.textContent.trim(),
        cta_type: link.dataset.cta,
        cta_location: link.dataset.location || 'page',
      });
    });
  });

  document.querySelectorAll('.jr-faq details').forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) track('landing_faq_open', { faq_question: item.querySelector('summary').textContent.trim() });
    });
  });
})();
