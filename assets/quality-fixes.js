(function(){
  function loadMotionSystem(){
    if(!document.querySelector('link[href^="/assets/motion-system.css"]')){
      var style=document.createElement('link');
      style.rel='stylesheet';
      style.href='/assets/motion-system.css?v=20260802-3';
      style.setAttribute('data-motion-system','true');
      document.head.appendChild(style);
    }

    if(!document.querySelector('script[src^="/assets/motion-system.js"]')){
      var script=document.createElement('script');
      script.src='/assets/motion-system.js?v=20260802-3';
      script.async=false;
      script.setAttribute('data-motion-system','true');
      document.head.appendChild(script);
    }
  }

  function normaliseText(value){
    return (value||'').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function isSectionNavigation(element){
    if(!element){return false;}
    if(element.matches('.guide-toc,.article-toc,[aria-label="On this page"],[aria-label="Article contents"]')){return true;}

    var heading=element.querySelector(':scope > strong:first-child,:scope > h2:first-child,:scope > h3:first-child');
    var text=normaliseText(heading&&heading.textContent);
    return text==='on this page'||text==='in this guide'||text==='article contents'||text==='contents';
  }

  function setActiveSection(nav,link){
    nav.querySelectorAll('a[aria-current="location"]').forEach(function(item){
      if(item!==link){item.removeAttribute('aria-current');}
    });
    if(link){
      link.setAttribute('aria-current','location');
      if(window.matchMedia('(max-width:840px)').matches){
        link.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
      }
    }
  }

  function initialiseSectionNavigation(nav){
    if(nav.dataset.sectionNavigationReady==='true'){return;}
    nav.dataset.sectionNavigationReady='true';
    nav.classList.add('section-jump-nav');

    if(nav.tagName!=='NAV'){
      nav.setAttribute('role','navigation');
    }
    if(!nav.hasAttribute('aria-label')){
      nav.setAttribute('aria-label','On this page');
    }

    var parent=nav.parentElement;
    if(parent){parent.classList.add('has-section-jump-nav');}

    var entries=[];
    nav.querySelectorAll('a[href^="#"]').forEach(function(link){
      var id=decodeURIComponent(link.getAttribute('href').slice(1));
      var section=document.getElementById(id);
      if(section){entries.push({link:link,section:section});}
    });

    if(!entries.length){return;}

    var update=function(){
      var offset=(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fixed-header-offset'))||72)+80;
      var current=entries[0];
      entries.forEach(function(entry){
        if(entry.section.getBoundingClientRect().top<=offset){current=entry;}
      });
      setActiveSection(nav,current&&current.link);
    };

    entries.forEach(function(entry){
      entry.link.addEventListener('click',function(){setActiveSection(nav,entry.link);});
    });

    update();
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update,{passive:true});
  }

  function markSectionNavigations(){
    document.querySelectorAll('nav,aside').forEach(function(element){
      if(isSectionNavigation(element)){initialiseSectionNavigation(element);}
    });
  }

  function init(){
    document.querySelectorAll('.market-table-wrap,.ajman-table-wrap').forEach(function(region,index){
      if(!region.hasAttribute('tabindex')){region.setAttribute('tabindex','0');}
      if(!region.hasAttribute('role')){region.setAttribute('role','region');}
      if(!region.hasAttribute('aria-label')){
        region.setAttribute('aria-label',region.classList.contains('ajman-table-wrap')?'Scrollable Ajman property data table':'Scrollable Dubai property data table '+(index+1));
      }
    });

    document.querySelectorAll('a[target="_blank"]').forEach(function(link){
      var tokens=(link.getAttribute('rel')||'').split(/\s+/).filter(Boolean);
      if(tokens.indexOf('noopener')===-1){tokens.push('noopener');}
      if(tokens.indexOf('noreferrer')===-1){tokens.push('noreferrer');}
      link.setAttribute('rel',tokens.join(' '));
    });

    markSectionNavigations();
  }

  loadMotionSystem();
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();
