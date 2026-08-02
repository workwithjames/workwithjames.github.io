(function(){
  'use strict';

  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData=Boolean(navigator.connection&&navigator.connection.saveData);
  var supportsObserver='IntersectionObserver' in window;
  var numberMemory=new WeakMap();
  var numberGuard=new WeakSet();
  var revealObserver=null;

  function path(){
    var value=location.pathname||'/';
    return value==='/'?value:(value.endsWith('/')?value:value+'/');
  }

  function all(selector,root){
    try{return Array.prototype.slice.call((root||document).querySelectorAll(selector));}
    catch(error){return [];}
  }

  function visibleSoon(element,delay){
    window.setTimeout(function(){
      requestAnimationFrame(function(){element.setAttribute('data-motion-state','visible');});
    },Math.max(0,delay||0));
  }

  function ensureObserver(){
    if(revealObserver||!supportsObserver||reduceMotion){return;}
    revealObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting){return;}
        entry.target.setAttribute('data-motion-state','visible');
        revealObserver.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -9% 0px'});
  }

  function mark(element,variant,delay,immediate){
    if(!element||element.hasAttribute('data-motion')||element.closest('#mobile-site-menu')){return;}
    element.setAttribute('data-motion',variant||'up');
    element.style.setProperty('--motion-delay',(delay||0)+'ms');
    if(reduceMotion||!supportsObserver||immediate){visibleSoon(element,immediate?delay:0);}
    else{ensureObserver();revealObserver.observe(element);}
  }

  function markSelector(selector,options){
    options=options||{};
    all(selector).forEach(function(element,index){
      mark(element,options.variant||'up',(options.delay||0)+(options.stagger?index*options.stagger:0),Boolean(options.immediate));
    });
  }

  function splitHeadline(selector){
    if(reduceMotion||saveData||!selector){return false;}
    var heading=document.querySelector(selector);
    if(!heading||heading.dataset.motionSplit==='ready'){return false;}
    var original=(heading.textContent||'').replace(/\s+/g,' ').trim();
    var words=original.split(' ').filter(Boolean);
    if(words.length<2){mark(heading,'up',40,true);return false;}

    heading.dataset.motionSplit='ready';
    heading.classList.add('motion-split-ready');
    if(!heading.getAttribute('aria-label')){heading.setAttribute('aria-label',original);}
    heading.textContent='';

    words.forEach(function(word,index){
      var wrap=document.createElement('span');
      wrap.className='motion-word-wrap';
      wrap.setAttribute('aria-hidden','true');
      var inner=document.createElement('span');
      inner.className='motion-word';
      inner.textContent=word;
      inner.style.setProperty('--word-delay',(70+index*72)+'ms');
      wrap.appendChild(inner);
      heading.appendChild(wrap);
      if(index<words.length-1){heading.appendChild(document.createTextNode(' '));}
    });

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){heading.classList.add('is-motion-visible');});
    });
    return true;
  }

  function applyPageMotion(){
    var current=path();
    var split=null;

    if(current==='/'){
      split='#home-title';
      markSelector('.home-hero-copy .eyebrow,.home-hero-copy>p,.conversion-hero-actions,.home-hero-card',{immediate:true,stagger:85,variant:'up'});
      markSelector('.home-section-heading,.home-final',{variant:'up'});
      markSelector('.home-journeys .home-journey',{stagger:78,variant:'up'});
      markSelector('.home-data-grid .home-data-card',{stagger:68,variant:'scale'});
      markSelector('.home-proof-grid article,.home-process article',{stagger:62,variant:'up'});
      markSelector('.property-news-link-grid a',{stagger:52,variant:'up'});
    }else if(current==='/about-me/'){
      split='#hero-title';
      markSelector('.hero-copy .eyebrow,.hero-role,.hero-description,.metrics,.hero-actions,.hero-visual',{immediate:true,stagger:82,variant:'up'});
      markSelector('.profile-panel,.availability,.section-heading,.contact-card',{variant:'up'});
      markSelector('.services-grid .service-card',{stagger:62,variant:'up'});
      markSelector('.work-grid .work-card',{stagger:70,variant:'up'});
      markSelector('.timeline-item,.experience-card,.result-card,.results-grid article,.brands-grid>*',{stagger:60,variant:'up'});
    }else if(['/buy-invest-dubai/','/sell-dubai-property/','/real-estate-marketing/'].indexOf(current)>-1){
      split='#journey-title';
      markSelector('.journey-hero-copy .eyebrow,.journey-hero-copy>p,.journey-hero-copy .conversion-hero-actions,.journey-hero-card',{immediate:true,stagger:82,variant:'up'});
      markSelector('.journey-answer-card,.journey-heading,.qualifier-layout,.article-faq',{variant:'up'});
      markSelector('.journey-question-grid article,.journey-process article',{stagger:68,variant:'up'});
      markSelector('.journey-links a,.journey-keywords span',{stagger:46,variant:'up'});
    }else if(current==='/contact/'){
      split='#contact-page-title';
      markSelector('.contact-goal-hero-copy .section-kicker,.contact-goal-hero-copy>p,.contact-goal-direct,.contact-goal-aside',{immediate:true,stagger:80,variant:'up'});
      markSelector('.contact-goal-heading,.contact-goal-form',{variant:'up'});
      markSelector('.contact-goal-picker .contact-goal-option,.contact-goal-links a',{stagger:62,variant:'up'});
    }else if(current==='/dubai-data/'){
      markSelector('.market-hero>*,.market-heading',{immediate:true,stagger:70,variant:'up'});
      markSelector('.market-stats article,.market-method-grid article,.market-related a',{stagger:58,variant:'up'});
      markSelector('.market-card,.market-tool-card,.market-budget-panel,.market-source',{variant:'up'});
    }else if(current==='/ajman-data/'){
      markSelector('.ajman-hero>*,.ajman-dashboard-heading',{immediate:true,stagger:70,variant:'up'});
      markSelector('.ajman-context-grid article,.ajman-kpis article,.ajman-method-grid article',{stagger:58,variant:'up'});
      markSelector('.ajman-filter-panel,.ajman-panel,.ajman-source-box',{variant:'up'});
    }else if(current==='/abu-dhabi-data/'){
      markSelector('.adrec-hero>*,.abu-dhabi-hero>*,.data-hero>*',{immediate:true,stagger:72,variant:'up'});
      markSelector('.adrec-card,.data-card,.official-dashboard-shell,.adrec-dashboard-shell',{variant:'up'});
    }else if(current==='/blog/'||current==='/blog/property-news/'){
      markSelector('.blog-index-grid>* ,.property-news-grid>* ,.property-news-link-grid a',{stagger:55,variant:'up'});
    }else if(current.indexOf('/blog/')===0){
      markSelector('.article-hero>*,.article-summary,.article-faq,.related-reading',{variant:'up'});
    }

    if(split){splitHeadline(split);}
  }

  function updateStickyState(){
    var rootStyle=getComputedStyle(document.documentElement);
    var fallback=parseFloat(rootStyle.getPropertyValue('--fixed-header-offset'))||80;
    all('.motion-sticky').forEach(function(element){
      var top=parseFloat(getComputedStyle(element).top);
      if(!Number.isFinite(top)){top=fallback;}
      var rect=element.getBoundingClientRect();
      element.classList.toggle('is-stuck',window.scrollY>10&&rect.top<=top+2);
    });
  }

  function prepareStickyElements(){
    all('.about-flow,.contact-goal-picker,.ajman-filter-panel').forEach(function(element){element.classList.add('motion-sticky');});
    var ticking=false;
    function requestUpdate(){
      if(ticking){return;}
      ticking=true;
      requestAnimationFrame(function(){ticking=false;updateStickyState();});
    }
    window.addEventListener('scroll',requestUpdate,{passive:true});
    window.addEventListener('resize',requestUpdate);
    updateStickyState();
  }

  function prepareContactTransitions(){
    if(reduceMotion){return;}
    var form=document.getElementById('contact-goal-form');
    var picker=document.querySelector('.contact-goal-picker');
    if(!form||!picker){return;}
    var previousHeight=0;

    function rememberHeight(){previousHeight=form.getBoundingClientRect().height;}
    picker.addEventListener('pointerdown',rememberHeight,true);
    picker.addEventListener('keydown',function(event){
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].indexOf(event.key)>-1){rememberHeight();}
    },true);

    picker.addEventListener('change',function(){
      window.setTimeout(function(){
        var panel=form.querySelector('[data-goal-panel]:not([hidden])');
        var nextHeight=form.getBoundingClientRect().height;
        if(panel){
          panel.classList.remove('motion-panel-entering');
          void panel.offsetWidth;
          panel.classList.add('motion-panel-entering');
          window.setTimeout(function(){panel.classList.remove('motion-panel-entering');},460);
        }
        if(previousHeight>0&&Math.abs(nextHeight-previousHeight)>4&&form.animate){
          form.classList.add('motion-height-transition');
          form.style.height=previousHeight+'px';
          var animation=form.animate([{height:previousHeight+'px'},{height:nextHeight+'px'}],{
            duration:420,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'
          });
          animation.onfinish=animation.oncancel=function(){
            form.style.height='';
            form.classList.remove('motion-height-transition');
          };
        }
        previousHeight=0;
      },0);
    });
  }

  function parseNumber(text){
    var source=String(text||'');
    var match=source.match(/-?\d[\d,]*(?:\.\d+)?/);
    if(!match){return null;}
    var raw=match[0];
    var value=Number(raw.replace(/,/g,''));
    if(!Number.isFinite(value)){return null;}
    var decimal=(raw.split('.')[1]||'').length;
    return {value:value,prefix:source.slice(0,match.index),suffix:source.slice(match.index+raw.length),decimal:decimal};
  }

  function formatNumber(value,format){
    return format.prefix+new Intl.NumberFormat('en-AE',{
      minimumFractionDigits:format.decimal,
      maximumFractionDigits:format.decimal
    }).format(value)+format.suffix;
  }

  function highlightNumber(element){
    element.classList.remove('motion-number-updated');
    void element.offsetWidth;
    element.classList.add('motion-number-updated');
    window.setTimeout(function(){element.classList.remove('motion-number-updated');},560);
  }

  function animateNumber(element,previousText,nextText){
    var previous=parseNumber(previousText);
    var next=parseNumber(nextText);
    if(!next){numberMemory.set(element,nextText);return;}
    if(!previous||previous.prefix!==next.prefix||previous.suffix!==next.suffix||reduceMotion||document.hidden){
      numberMemory.set(element,nextText);
      highlightNumber(element);
      return;
    }
    if(previous.value===next.value){numberMemory.set(element,nextText);return;}

    numberMemory.set(element,nextText);
    numberGuard.add(element);
    var start=performance.now();
    var duration=480;
    function frame(now){
      var progress=Math.min(1,(now-start)/duration);
      var eased=1-Math.pow(1-progress,3);
      element.textContent=formatNumber(previous.value+(next.value-previous.value)*eased,next);
      if(progress<1){requestAnimationFrame(frame);}
      else{
        element.textContent=nextText;
        numberGuard.delete(element);
        highlightNumber(element);
      }
    }
    requestAnimationFrame(frame);
  }

  function prepareNumberMotion(){
    var selector=[
      '#market-transactions','#market-areas','#market-median','#market-updated',
      '#ajman-sales-value','#ajman-sales-count','#ajman-average-value','#ajman-max-value','#ajman-mortgage-value'
    ].join(',');
    all(selector).forEach(function(element){
      numberMemory.set(element,(element.textContent||'').trim());
      var observer=new MutationObserver(function(){
        if(numberGuard.has(element)){return;}
        var next=(element.textContent||'').trim();
        var previous=numberMemory.get(element)||'';
        if(next===previous){return;}
        animateNumber(element,previous,next);
      });
      observer.observe(element,{childList:true,subtree:true,characterData:true});
    });
  }

  function prepareDynamicResults(){
    if(reduceMotion){return;}
    var selector=[
      '#market-volume-bars','#yield-table-body','#area-result','#comparison-results','#affordability-results',
      '#ajman-trend','#ajman-districts','#ajman-unit-mix','#ajman-sectors','#ajman-project-rows'
    ].join(',');
    all(selector).forEach(function(container){
      var observer=new MutationObserver(function(mutations){
        var added=[];
        mutations.forEach(function(mutation){
          Array.prototype.forEach.call(mutation.addedNodes,function(node){if(node.nodeType===1){added.push(node);}});
        });
        added.slice(0,18).forEach(function(node,index){
          node.classList.remove('motion-result-enter');
          node.style.setProperty('--motion-result-delay',Math.min(index*34,240)+'ms');
          void node.offsetWidth;
          node.classList.add('motion-result-enter');
          window.setTimeout(function(){node.classList.remove('motion-result-enter');},720);
        });
      });
      observer.observe(container,{childList:true,subtree:false});
    });
  }

  function init(){
    document.documentElement.classList.add('jr-motion');
    applyPageMotion();
    prepareStickyElements();
    prepareContactTransitions();
    prepareNumberMotion();
    prepareDynamicResults();
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init,{once:true});}
  else{init();}
})();
