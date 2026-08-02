(function(){
  function loadMotionSystem(){
    if(!document.querySelector('link[href^="/assets/motion-system.css"]')){
      var style=document.createElement('link');
      style.rel='stylesheet';
      style.href='/assets/motion-system.css?v=20260802-2';
      style.setAttribute('data-motion-system','true');
      document.head.appendChild(style);
    }

    if(!document.querySelector('script[src^="/assets/motion-system.js"]')){
      var script=document.createElement('script');
      script.src='/assets/motion-system.js?v=20260802-2';
      script.async=false;
      script.setAttribute('data-motion-system','true');
      document.head.appendChild(script);
    }
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
  }

  loadMotionSystem();
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();
