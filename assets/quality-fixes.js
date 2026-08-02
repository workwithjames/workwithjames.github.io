(function(){
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

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();
