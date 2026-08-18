(()=>{
  'use strict';
  const dataLayer=window.dataLayer=window.dataLayer||[];
  const pageName=document.body.dataset.page||document.title;
  const isArabic=document.documentElement.dir==='rtl';
  const track=(event,detail={})=>dataLayer.push({event,landing_page:pageName,landing_host:location.host,...detail});
  const qs=(selector,root=document)=>root.querySelector(selector);
  const qsa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const whatsappBase='https://wa.me/971528420933';

  /* Remove the em dash from all rendered landing-page copy. Use normal comma
     punctuation instead so the copy reads naturally without the AI-writing cue. */
  const normalizePunctuation=(root=document.body)=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      if(!node.nodeValue?.includes('—')) return NodeFilter.FILTER_REJECT;
      const parent=node.parentElement?.tagName;
      if(parent==='SCRIPT'||parent==='STYLE'||parent==='NOSCRIPT') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{node.nodeValue=node.nodeValue.replace(/\s*—\s*/g,', ');});
    qsa('[alt],[title],[aria-label]',root).forEach(element=>{
      for(const attr of ['alt','title','aria-label']){
        const value=element.getAttribute(attr);
        if(value?.includes('—')) element.setAttribute(attr,value.replace(/\s*—\s*/g,', '));
      }
    });
  };
  normalizePunctuation();

  /* Conversion polish is applied through the shared runtime so every current bespoke
     landing page keeps its developer/country-specific HTML and premium CSS intact. */
  qsa('a[href^="tel:+971528420933"]').forEach(link=>{
    const isFormContact=link.classList.contains('jr-phone');
    link.href=whatsappBase;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.removeAttribute('data-phone-action');
    link.setAttribute('data-whatsapp-action','');
    link.dataset.location=isFormContact?'form':'mobile-sticky';
    if(isFormContact){
      link.className='jr-button jr-button--ghost jr-whatsapp-contact';
      link.innerHTML=`${isArabic?'تواصل عبر واتساب':'Chat on WhatsApp'} <span aria-hidden="true">↗</span>`;
    }else{
      link.innerHTML=`${isArabic?'واتساب':'WhatsApp'} <span aria-hidden="true">↗</span>`;
    }
  });

  /* A few older investor-card visuals were only 430px wide and then cropped into
     landscape cards. Replace only those known soft assets with larger existing,
     context-matched James Realty imagery. Heroes and already-good project assets stay untouched. */
  const imageUpgrades={
    '/images/investors/uk-dubai-hills-apartment.webp':{src:'https://jamesrealty.uk/images/projects/emaar-golf-community-apartments.webp',width:724,height:543,alt:'Representative Emaar golf-community residences for Golf Vale comparison'},
    '/images/investors/uk-downtown-dubai-apartment.webp':{src:'https://jamesrealty.uk/images/landing/emaar-dubai-waterfront-investment.webp',width:1600,height:900,alt:'Representative Emaar waterfront residences for Creek Bay comparison'},
    '/images/investors/usa-dubai-marina-apartment.webp':{src:'https://jamesrealty.uk/images/landing/emaar-dubai-waterfront-investment.webp',width:1600,height:900,alt:'Representative Emaar waterfront residences for Creek Bay comparison'},
    '/images/investors/usa-dubai-townhouse.webp':{src:'https://jamesrealty.uk/images/landing/damac-branded-waterfront-residences.webp',width:1600,height:900,alt:'Representative branded waterfront residences for Chelsea Residences comparison'},
    '/images/investors/india-dubai-creek-apartment.webp':{src:'https://jamesrealty.uk/images/projects/binghatti-crystalline-apartments.webp',width:724,height:543,alt:'Representative geometric Binghatti-style Dubai apartments for Skyflame comparison'},
    '/images/investors/india-waterfront-offplan.webp':{src:'https://jamesrealty.uk/images/projects/emaar-golf-community-apartments.webp',width:724,height:543,alt:'Representative Emaar golf-community residences for Golf Fields comparison'},
    '/images/investors/arabic-dubai-villa-courtyard.webp':{src:'https://jamesrealty.uk/images/landing/nakheel-dubai-island-waterfront.webp',width:1600,height:900,alt:'مساكن على واجهة بحرية في دبي تمثل مقارنة مشروع بالم سنترال في نخلة جبل علي'},
    '/images/investors/arabic-downtown-apartment.webp':{src:'https://jamesrealty.uk/images/landing/aldar-yas-waterfront-investment.webp',width:1600,height:900,alt:'مساكن على واجهة جزيرة ياس البحرية تمثل مقارنة مشروع ذا كانوبيز, ياس بوينت'}
  };
  qsa('.jr-project img').forEach(img=>{
    const key=new URL(img.src,location.href).pathname;
    const replacement=imageUpgrades[key];
    if(replacement){
      img.src=replacement.src;
      img.width=replacement.width;
      img.height=replacement.height;
      img.alt=replacement.alt;
    }
    if(!img.loading) img.loading='lazy';
    if(!img.decoding) img.decoding='async';
  });

  if(!qs('style[data-landing-runtime-polish]')){
    const style=document.createElement('style');
    style.setAttribute('data-landing-runtime-polish','');
    style.textContent=`
      .jr-whatsapp-contact{width:max-content;max-width:100%;gap:10px;margin-top:2px;border-color:var(--accent-2);background:rgba(255,255,255,.08);background:color-mix(in srgb,var(--accent) 28%,transparent);color:#fff}
      .jr-whatsapp-contact:hover,.jr-whatsapp-contact:focus-visible{background:var(--accent-2);border-color:var(--accent-2);color:#111411}
      .jr-mobile-cta [data-whatsapp-action]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
      @media (min-width:761px) and (max-width:1100px){:root{--section:clamp(58px,7vw,78px)}.jr-form-wrap{gap:34px}.jr-map{gap:34px}}
      @media(max-width:760px){:root{--section:56px}.jr-hero{min-height:min(760px,100svh)}.jr-hero__inner{min-height:calc(min(760px,100svh) - 68px);padding-block:clamp(52px,8vh,68px) 30px}.jr-form-wrap{gap:28px}.jr-form-copy ul{margin:24px 0;padding:18px 0}.jr-whatsapp-contact{width:100%;justify-content:center}.jr-mobile-cta{grid-template-columns:1.15fr .85fr}}
      @media(max-width:420px){:root{--section:52px}.jr-hero h1{font-size:clamp(2.85rem,14vw,4.15rem)}.jr-faq{gap:26px}}
    `;
    document.head.append(style);
  }

  const menuButton=qs('[data-menu-toggle]');
  const menu=qs('#landing-menu');
  menuButton?.addEventListener('click',()=>{
    const open=menu?.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded',String(Boolean(open)));
  });
  qsa('#landing-menu a').forEach(link=>link.addEventListener('click',()=>{
    menu?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded','false');
  }));

  const revealItems=qsa('[data-reveal]');
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
    }),{rootMargin:'0px 0px -7%',threshold:.08});
    revealItems.forEach(item=>revealObserver.observe(item));
  }else revealItems.forEach(item=>item.classList.add('is-visible'));

  qsa('[data-cta]').forEach(link=>link.addEventListener('click',()=>track('landing_cta_click',{cta_name:link.dataset.cta||link.textContent.trim(),cta_location:link.dataset.location||'page'})));
  qsa('[data-source-link]').forEach(link=>link.addEventListener('click',()=>track('landing_source_click',{link_url:link.href})));
  qsa('[data-map-action]').forEach(link=>link.addEventListener('click',()=>track('landing_map_open',{link_url:link.href})));
  qsa('[data-phone-action]').forEach(link=>link.addEventListener('click',()=>track('landing_phone_click',{link_url:link.href})));
  qsa('[data-whatsapp-action]').forEach(link=>link.addEventListener('click',()=>track('landing_whatsapp_click',{link_url:link.href,cta_location:link.dataset.location||'page'})));

  const form=qs('[data-lead-capture]');
  qsa('[data-project-select]').forEach(link=>link.addEventListener('click',()=>{
    const project=link.dataset.projectSelect||'';
    if(form?.elements.interest) form.elements.interest.value=project;
    track('landing_project_interest',{project_name:project});
  }));

  if('IntersectionObserver' in window){
    const seen=new Set();
    const projectObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const project=entry.target.dataset.projectCard;
      if(!seen.has(project)){seen.add(project);track('landing_project_view',{project_name:project});}
    }),{threshold:.55});
    qsa('[data-project-card]').forEach(card=>projectObserver.observe(card));
  }

  qsa('[data-currency-tool]').forEach(tool=>{
    const aed=qs('[name="aed"]',tool),rate=qs('[name="rate"]',tool),output=qs('[data-currency-output]',tool),currency=tool.dataset.currency;
    const update=()=>{
      const value=(Number(aed.value)||0)*(Number(rate.value)||0);
      output.textContent=new Intl.NumberFormat(currency==='GBP'?'en-GB':'en-IN',{style:'currency',currency,maximumFractionDigits:0}).format(value);
    };
    [aed,rate].forEach(input=>input?.addEventListener('input',()=>{update();track('landing_currency_tool',{currency});},{passive:true}));
    update();
  });

  qsa('[data-underwriting-tool]').forEach(tool=>{
    const calculator=qs('form',tool);
    const output=qs('[data-underwriting-output]',tool);
    const update=()=>{
      const price=Number(calculator?.elements.price.value)||1;
      const annual=(Number(calculator?.elements.rent.value)||0)*12*((Number(calculator?.elements.occupancy.value)||0)/100);
      const net=Math.max(0,annual-(Number(calculator?.elements.costs.value)||0));
      const netYield=(net/price)*100;
      const usd=net/3.6725;
      output.textContent=`${netYield.toFixed(2)}% net scenario · ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(usd)}/yr`;
    };
    qsa('input',tool).forEach(input=>input.addEventListener('input',()=>{update();track('landing_underwriting_tool',{market:'USA'});},{passive:true}));
    update();
  });

  const leadKey=`jr-pending-lead:${location.host}`;
  const leadEndpoint='/api/lead';
  const sendLead=async payload=>{
    const response=await fetch(leadEndpoint,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)});
    const body=await response.json().catch(()=>({}));
    if(!response.ok||!body.ok) throw new Error(body.error||`HTTP ${response.status}`);
    return body;
  };

  const retryPending=async()=>{
    try{
      const pending=JSON.parse(localStorage.getItem(leadKey)||'null');
      if(!pending) return;
      await sendLead(pending);
      localStorage.removeItem(leadKey);
      track('landing_lead_retry_saved',{submission_id:pending.submission_id});
    }catch(_error){/* keep the local safety copy for the next visit */}
  };
  retryPending();

  if(form){
    const startedAt=Date.now();
    let formStarted=false;
    form.addEventListener('focusin',()=>{
      if(formStarted) return;
      formStarted=true;
      track('landing_form_start',{form_id:'landing-enquiry'});
    },{once:true});

    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const status=qs('[data-form-status]',form);
      const submit=qs('button[type="submit"]',form);
      if(!form.checkValidity()){
        form.reportValidity();
        status.textContent=isArabic?'يرجى إكمال الحقول المطلوبة.':'Please complete the required fields.';
        track('landing_form_validation_error',{form_id:'landing-enquiry'});
        return;
      }
      const values=Object.fromEntries(new FormData(form).entries());
      const params=new URLSearchParams(location.search);
      const payload={
        submission_id:crypto.randomUUID?crypto.randomUUID():(()=>{const values=new Uint32Array(4);crypto.getRandomValues(values);return Array.from(values,value=>value.toString(16).padStart(8,'0')).join('');})(),
        source_host:location.host,
        landing_page:form.dataset.page||pageName,
        name:String(values.name||'').trim(),phone:String(values.phone||'').trim(),budget:String(values.budget||'').trim(),
        email:String(values.email||'').trim(),country:String(values.country||'').trim(),preference:String(values.preference||'').trim(),notes:String(values.notes||'').trim(),interest:String(values.interest||'').trim(),
        consent:Boolean(values.consent),honeypot:String(values.company_website||''),started_at:new Date(startedAt).toISOString(),submitted_at:new Date().toISOString(),
        referrer:document.referrer.slice(0,500),utm_source:params.get('utm_source')||'',utm_medium:params.get('utm_medium')||'',utm_campaign:params.get('utm_campaign')||''
      };
      localStorage.setItem(leadKey,JSON.stringify(payload));
      submit.disabled=true;
      status.textContent=isArabic?'جارٍ حفظ الطلب بأمان…':'Saving your request securely…';
      track('landing_form_submit',{form_id:'landing-enquiry',lead_budget:payload.budget,lead_interest:payload.interest});
      try{
        const result=await sendLead(payload);
        localStorage.removeItem(leadKey);
        const success=qs('[data-lead-success]',form);
        const whatsapp=qs('[data-whatsapp-continue]',success);
        const reference=qs('[data-lead-reference]',success);
        const message=[form.dataset.intro,`Reference: ${result.lead_id}`,`Name: ${payload.name}`,`Phone: ${payload.phone}`,`Budget: ${payload.budget}`,payload.interest?`Interest: ${payload.interest}`:'',payload.preference?`Preference: ${payload.preference}`:''].filter(Boolean).join('\n');
        whatsapp.href=`https://wa.me/971528420933?text=${encodeURIComponent(message)}`;
        reference.textContent=`${isArabic?'رقم الطلب':'Request reference'}: ${result.lead_id}`;
        success.hidden=false;
        submit.hidden=true;
        status.textContent='';
        qsa('input,select,textarea',form).forEach(field=>field.disabled=true);
        success.querySelectorAll('a').forEach(link=>link.removeAttribute('aria-disabled'));
        track('landing_form_complete',{form_id:'landing-enquiry',method:'cloudflare_d1_capture',lead_id:result.lead_id,lead_budget:payload.budget,lead_interest:payload.interest});
        track('generate_lead',{method:'saved_before_whatsapp',lead_id:result.lead_id});
        whatsapp.addEventListener('click',()=>track('landing_whatsapp_continue',{lead_id:result.lead_id}),{once:true});
      }catch(error){
        submit.disabled=false;
        status.textContent=isArabic?'تعذر حفظ الطلب الآن. بقيت نسخة آمنة على هذا الجهاز؛ يرجى إعادة المحاولة.':'The request could not be saved yet. A safety copy remains on this device; please retry.';
        track('landing_form_capture_error',{error_message:String(error.message||error).slice(0,120)});
      }
    });
  }
})();
