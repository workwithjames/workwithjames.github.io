(function(){
  function loadLayoutStyles(){
    var styles=[
      {key:'layout-polish',href:'/assets/layout-polish.css?v=2'},
      {key:'layout-spacing',href:'/assets/layout-spacing.css?v=1'},
      {key:'mobile-columns',href:'/assets/mobile-columns.css?v=2'}
    ];
    styles.forEach(function(item){
      if(document.querySelector('link[data-'+item.key+']')){return;}
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
  function ensureDataNavigation(){
    document.querySelectorAll('.global-links,.mobile-page-tabs,.footer-links').forEach(function(nav){
      if(nav.querySelector('a[href="/abu-dhabi-data/"]')){return;}
      var dubai=nav.querySelector('a[href="/"]');
      if(!dubai){return;}
      var link=document.createElement('a');
      link.href='/abu-dhabi-data/';
      link.textContent='Abu Dhabi Data';
      dubai.insertAdjacentElement('afterend',link);
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
  function ensureNavigation(){ensureDataNavigation();ensureCitationNavigation();}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',ensureNavigation);}else{ensureNavigation();}
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
  if(form){form.addEventListener('submit',function(){event('generate_lead',{method:'contact_form_to_whatsapp',service:(document.getElementById('contact-service')||{}).value||'',page_path:location.pathname});});}
  document.querySelectorAll('.article-faq details').forEach(function(item){item.addEventListener('toggle',function(){if(item.open){event('faq_open',{question:(item.querySelector('summary')||{}).textContent||'',page_path:location.pathname});}});});
  var bar=document.getElementById('reading-progress-bar');
  var milestones={50:false,90:false};
  if(bar){window.addEventListener('scroll',function(){var root=document.documentElement;var total=root.scrollHeight-root.clientHeight;var pct=total?Math.min(100,Math.round((root.scrollTop/total)*100)):0;bar.style.width=pct+'%';[50,90].forEach(function(mark){if(pct>=mark&&!milestones[mark]){milestones[mark]=true;event('article_scroll',{percent_scrolled:mark,page_path:location.pathname});}});},{passive:true});}
})();