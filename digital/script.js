(function(){
  const root=document.documentElement;
  const reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reducedMotion) root.classList.add('js-motion');

  const header=document.querySelector('.site-header');
  const updateHeader=()=>{if(header)header.classList.toggle('is-scrolled',window.scrollY>10)};
  updateHeader();
  window.addEventListener('scroll',updateHeader,{passive:true});

  const menuButton=document.querySelector('.menu-button');
  const mobileNav=document.getElementById('mobile-nav');
  const setMenu=(open)=>{
    if(!menuButton||!mobileNav)return;
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.textContent=open?'Close':'Menu';
    document.body.classList.toggle('menu-open',open);
    if(open){
      mobileNav.hidden=false;
      mobileNav.classList.remove('is-opening');
      requestAnimationFrame(()=>mobileNav.classList.add('is-opening'));
    }else{
      mobileNav.classList.remove('is-opening');
      mobileNav.hidden=true;
    }
  };
  if(menuButton&&mobileNav){
    menuButton.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
    mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
    window.addEventListener('resize',()=>{if(window.innerWidth>820)setMenu(false)},{passive:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
  }

  const packageInput=document.getElementById('package');
  document.querySelectorAll('[data-package]').forEach(link=>link.addEventListener('click',()=>{
    if(packageInput) packageInput.value=link.dataset.package||'';
  }));

  const revealTargets=[
    '.section-heading','.service-grid','.pricing-grid','.website-pricing','.mini-price-grid',
    '.process-grid','.quote-banner-inner','.faq-list','.quote-grid'
  ];
  if(!reducedMotion&&'IntersectionObserver' in window){
    revealTargets.forEach(selector=>document.querySelectorAll(selector).forEach(el=>{
      el.dataset.reveal='up';
      if(el.matches('.service-grid,.pricing-grid,.website-pricing,.mini-price-grid,.process-grid'))el.classList.add('stagger');
    }));
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}
      });
    },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('[data-reveal]').forEach(el=>revealObserver.observe(el));
  }else{
    document.querySelectorAll('[data-reveal],.stagger').forEach(el=>el.classList.add('is-visible'));
  }

  const heroPanel=document.querySelector('.hero-panel');
  if(heroPanel){
    if(reducedMotion)heroPanel.classList.add('chart-ready');
    else requestAnimationFrame(()=>setTimeout(()=>heroPanel.classList.add('chart-ready'),220));
  }

  const navLinks=[...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections=navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if('IntersectionObserver' in window&&sections.length){
    const navObserver=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      navLinks.forEach(link=>{
        const active=link.getAttribute('href')==='#'+visible.target.id;
        if(active)link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current');
      });
    },{rootMargin:'-22% 0px -62% 0px',threshold:[0,.1,.25,.5]});
    sections.forEach(section=>navObserver.observe(section));
  }

  const form=document.getElementById('quote-form');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      const name=document.getElementById('name').value.trim();
      const business=document.getElementById('business').value.trim();
      const service=document.getElementById('service').value;
      const budget=document.getElementById('budget').value;
      const selectedPackage=document.getElementById('package').value.trim();
      const details=document.getElementById('details').value.trim();
      const lines=[
        'Hi James, I would like to discuss digital services.',
        '',
        `Name: ${name}`,
        business?`Business / brand: ${business}`:'',
        `Service: ${service}`,
        `Budget: ${budget}`,
        selectedPackage?`Package / project: ${selectedPackage}`:'',
        '',
        'Goal / details:',
        details
      ].filter(Boolean);
      const url='https://wa.me/971528420933?text='+encodeURIComponent(lines.join('\n'));
      if(window.dataLayer){window.dataLayer.push({event:'digital_quote_whatsapp',service:service,package:selectedPackage||'custom'});}
      window.open(url,'_blank','noopener,noreferrer');
    });
  }

  document.querySelectorAll('.faq-list details').forEach(detail=>{
    detail.addEventListener('toggle',()=>{
      if(detail.open&&window.dataLayer){
        const question=detail.querySelector('summary')?.textContent?.trim()||'FAQ';
        window.dataLayer.push({event:'digital_faq_open',question});
      }
    });
  });

  const year=document.getElementById('year');
  if(year) year.textContent=new Date().getFullYear();
})();
