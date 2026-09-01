(function(){
  'use strict';
  function init(){
    var root=document.querySelector('[data-project-directory]');if(!root)return;
    var cards=Array.prototype.slice.call(root.querySelectorAll('[data-project-card]'));
    var controls=Array.prototype.slice.call(root.querySelectorAll('select[data-filter]'));
    var summary=root.querySelector('[data-result-count]');var empty=root.querySelector('[data-directory-empty]');var reset=root.querySelector('[data-directory-reset]');
    function apply(){
      var active={};controls.forEach(function(control){if(control.value)active[control.dataset.filter]=control.value;});
      var visible=0;
      cards.forEach(function(card){var show=Object.keys(active).every(function(key){return (card.dataset[key]||'').split('|').indexOf(active[key])>-1;});card.hidden=!show;if(show)visible+=1;});
      if(summary)summary.textContent=visible+' evidence-led project '+(visible===1?'profile':'profiles');if(empty)empty.hidden=visible!==0;
      window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'property_directory_filter',visible_projects:visible,active_filters:Object.keys(active).length});
    }
    controls.forEach(function(control){control.addEventListener('change',apply);});
    if(reset)reset.addEventListener('click',function(){controls.forEach(function(control){control.value='';});apply();});
    apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
