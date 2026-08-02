(function(){
  function loadLayoutStyles(){
    var styles=[
      {key:'layout-polish',href:'/assets/layout-polish.css?v=2'},
      {key:'layout-spacing',href:'/assets/layout-spacing.css?v=1'},
      {key:'mobile-columns',href:'/assets/mobile-columns.css?v=2'},
      {key:'fixed-header',href:'/assets/fixed-header.css?v=2'},
      {key:'about-flow-right',href:'/assets/about-flow-right.css?v=1'},
      {key:'scroll-navigation',href:'/assets/scroll-navigation.css?v=1'},
      {key:'header-goal-nav',href:'/assets/header-goal-nav.css?v=1'}
    ];
    styles.forEach(function(item){
      if(document.querySelector('link[data-'+item.key+']')||document.querySelector('link[href^="'+item.href.split('?')[0]+'"]')){return;}
      var link=document.createElement('link');
      link.rel='stylesheet';
      link.href=item.href;
      link.setAttribute('data-'+item.key,'true');
      document.head.appendChild(link);
    });
  }
  loadLayoutStyles();

  var keys=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','msclkid'];
  var params=new URLSearchParams(window.location.search);
  var attribution={};
  keys.forEach(function(key){var value=params.get(key);if(value){attribution[key]=value;}});
  if(document.referrer){attribution.referrer=document.referrer;}
  if(Object.keys(attribution).length){try{sessionStorage.setItem('james_attribution',JSON.stringify(attribution));}catch(e){}}
  function saved(){try{return JSON.parse(sessionStorage.getItem('james_attribution')||'{}');}catch(e){return {};}}
  window.jamesAttribution=function(){var data=saved();var parts=[];Object.keys(data).forEach(function(key){parts.push(key+': '+data[key]);});return parts.length?parts.join(' | '):'Direct';};
  function event(name,data){if(typeof window.gtag==='function'){window.gtag('event',name,data||{});}}

  function removeVisibleBlogDates(){
    document.querySelectorAll('.article-meta time,.article-byline time').forEach(function(date){date.remove();});
  }

  function updateHeaderBrand(){
    document.querySelectorAll('.site-header .brand').forEach(function(brand){
      brand.textContent='James Realty';
      brand.setAttribute('aria-label','James Realty');
    });
  }

  function renameBlogPageLabels(){
    document.querySelectorAll('a[href="/blog/"]').forEach(function(link){
      if((link.textContent||'').trim().toLowerCase()==='blog'){link.textContent='News';}
    });
    document.querySelectorAll('.section-kicker').forEach(function(label){
      if((label.textContent||'').trim().toLowerCase()==='uae property blog'){label.textContent='UAE property news';}
    });
  }

  function prepareGoalMenus(){
    var menus=Array.prototype.slice.call(document.querySelectorAll('.goal-nav'));
    if(!menus.length){return;}

    menus.forEach(function(menu){
      menu.addEventListener('toggle',function(){
        if(!menu.open){return;}
        menus.forEach(function(other){if(other!==menu){other.open=false;}});
        event('navigation_menu_open',{menu_name:'Your Goal',page_path:location.pathname});
      });
      menu.querySelectorAll('a').forEach(function(link){
        link.addEventListener('click',function(){menu.open=false;});
      });
    });

    document.addEventListener('click',function(clickEvent){
      if(clickEvent.target.closest('.goal-nav')){return;}
      menus.forEach(function(menu){menu.open=false;});
    });

    document.addEventListener('keydown',function(keyEvent){
      if(keyEvent.key!=='Escape'){return;}
      menus.forEach(function(menu){
        if(menu.open){
          menu.open=false;
          var summary=menu.querySelector('summary');
          if(summary){summary.focus();}
        }
      });
    });
  }

  function ensureCitationNavigation(){
    document.querySelectorAll('.footer-links').forEach(function(nav){
      if(nav.querySelector('a[href="/cite/"]')){return;}
      var link=document.createElement('a');
      link.href='/cite/';
      link.textContent='Cite this site';
      nav.appendChild(link);
    });
  }

  function prepareAboutFlow(){
    var flow=document.querySelector('.about-flow');
    if(!flow){return;}

    document.documentElement.classList.add('has-about-flow');
    document.body.classList.add('has-about-flow');

    var links=Array.prototype.slice.call(flow.querySelectorAll('a[href^="#"]'));
    var entries=links.map(function(link){
      var id=link.getAttribute('href').slice(1);
      return {link:link,section:document.getElementById(id)};
    }).filter(function(item){return item.section;});

    if(!entries.length){return;}

    function setActive(activeLink){
      links.forEach(function(link){
        if(link===activeLink){
          link.setAttribute('aria-current','location');
          if(link.scrollIntoView){
            var flowRect=flow.getBoundingClientRect();
            var linkRect=link.getBoundingClientRect();
            if(linkRect.left<flowRect.left||linkRect.right>flowRect.right){
              link.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
            }
          }
        }else{
          link.removeAttribute('aria-current');
        }
      });
    }

    var ticking=false;
    function updateActive(){
      ticking=false;
      var rootStyle=getComputedStyle(document.documentElement);
      var headerOffset=parseFloat(rootStyle.getPropertyValue('--fixed-header-offset'))||0;
      var targetLine=headerOffset+flow.offsetHeight+44;
      var current=entries[0];
      entries.forEach(function(item){if(item.section.getBoundingClientRect().top<=targetLine){current=item;}});
      setActive(current.link);
    }

    function requestUpdate(){
      if(ticking){return;}
      ticking=true;
      window.requestAnimationFrame(updateActive);
    }

    links.forEach(function(link){link.addEventListener('click',function(){setActive(link);});});
    window.addEventListener('scroll',requestUpdate,{passive:true});
    window.addEventListener('resize',requestUpdate);
    updateActive();
  }

  function preparePageScrollControls(){
    if(document.querySelector('.page-scroll-controls')){return;}
    var root=document.documentElement;
    var controls=document.createElement('nav');
    controls.className='page-scroll-controls';
    controls.setAttribute('aria-label','Page scroll controls');

    var up=document.createElement('button');
    up.type='button';
    up.className='page-scroll-control page-scroll-up';
    up.setAttribute('aria-label','Go to the top of the page');
    up.title='Go to top';
    up.textContent='↑';

    var down=document.createElement('button');
    down.type='button';
    down.className='page-scroll-control page-scroll-down';
    down.setAttribute('aria-label','Go to the bottom of the page');
    down.title='Go to bottom';
    down.textContent='↓';

    controls.appendChild(up);
    controls.appendChild(down);
    document.body.appendChild(controls);

    function scrollMode(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';}
    function update(){
      var max=Math.max(0,root.scrollHeight-root.clientHeight);
      var current=window.scrollY||root.scrollTop||0;
      var scrollable=max>160;
      up.classList.toggle('is-visible',scrollable&&current>120);
      down.classList.toggle('is-visible',scrollable&&current<max-120);
    }
    up.addEventListener('click',function(){window.scrollTo({top:0,behavior:scrollMode()});event('page_scroll_control',{direction:'top',page_path:location.pathname});});
    down.addEventListener('click',function(){window.scrollTo({top:root.scrollHeight,behavior:scrollMode()});event('page_scroll_control',{direction:'bottom',page_path:location.pathname});});
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    update();
  }

  function ensureNavigation(){
    removeVisibleBlogDates();
    updateHeaderBrand();
    renameBlogPageLabels();
    prepareGoalMenus();
    ensureCitationNavigation();
    prepareAboutFlow();
    preparePageScrollControls();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',ensureNavigation);
  }else{
    ensureNavigation();
  }

  document.addEventListener('click',function(e){
    var link=e.target.closest('a');
    if(!link){return;}
    var href=link.getAttribute('href')||'';
    if(href.indexOf('wa.me/')>-1){event('generate_lead',{method:'whatsapp',link_url:href,page_path:location.pathname});}
    if(href==='/contact/'||href.indexOf('/contact/')===0){event('contact_intent',{link_text:(link.textContent||'').trim(),page_path:location.pathname});}
    if(href==='/cite/'||href.indexOf('/cite/')===0){event('citation_intent',{link_text:(link.textContent||'').trim(),page_path:location.pathname});}
    if(link.closest('.article-sources')){event('source_click',{link_url:href,page_path:location.pathname});}
    if(href.indexOf('dari.ae')>-1||href.indexOf('adrec.gov.ae')>-1){event('data_source_click',{data_source:'ADREC_DARI',link_url:href,page_path:location.pathname});}
    if(link.closest('.article-share')){event('share_click',{channel:href.indexOf('linkedin.com')>-1?'linkedin':'whatsapp',page_path:location.pathname});}
    if(link.closest('.related-reading')||link.closest('.blog-index-grid')){event('related_article_click',{link_url:href,link_text:(link.textContent||'').trim(),page_path:location.pathname});}
  });

  var form=document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit',function(){
      event('generate_lead',{method:'contact_form_to_whatsapp',service:(document.getElementById('contact-service')||{}).value||'',page_path:location.pathname});
    });
  }

  document.querySelectorAll('.article-faq details').forEach(function(item){
    item.addEventListener('toggle',function(){
      if(item.open){event('faq_open',{question:(item.querySelector('summary')||{}).textContent||'',page_path:location.pathname});}
    });
  });

  var bar=document.getElementById('reading-progress-bar');
  var milestones={50:false,90:false};
  if(bar){
    window.addEventListener('scroll',function(){
      var root=document.documentElement;
      var total=root.scrollHeight-root.clientHeight;
      var pct=total?Math.min(100,Math.round((root.scrollTop/total)*100)):0;
      bar.style.width=pct+'%';
      [50,90].forEach(function(mark){
        if(pct>=mark&&!milestones[mark]){
          milestones[mark]=true;
          event('article_scroll',{percent_scrolled:mark,page_path:location.pathname});
        }
      });
    },{passive:true});
  }
})();
