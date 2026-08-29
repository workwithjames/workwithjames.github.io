(function(){
  const root=document.documentElement;
  const reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reducedMotion) root.classList.add('js-motion');

  const portfolioHref='portfolio.html';
  const ensurePortfolioLink=(container,beforeSelector)=>{
    if(!container||container.querySelector(`a[href="${portfolioHref}"]`))return;
    const link=document.createElement('a');
    link.href=portfolioHref;
    link.textContent='Portfolio';
    const before=beforeSelector?container.querySelector(beforeSelector):container.firstElementChild;
    if(before)container.insertBefore(link,before);else container.appendChild(link);
  };
  ensurePortfolioLink(document.querySelector('.nav-links'),'a[href="#services"]');
  ensurePortfolioLink(document.getElementById('mobile-nav'),'a[href="#services"]');
  ensurePortfolioLink(document.querySelector('.footer-links'),'a[href="#services"]');

  const trustStrip=document.querySelector('.trust-strip');
  if(trustStrip&&!document.getElementById('portfolio-preview')){
    if(!document.querySelector('link[href="portfolio.css"]')){
      const portfolioStyles=document.createElement('link');
      portfolioStyles.rel='stylesheet';
      portfolioStyles.href='portfolio.css';
      document.head.appendChild(portfolioStyles);
    }
    const section=document.createElement('section');
    section.id='portfolio-preview';
    section.className='section section-shell portfolio-preview-section';
    section.innerHTML=`
      <div class="portfolio-intro">
        <div><p class="kicker">Selected work</p><h2>Real brands. Live work. Public proof.</h2></div>
        <p>Explore selected creative and digital work across UAE real estate, hospitality, restaurants and beauty. Every card links to the brand's live public presence.</p>
      </div>
      <div class="portfolio-home-grid">
        <article class="portfolio-card">
          <a class="portfolio-visual" href="https://www.nwmea.com/" target="_blank" rel="noopener noreferrer"><span class="preview-fallback">Nationwide Middle East Properties</span><img loading="lazy" src="https://image.thum.io/get/width/1000/crop/650/noanimate/https://www.nwmea.com/" alt="Nationwide Middle East Properties website preview" onerror="this.hidden=true"><span class="browser-bar"><i></i><i></i><i></i><span>nwmea.com</span></span></a>
          <div class="portfolio-body"><div class="portfolio-meta"><span class="portfolio-sector">Real Estate</span><span class="portfolio-location">UAE</span></div><h3>Nationwide Middle East Properties</h3><p>Property creative, social content and digital brand presence.</p><div class="portfolio-tags"><span>Creative</span><span>Social</span><span>Property</span></div><div class="portfolio-links"><a class="primary-link" href="https://www.nwmea.com/" target="_blank" rel="noopener noreferrer">Website</a><a href="https://www.instagram.com/nwmea/" target="_blank" rel="noopener noreferrer">@nwmea</a></div></div>
        </article>
        <article class="portfolio-card">
          <a class="portfolio-visual" href="https://thoe.com/" target="_blank" rel="noopener noreferrer"><span class="preview-fallback">The Heart of Europe</span><img loading="lazy" src="https://image.thum.io/get/width/1000/crop/650/noanimate/https://thoe.com/" alt="The Heart of Europe website preview" onerror="this.hidden=true"><span class="browser-bar"><i></i><i></i><i></i><span>thoe.com</span></span></a>
          <div class="portfolio-body"><div class="portfolio-meta"><span class="portfolio-sector">Luxury Destination</span><span class="portfolio-location">Dubai</span></div><h3>The Heart of Europe</h3><p>Luxury developer, destination and social creative presence.</p><div class="portfolio-tags"><span>Luxury</span><span>Developer</span><span>Social</span></div><div class="portfolio-links"><a class="primary-link" href="https://thoe.com/" target="_blank" rel="noopener noreferrer">Website</a><a href="https://www.instagram.com/theheartofeurope_official/" target="_blank" rel="noopener noreferrer">Instagram</a></div></div>
        </article>
        <article class="portfolio-card">
          <a class="portfolio-visual" href="https://bnw.ae/en" target="_blank" rel="noopener noreferrer"><span class="preview-fallback">BNW Developments</span><img loading="lazy" src="https://image.thum.io/get/width/1000/crop/650/noanimate/https://bnw.ae/en" alt="BNW Developments website preview" onerror="this.hidden=true"><span class="browser-bar"><i></i><i></i><i></i><span>bnw.ae</span></span></a>
          <div class="portfolio-body"><div class="portfolio-meta"><span class="portfolio-sector">Real Estate Developer</span><span class="portfolio-location">UAE</span></div><h3>BNW Developments</h3><p>Luxury development, campaign and investor-facing creative.</p><div class="portfolio-tags"><span>Campaigns</span><span>Luxury</span><span>Social</span></div><div class="portfolio-links"><a class="primary-link" href="https://bnw.ae/en" target="_blank" rel="noopener noreferrer">Website</a><a href="https://www.instagram.com/bnw.developments/" target="_blank" rel="noopener noreferrer">@bnw.developments</a></div></div>
        </article>
        <article class="portfolio-card">
          <a class="portfolio-visual" href="https://reefandbeef.ae/" target="_blank" rel="noopener noreferrer"><span class="preview-fallback">Reef &amp; Beef Dubai</span><img loading="lazy" src="https://image.thum.io/get/width/1000/crop/650/noanimate/https://reefandbeef.ae/" alt="Reef and Beef Dubai website preview" onerror="this.hidden=true"><span class="browser-bar"><i></i><i></i><i></i><span>reefandbeef.ae</span></span></a>
          <div class="portfolio-body"><div class="portfolio-meta"><span class="portfolio-sector">Hospitality · F&amp;B</span><span class="portfolio-location">Downtown Dubai</span></div><h3>Reef &amp; Beef Steakhouse &amp; Seafood</h3><p>Restaurant, food, lifestyle and social creative presence.</p><div class="portfolio-tags"><span>Restaurant</span><span>Creative</span><span>Social</span></div><div class="portfolio-links"><a class="primary-link" href="https://reefandbeef.ae/" target="_blank" rel="noopener noreferrer">Website</a><a href="https://www.instagram.com/reefandbeef_dubai/" target="_blank" rel="noopener noreferrer">@reefandbeef_dubai</a></div></div>
        </article>
        <article class="portfolio-card">
          <a class="portfolio-visual" href="https://fomocousina.com/" target="_blank" rel="noopener noreferrer"><span class="preview-fallback">FOMO Cousina &amp; Lounge</span><img loading="lazy" src="https://image.thum.io/get/width/1000/crop/650/noanimate/https://fomocousina.com/" alt="FOMO Cousina and Lounge website preview" onerror="this.hidden=true"><span class="browser-bar"><i></i><i></i><i></i><span>fomocousina.com</span></span></a>
          <div class="portfolio-body"><div class="portfolio-meta"><span class="portfolio-sector">Restaurant · Lounge</span><span class="portfolio-location">Business Bay</span></div><h3>FOMO Cousina &amp; Lounge</h3><p>Hospitality, restaurant and urban lifestyle creative.</p><div class="portfolio-tags"><span>Hospitality</span><span>Lifestyle</span><span>Social</span></div><div class="portfolio-links"><a class="primary-link" href="https://fomocousina.com/" target="_blank" rel="noopener noreferrer">Website</a><a href="https://www.instagram.com/fomocousina.ae/" target="_blank" rel="noopener noreferrer">@fomocousina.ae</a></div></div>
        </article>
        <article class="portfolio-card">
          <a class="portfolio-visual" href="https://glamgirlz.store/" target="_blank" rel="noopener noreferrer"><span class="preview-fallback">Glam Girlz</span><img loading="lazy" src="https://image.thum.io/get/width/1000/crop/650/noanimate/https://glamgirlz.store/" alt="Glam Girlz Dubai Mall website preview" onerror="this.hidden=true"><span class="browser-bar"><i></i><i></i><i></i><span>glamgirlz.store</span></span></a>
          <div class="portfolio-body"><div class="portfolio-meta"><span class="portfolio-sector">Beauty · Retail</span><span class="portfolio-location">Dubai Mall</span></div><h3>Glam Girlz Mena Salon LLC</h3><p>Colour-led beauty, retail and kids lifestyle creative.</p><div class="portfolio-tags"><span>Beauty</span><span>Retail</span><span>Creative</span></div><div class="portfolio-links"><a class="primary-link" href="https://glamgirlz.store/" target="_blank" rel="noopener noreferrer">Website</a><a href="https://www.instagram.com/glam_girlz_dubai/" target="_blank" rel="noopener noreferrer">@glam_girlz_dubai</a></div></div>
        </article>
        <article class="portfolio-card">
          <a class="portfolio-visual" href="https://ivydubai.ae/locations/marquise-square-business-bay/" target="_blank" rel="noopener noreferrer"><span class="preview-fallback">IVY Beauty &amp; Bubbles</span><img loading="lazy" src="https://image.thum.io/get/width/1000/crop/650/noanimate/https://ivydubai.ae/locations/marquise-square-business-bay/" alt="IVY Beauty and Bubbles Marquise Square website preview" onerror="this.hidden=true"><span class="browser-bar"><i></i><i></i><i></i><span>ivydubai.ae</span></span></a>
          <div class="portfolio-body"><div class="portfolio-meta"><span class="portfolio-sector">Beauty · Lifestyle</span><span class="portfolio-location">Marquise Square</span></div><h3>IVY Beauty &amp; Bubbles Hub</h3><p>Premium salon, transformation and lifestyle creative.</p><div class="portfolio-tags"><span>Beauty</span><span>Salon</span><span>Social</span></div><div class="portfolio-links"><a class="primary-link" href="https://ivydubai.ae/locations/marquise-square-business-bay/" target="_blank" rel="noopener noreferrer">Website</a><a href="https://www.instagram.com/ivybeautyandbubbles_dubai/" target="_blank" rel="noopener noreferrer">Instagram</a></div></div>
        </article>
      </div>
      <div class="portfolio-home-cta"><div><strong>Want to inspect the work properly?</strong><p>Open the full portfolio for larger previews, live websites and public social channels.</p></div><a class="button button-primary" href="portfolio.html">Explore full portfolio</a></div>`;
    trustStrip.insertAdjacentElement('afterend',section);

    const heroPrimary=document.querySelector('.hero-actions .button-primary');
    if(heroPrimary){heroPrimary.href=portfolioHref;heroPrimary.textContent='View selected work';}
  }

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
    '.section-heading','.portfolio-intro','.portfolio-home-grid','.service-grid','.pricing-grid','.website-pricing','.mini-price-grid',
    '.process-grid','.quote-banner-inner','.faq-list','.quote-grid'
  ];
  if(!reducedMotion&&'IntersectionObserver' in window){
    revealTargets.forEach(selector=>document.querySelectorAll(selector).forEach(el=>{
      el.dataset.reveal='up';
      if(el.matches('.portfolio-home-grid,.service-grid,.pricing-grid,.website-pricing,.mini-price-grid,.process-grid'))el.classList.add('stagger');
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
