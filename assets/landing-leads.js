(function () {
  const WHATSAPP_NUMBER = '971528420933';

  function valueFor(field) {
    if (field.type === 'checkbox') return field.checked ? 'Yes' : '';
    return String(field.value || '').trim();
  }

  function fieldLabel(field) {
    return field.dataset.label || field.name || 'Detail';
  }

  document.querySelectorAll('[data-whatsapp-landing]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = form.querySelector('[data-form-status]');
      if (!form.reportValidity()) return;

      const rows = [];
      form.querySelectorAll('input, select, textarea').forEach((field) => {
        if (!field.name || field.type === 'hidden' || field.name === 'consent') return;
        const value = valueFor(field);
        if (value) rows.push(`${fieldLabel(field)}: ${value}`);
      });

      const pageName = form.dataset.page || document.title;
      const intro = form.dataset.intro || 'Hello James, I would like current Dubai property information.';
      const message = [intro, '', `Landing page: ${pageName}`, ...rows].join('\n');
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'landing_lead_whatsapp',
        landing_page: pageName,
        lead_country: form.elements.country ? form.elements.country.value : '',
        lead_budget: form.elements.budget ? form.elements.budget.value : '',
        property_preference: form.elements.preference ? form.elements.preference.value : '',
      });
      if (status) status.textContent = form.dataset.opening || 'Opening WhatsApp…';
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });

  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
    link.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'landing_whatsapp_click', landing_page: document.title });
    });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'landing_phone_click', landing_page: document.title });
    });
  });
})();
