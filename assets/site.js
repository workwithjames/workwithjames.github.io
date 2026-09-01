(function(){
  function loadLayoutStyles(){
    var styles=[
      {key:'layout-polish',href:'/assets/layout-polish.css?v=2'},
      {key:'layout-spacing',href:'/assets/layout-spacing.css?v=1'},
      {key:'mobile-columns',href:'/assets/mobile-columns.css?v=2'},
      {key:'fixed-header',href:'/assets/fixed-header.css?v=2'},
      {key:'about-flow-right',href:'/assets/about-flow-right.css?v=1'},
      {key:'scroll-navigation',href:'/assets/scroll-navigation.css?v=1'},
      {key:'header-goal-nav',href:'/assets/header-goal-nav.css?v=2'},
      {key:'tools-navigation',href:'/assets/tools-navigation.css?v=1'},
      {key:'cta-system',href:'/assets/cta-system.css?v=1'}
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
  function readAttribution(){try{return JSON.parse(sessionStorage.getItem('james_attribution')||'{}');}catch(error){return {};}}
  function saveAttribution(data){try{sessionStorage.setItem('james_attribution',JSON.stringify(data));}catch(error){}}

  var existingAttribution=readAttribution();
  if(!Object.keys(existingAttribution).length){
    var params=new URLSearchParams(window.location.search);
    var incoming={};
    keys.forEach(function(key){var value=params.get(key);if(value){incoming[key]=value;}});
    if(document.referrer){
      try{
        var referrerUrl=new URL(document.referrer);
        if(referrerUrl.origin!==location.origin){incoming.referrer=document.referrer;}
      }catch(error){}
    }
    if(Object.keys(incoming).length){
      incoming.landing_page=location.pathname;
      saveAttribution(incoming);
    }
  }

  window.jamesAttribution=function(){
    var data=readAttribution();
    var parts=[];
    Object.keys(data).forEach(function(key){parts.push(key+': '+data[key]);});
    return parts.length?parts.join(' | '):'Direct';
  };

  function event(name,data){
    data=data||{};
    if(typeof window.gtag==='function'){window.gtag('event',name,data);return;}
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(Object.assign({event:name},data));
  }

  var propertyData=[
    {
      href:'/dubai-data/',
      title:'Dubai Data',
      label:'Daily market dashboard',
      description:'Explore recent transaction activity, median prices, area comparisons, rental yields and budget-based affordability.',
      action:'Open Dubai Data',
      icon:'database'
    },
    {
      href:'/abu-dhabi-data/',
      title:'Abu Dhabi Data',
      label:'Official market dashboard',
      description:'Review public ADREC and DARI transaction, sales, lease and price indicators for Abu Dhabi.',
      action:'Open Abu Dhabi Data',
      icon:'chart'
    },
    {
      href:'/ajman-data/',
      title:'Ajman Data',
      label:'Public structured records',
      description:'Filter public sales and mortgage records by period, sector, district, project and unit type.',
      action:'Open Ajman Data',
      icon:'layers'
    }
  ];

  var investmentCalculators=[
    {
      href:'/dubai-rental-yield-calculator/',
      title:'Dubai Rental Yield Calculator',
      navTitle:'Rental Yield Calculator',
      label:'Investment calculator',
      description:'Compare gross and net rental yield for two Dubai properties, including vacancy and recurring ownership costs.',
      action:'Compare rental yields',
      icon:'chart'
    },
    {
      href:'/dubai-property-buying-cost-calculator/',
      title:'Dubai Property Buying Cost Calculator',
      navTitle:'Property Buying Cost Calculator',
      label:'Buyer cost calculator',
      description:'Estimate acquisition fees and the total upfront cash required for a Dubai property purchase.',
      action:'Estimate buying costs',
      icon:'tag'
    }
  ];

  var buyerTools=[
    {
      href:'/buy-invest-dubai/#buyer-enquiry',
      matchPath:'/buy-invest-dubai/',
      title:'Buyer Requirements Brief',
      label:'Interactive buyer tool',
      description:'Organise your purpose, budget, payment route, property type, preferred areas and purchase timeline.',
      action:'Build a buyer brief',
      icon:'compass'
    },
    {
      href:'/best-dubai-communities-by-budget/',
      title:'Dubai Communities by Budget',
      label:'Buyer decision guide',
      description:'Screen Dubai communities across practical purchase-budget bands before creating a shortlist.',
      action:'Explore communities',
      icon:'map'
    }
  ];

  var sellerTools=[
    {
      href:'/sell-dubai-property/#seller-enquiry',
      matchPath:'/sell-dubai-property/',
      title:'Seller Preparation Brief',
      label:'Interactive seller tool',
      description:'Prepare the property facts, occupancy, expected price, timeline and selling priorities for a focused discussion.',
      action:'Build a seller brief',
      icon:'home'
    }
  ];

  var dropdownGroups=[
    {title:'Property Data',items:propertyData},
    {title:'Calculators',items:investmentCalculators},
    {title:'Buyer and Seller Tools',items:[buyerTools[0],sellerTools[0]]}
  ];

  var homeToolGroups=[
    {
      id:'property-data',
      title:'Property Data',
      description:'Review UAE market activity and official public records before comparing individual opportunities.',
      items:propertyData
    },
    {
      id:'investment-calculators',
      title:'Investment Calculators',
      description:'Test income assumptions and estimate the full cash requirement behind a Dubai property purchase.',
      items:investmentCalculators
    },
    {
      id:'buyer-tools',
      title:'Buyer Tools',
      description:'Turn a broad property search into clearer criteria, budget ranges and a structured buyer brief.',
      items:buyerTools
    },
    {
      id:'seller-tools',
      title:'Seller Tools',
      description:'Organise the property information needed for pricing, positioning and a more useful first conversation.',
      items:sellerTools
    }
  ];

  function normalisePath(value){
    var path=value||'/';
    try{path=new URL(path,location.origin).pathname;}catch(error){}
    path=path.replace(/\/index\.html$/,'/');
    if(path.charAt(0)!=='/'){path='/'+path;}
    if(path!=='/'&&path.indexOf('.')===-1&&path.charAt(path.length-1)!=='/'){path+='/';}
    return path;
  }

  function itemPath(item){return normalisePath(item.matchPath||item.href);}
  function isCurrentItem(item){return normalisePath(location.pathname)===itemPath(item);}
  function allToolItems(){return propertyData.concat(investmentCalculators,buyerTools,sellerTools);}

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

  function createToolsMenu(menuIndex){
    var details=document.createElement('details');
    details.className='goal-nav tools-nav';
    details.setAttribute('data-menu-name','Tools');
    if(allToolItems().some(isCurrentItem)){details.classList.add('is-current');}

    var summary=document.createElement('summary');
    summary.innerHTML='Tools <span class="goal-nav-caret" aria-hidden="true">⌄</span>';
    summary.setAttribute('aria-haspopup','true');
    summary.setAttribute('aria-expanded','false');
    summary.setAttribute('aria-label','Open property data and tools menu');

    var menu=document.createElement('div');
    menu.className='goal-nav-menu tools-nav-menu';
    menu.setAttribute('aria-label','Property data and tools');

    dropdownGroups.forEach(function(group,groupIndex){
      var groupElement=document.createElement('section');
      groupElement.className='tools-nav-group';
      var heading=document.createElement('span');
      heading.className='tools-nav-heading';
      heading.id='tools-menu-'+menuIndex+'-group-'+groupIndex;
      heading.textContent=group.title;
      groupElement.setAttribute('aria-labelledby',heading.id);
      groupElement.appendChild(heading);

      group.items.forEach(function(item){
        var link=document.createElement('a');
        link.href=item.href;
        if(isCurrentItem(item)){link.setAttribute('aria-current','page');}
        var title=document.createElement('strong');
        title.textContent=item.navTitle||item.title;
        var description=document.createElement('small');
        description.textContent=item.label;
        link.appendChild(title);
        link.appendChild(description);
        groupElement.appendChild(link);
      });
      menu.appendChild(groupElement);
    });

    details.appendChild(summary);
    details.appendChild(menu);
    return details;
  }

  function isTopLevelToolLink(link){
    var path=normalisePath(link.getAttribute('href'));
    return propertyData.concat(investmentCalculators).some(function(item){return itemPath(item)===path;});
  }

  function injectToolsMenus(){
    var navigationContainers=Array.prototype.slice.call(document.querySelectorAll('.site-header .global-links,.mobile-page-tabs'));
    navigationContainers.forEach(function(container,index){
      Array.prototype.slice.call(container.children).forEach(function(child){
        if(child.tagName==='A'&&isTopLevelToolLink(child)){child.remove();}
      });
      if(Array.prototype.slice.call(container.children).some(function(child){return child.classList&&child.classList.contains('tools-nav');})){return;}

      var menu=createToolsMenu(index);
      var goalMenu=Array.prototype.slice.call(container.children).find(function(child){return child.classList&&child.classList.contains('goal-nav')&&!child.classList.contains('tools-nav');});
      if(goalMenu){
        goalMenu.insertAdjacentElement('afterend',menu);
        return;
      }

      var anchor=Array.prototype.slice.call(container.children).find(function(child){
        return child.tagName==='A'&&normalisePath(child.getAttribute('href'))==='/real-estate-marketing/';
      });
      if(anchor){anchor.insertAdjacentElement('afterend',menu);}else{container.appendChild(menu);}
    });
  }

  function prepareDropdownMenus(){
    var menus=Array.prototype.slice.call(document.querySelectorAll('.goal-nav'));
    if(!menus.length){return;}

    function focusLink(menu,index){
      var links=Array.prototype.slice.call(menu.querySelectorAll('.goal-nav-menu a'));
      if(!links.length){return;}
      var safeIndex=(index+links.length)%links.length;
      links[safeIndex].focus();
    }

    menus.forEach(function(menu){
      if(menu.getAttribute('data-menu-ready')==='true'){return;}
      menu.setAttribute('data-menu-ready','true');
      var summary=menu.querySelector('summary');
      if(summary){
        summary.setAttribute('aria-haspopup','true');
        summary.setAttribute('aria-expanded',menu.open?'true':'false');
        summary.addEventListener('keydown',function(keyEvent){
          if(keyEvent.key==='ArrowDown'||keyEvent.key==='ArrowUp'){
            keyEvent.preventDefault();
            menu.open=true;
            window.requestAnimationFrame(function(){focusLink(menu,keyEvent.key==='ArrowDown'?0:-1);});
          }
        });
      }

      menu.addEventListener('toggle',function(){
        if(summary){summary.setAttribute('aria-expanded',menu.open?'true':'false');}
        if(!menu.open){return;}
        menus.forEach(function(other){if(other!==menu){other.open=false;}});
        event('navigation_menu_open',{menu_name:menu.getAttribute('data-menu-name')||'Your Goal',page_path:location.pathname});
      });

      var links=Array.prototype.slice.call(menu.querySelectorAll('.goal-nav-menu a'));
      links.forEach(function(link,linkIndex){
        link.addEventListener('click',function(){menu.open=false;});
        link.addEventListener('keydown',function(keyEvent){
          if(keyEvent.key==='ArrowDown'){
            keyEvent.preventDefault();
            focusLink(menu,linkIndex+1);
          }else if(keyEvent.key==='ArrowUp'){
            keyEvent.preventDefault();
            focusLink(menu,linkIndex-1);
          }else if(keyEvent.key==='Home'){
            keyEvent.preventDefault();
            focusLink(menu,0);
          }else if(keyEvent.key==='End'){
            keyEvent.preventDefault();
            focusLink(menu,-1);
          }else if(keyEvent.key==='Escape'){
            keyEvent.preventDefault();
            menu.open=false;
            if(summary){summary.focus();}
          }
        });
      });
    });

    if(document.documentElement.getAttribute('data-dropdown-global-ready')==='true'){return;}
    document.documentElement.setAttribute('data-dropdown-global-ready','true');
    document.addEventListener('click',function(clickEvent){
      if(clickEvent.target.closest('.goal-nav')){return;}
      document.querySelectorAll('.goal-nav[open]').forEach(function(menu){menu.open=false;});
    });
    document.addEventListener('keydown',function(keyEvent){
      if(keyEvent.key!=='Escape'){return;}
      document.querySelectorAll('.goal-nav[open]').forEach(function(menu){
        menu.open=false;
        var summary=menu.querySelector('summary');
        if(summary){summary.focus();}
      });
    });
  }

  function iconMarkup(icon){
    return '<svg aria-hidden="true"><use href="/assets/jr-visual-icons.svg#icon-'+icon+'"></use></svg>';
  }

  function createToolCard(item){
    var card=document.createElement('a');
    card.className='tool-directory-card';
    card.href=item.href;
    if(isCurrentItem(item)){card.setAttribute('aria-current','page');}
    card.innerHTML='<span class="tool-directory-icon" aria-hidden="true">'+iconMarkup(item.icon)+'</span>'+
      '<span class="tool-directory-copy"><span class="tool-directory-label">'+item.label+'</span><strong>'+item.title+'</strong><span class="tool-directory-description">'+item.description+'</span></span>'+
      '<span class="tool-directory-action">'+item.action+' <span aria-hidden="true">→</span></span>';
    return card;
  }

  function organiseHomeToolsDirectory(){
    var section=document.querySelector('.home-data');
    if(!section){return;}
    var heading=section.querySelector('.home-section-heading');
    if(heading){
      var kicker=heading.querySelector('.section-kicker');
      var title=heading.querySelector('h2');
      var description=heading.querySelector(':scope > p');
      if(kicker){kicker.textContent='Property data and tools';}
      if(title){title.textContent='Property data and decision tools in one place.';}
      if(description){description.textContent='Open UAE property-data resources, estimate Dubai rental yield and buying costs, or prepare a focused buyer or seller brief.';}
    }

    var existingGrid=section.querySelector('.home-data-grid,.tools-directory');
    if(!existingGrid){return;}
    var directory=document.createElement('div');
    directory.className='tools-directory';

    homeToolGroups.forEach(function(group){
      var category=document.createElement('section');
      category.className='tools-directory-category';
      category.setAttribute('data-category',group.id);
      var headingBlock=document.createElement('div');
      headingBlock.className='tools-directory-heading';
      headingBlock.innerHTML='<h3>'+group.title+'</h3><p>'+group.description+'</p>';
      var grid=document.createElement('div');
      grid.className='tools-directory-grid'+(group.items.length===1?' is-single':'');
      group.items.forEach(function(item){grid.appendChild(createToolCard(item));});
      category.appendChild(headingBlock);
      category.appendChild(grid);
      directory.appendChild(category);
    });
    existingGrid.replaceWith(directory);
  }

  function createFooterGroup(group){
    var nav=document.createElement('nav');
    nav.className='footer-group';
    nav.setAttribute('aria-label',group.title);
    var title=document.createElement('h2');
    title.textContent=group.title;
    nav.appendChild(title);
    group.items.forEach(function(item){
      var link=document.createElement('a');
      link.href=item.href;
      link.textContent=item.label;
      if(/^https?:\/\//i.test(item.href)){
        link.target='_blank';
        link.rel='noopener';
      }
      if(item.href.charAt(0)==='/'&&normalisePath(location.pathname)===normalisePath(item.matchPath||item.href)){link.setAttribute('aria-current','page');}
      nav.appendChild(link);
    });
    return nav;
  }

  function organiseFooterNavigation(){
    var footerGroups=[
      {
        title:'Property',
        items:[
          {href:'/buy-invest-dubai/',label:'Buy'},
          {href:'/sell-dubai-property/',label:'Sell'},
          {href:'/properties/',label:'Projects'},
          {href:'/areas/',label:'Areas'}
        ]
      },
      {
        title:'Research',
        items:[
          {href:'/dubai-data/',label:'Dubai Data'},
          {href:'/abu-dhabi-data/',label:'Abu Dhabi Data'},
          {href:'/ajman-data/',label:'Ajman Data'},
          {href:'/dubai-rental-yield-calculator/',label:'Yield Calculator'},
          {href:'/dubai-property-buying-cost-calculator/',label:'Buying Costs'},
          {href:'/blog/',label:'Insights'}
        ]
      },
      {
        title:'Company',
        items:[
          {href:'/about-me/',label:'About James'},
          {href:'/contact/',label:'Contact'},
          {href:'https://digital.jamesrealty.uk/',label:'Digital Services ↗'}
        ]
      },
      {
        title:'Legal',
        items:[
          {href:'/privacy-policy/',label:'Privacy'},
          {href:'/terms/',label:'Terms'},
          {href:'/disclaimer/',label:'Disclaimer'},
          {href:'/sitemap.xml',label:'Sitemap'},
          {href:'/data-methodology/',label:'Data Methodology'},
          {href:'/editorial-methodology/',label:'Editorial Methodology'}
        ]
      }
    ];

    document.querySelectorAll('footer .footer-shell').forEach(function(shell){
      if(shell.getAttribute('data-footer-organised')==='true'){return;}
      shell.setAttribute('data-footer-organised','true');
      shell.classList.add('footer-shell-rich','footer-organised');

      var existingLinkedIn=shell.querySelector('.footer-linkedin');
      var linkedInHref=existingLinkedIn?existingLinkedIn.getAttribute('href'):'https://ae.linkedin.com/in/james-ravi-dubai';
      shell.innerHTML='';

      var identity=document.createElement('div');
      identity.className='footer-identity';
      identity.innerHTML='<a class="brand" href="/" aria-label="James Realty home">James Realty</a><p>Evidence-led Dubai property advisory.<br>Dubai, UAE · © 2026 James.</p>';

      var groups=document.createElement('div');
      groups.className='footer-groups';
      footerGroups.forEach(function(group){groups.appendChild(createFooterGroup(group));});

      var linkedIn=document.createElement('a');
      linkedIn.className='footer-linkedin';
      linkedIn.href=linkedInHref;
      linkedIn.target='_blank';
      linkedIn.rel='me noreferrer';
      linkedIn.innerHTML='LinkedIn <span aria-hidden="true">↗</span>';

      shell.appendChild(identity);
      shell.appendChild(groups);
      shell.appendChild(linkedIn);
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
    updateHeaderBrand();
    renameBlogPageLabels();
    prepareDropdownMenus();
    organiseHomeToolsDirectory();
    organiseFooterNavigation();
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
    var isCta=link.matches('.button,.mobile-conversion,.advisory-card,.area-card')||Boolean(link.closest('.home-journey,.home-data-card,.tools-directory,.journey-links,.market-related,.property-news-link-grid,.related-reading,.buyer-cluster-card,.cluster-cta,.project-actions'));
    if(isCta){
      event('cta_click',{
        link_text:(link.textContent||'').replace(/\s+/g,' ').trim(),
        link_url:href,
        cta_location:(link.closest('header')?'header':link.closest('footer')?'footer':link.closest('.mobile-conversion')?'mobile_sticky':'page'),
        page_path:location.pathname
      });
    }
    if(href.indexOf('wa.me/')>-1){event('generate_lead',{method:'whatsapp',link_url:href,page_path:location.pathname});}
    if(href.indexOf('mailto:')===0){event('email_click',{link_url:href,page_path:location.pathname});if(/call(?:%20|\+|\s)/i.test(href)){event('book_call_click',{link_url:href,page_path:location.pathname});}}
    if(href.indexOf('tel:')===0){event('phone_click',{link_url:href,page_path:location.pathname});event('generate_lead',{method:'phone',page_path:location.pathname});}
    if(href==='/contact/'||href.indexOf('/contact/')===0){event('contact_intent',{link_text:(link.textContent||'').trim(),page_path:location.pathname});}
    if(/(?:brochure|\.pdf(?:$|[?#]))/i.test(href)){event('brochure_click',{link_text:(link.textContent||'').trim(),link_url:href,page_path:location.pathname});}
    var projectCard=link.closest('[data-project-card],.jr-project');
    if(projectCard){event('project_interest',{project_name:projectCard.getAttribute('data-project-card')||projectCard.getAttribute('data-project')||(projectCard.querySelector('h2,h3')||{}).textContent||'',link_url:href,page_path:location.pathname});}
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
