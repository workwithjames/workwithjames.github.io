(function(){
  'use strict';
  var ENDPOINT='https://dubai.jamesrealty.uk/api/lead';
  var STORAGE_KEY='jr_pending_property_lead';

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function storageGet(){try{return localStorage.getItem(STORAGE_KEY);}catch(error){return null;}}
  function storageSet(value){try{localStorage.setItem(STORAGE_KEY,value);return true;}catch(error){return false;}}
  function storageRemove(){try{localStorage.removeItem(STORAGE_KEY);}catch(error){}}
  function track(name,data){window.dataLayer=window.dataLayer||[];window.dataLayer.push(Object.assign({event:name},data||{}));}
  function id(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function') return window.crypto.randomUUID();
    var values=new Uint32Array(4);window.crypto.getRandomValues(values);return Array.prototype.map.call(values,function(value){return value.toString(16).padStart(8,'0');}).join('');
  }
  function attribution(){
    var params=new URLSearchParams(location.search);
    var saved={};
    try{saved=JSON.parse(sessionStorage.getItem('james_attribution')||'{}');}catch(error){}
    return {utm_source:params.get('utm_source')||saved.utm_source||'',utm_medium:params.get('utm_medium')||saved.utm_medium||'',utm_campaign:params.get('utm_campaign')||saved.utm_campaign||'',utm_content:params.get('utm_content')||saved.utm_content||'',utm_term:params.get('utm_term')||saved.utm_term||''};
  }
  function formValue(form,names){
    for(var i=0;i<names.length;i+=1){var field=form.elements[names[i]];if(field&&clean(field.value)) return clean(field.value);}
    return '';
  }
  function buildPayload(form,options){
    options=options||{};
    var source=attribution();
    var intent=clean(options.intent||form.dataset.journey||formValue(form,['goal','purpose'])||'Property enquiry');
    var budget=formValue(form,['budget','price','expected_price','media_budget'])||'Not stated for this enquiry';
    var preference=formValue(form,['areas','property_location','project','property_type','seller_property_type','interest','location']);
    var notes=[];
    Array.prototype.forEach.call(form.querySelectorAll('[name]'),function(field){
      if(field.disabled||['name','phone','email','budget','consent','honeypot','company_website'].indexOf(field.name)>-1) return;
      var value=field.type==='checkbox'?(field.checked?'Yes':''):clean(field.value);
      if(value) notes.push(clean(field.dataset.label||field.name.replace(/[_-]+/g,' '))+': '+value);
    });
    return {
      submission_id:id(),name:formValue(form,['name']),phone:formValue(form,['phone','whatsapp']),email:formValue(form,['email']),country:formValue(form,['location','country']),
      budget:budget,preference:preference,interest:intent,notes:notes.join(' | ').slice(0,600),landing_page:location.pathname,referrer:document.referrer.slice(0,500),
      utm_source:source.utm_source,utm_medium:source.utm_medium,utm_campaign:source.utm_campaign,utm_content:source.utm_content,utm_term:source.utm_term,consent:Boolean(form.elements.consent&&form.elements.consent.checked),honeypot:formValue(form,['honeypot','company_website'])
    };
  }
  async function send(payload){
    storageSet(JSON.stringify(payload));
    var response=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},credentials:'omit',body:JSON.stringify(payload)});
    var result=await response.json().catch(function(){return {};});
    if(!response.ok||!result.ok) throw new Error(result.error||('HTTP '+response.status));
    storageRemove();return result;
  }
  function ensureFields(form){
    if(!form.matches('[data-whatsapp-qualifier]')||form.querySelector('[data-property-contact-fields]')) return;
    var wrap=document.createElement('div');wrap.className='property-contact-fields full';wrap.setAttribute('data-property-contact-fields','');
    wrap.innerHTML='<label>Name<input name="name" autocomplete="name" required placeholder="Your name"></label><label>Phone / WhatsApp<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="+971 50 000 0000"></label><label class="full">Email<input name="email" type="email" autocomplete="email" placeholder="name@email.com"></label>';
    form.insertBefore(wrap,form.firstChild);
    var consent=document.createElement('label');consent.className='property-lead-consent full';
    consent.innerHTML='<input name="consent" type="checkbox" required><span>I agree that James Realty may securely store and use this enquiry to respond and provide property decision support. See the <a href="/privacy-policy/">Privacy Policy</a>.</span>';
    var submit=form.querySelector('.qualifier-submit');form.insertBefore(consent,submit||null);
  }
  function updateCopy(){
    document.querySelectorAll('.qualifier-copy p:last-child,.qualifier-note,.contact-goal-submit-copy').forEach(function(node){
      if(/not stored|does not send data|does not submit data/i.test(node.textContent||'')) node.textContent='Your enquiry is securely captured before WhatsApp opens, with your consent, so the request is not lost if WhatsApp is interrupted.';
    });
  }
  async function retry(){try{var pending=JSON.parse(storageGet()||'null');if(!pending)return;await send(pending);track('property_lead_retry_saved',{lead_id:pending.submission_id});}catch(error){}}
  function init(){document.querySelectorAll('[data-whatsapp-qualifier]').forEach(ensureFields);updateCopy();retry();}
  window.jrPropertyLeads={buildPayload:buildPayload,send:send,track:track,clean:clean,ensureFields:ensureFields};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
