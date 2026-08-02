(function(){
  var PHONE='971528420933';
  var DAY=24*60*60*1000;
  var startTime=Date.now();
  var opened=false;
  var formTouched=false;
  var timeReady=false;
  var scrollPercent=0;
  var engaged=false;
  var previousFocus=null;

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function track(name,data){if(typeof window.gtag==='function'){window.gtag('event',name,data||{});}}
  function readStorage(storage,key){try{return storage.getItem(key);}catch(error){return null;}}
  function writeStorage(storage,key,value){try{storage.setItem(key,value);}catch(error){}}

  function pageConfig(path){
    if(path==='/contact/'||path.indexOf('/about-me/')===0||path.indexOf('/cite/')===0||path==='/blog/'||path==='/blog/property-news/'){return null;}
    if(path.indexOf('/buy-invest-dubai/')===0||path.indexOf('/dubai-rental-yield-calculator/')===0){return {type:'goal',goal:'buy',kicker:'Dubai property decision',title:'Still comparing property options?',copy:'Share your budget and timeline to start a more focused Dubai property conversation.',delay:38,scroll:42,exit:24};}
    if(path.indexOf('/sell-dubai-property/')===0){return {type:'goal',goal:'sell',kicker:'Dubai property sale',title:'Preparing to sell a property?',copy:'Share the location and preferred timeline to start with a clearer seller brief.',delay:38,scroll:42,exit:24};}
    if(path.indexOf('/real-estate-marketing/')===0){return {type:'goal',goal:'marketing',kicker:'Real estate growth',title:'Need a stronger lead journey?',copy:'Outline the requirement and target market to discuss campaigns, CRM and conversion.',delay:40,scroll:44,exit:26};}
    if(path==='/dubai-data/'||path==='/abu-dhabi-data/'||path==='/ajman-data/'){return {type:'data',goal:'buy',kicker:'Turn data into a decision',title:'What are you researching?',copy:'Use the market data as context, then share the property goal you are working toward.',delay:50,scroll:55,exit:35};}
    if(path==='/'){return {type:'home',goal:'buy',kicker:'Choose a focused next step',title:'What is your property goal?',copy:'Start a short brief for buying, selling or real estate marketing.',delay:45,scroll:50,exit:34};}
    if(path.indexOf('/blog/')===0){return {type:'article',goal:'buy',kicker:'Apply the market insight',title:'Need help applying this to your goal?',copy:'Share what you are considering and start a focused property conversation.',delay:68,scroll:70,exit:52};}
    return null;
  }

  function eligible(config){
    if(!config){return false;}
    if(readStorage(sessionStorage,'jr_intent_popup_shown')==='1'){return false;}
    var now=Date.now();
    var dismissed=Number(readStorage(localStorage,'jr_intent_popup_dismissed_at')||0);
    var converted=Number(readStorage(localStorage,'jr_intent_popup_converted_at')||0);
    if(dismissed&&now-dismissed<7*DAY){return false;}
    if(converted&&now-converted<30*DAY){return false;}
    return true;
  }

  function fieldMarkup(goal){
    if(goal==='sell'){
      return '<label class="full">Property area or project<input name="property_location" data-label="Property area or project" required placeholder="Example: Dubai Marina, Marina Gate"/></label>'+
        '<label>Timeline<select name="timeline" data-label="Preferred timeline" required><option value="">Select</option><option>As soon as possible</option><option>Within 1 to 3 months</option><option>Within 3 to 6 months</option><option>Testing the market</option></select></label>'+
        '<label>Property type<select name="property_type" data-label="Property type"><option value="">Select</option><option>Apartment</option><option>Townhouse</option><option>Villa</option><option>Commercial property</option><option>Land or plot</option></select></label>';
    }
    if(goal==='marketing'){
      return '<label>Requirement<select name="requirement" data-label="Requirement" required><option value="">Select</option><option>Lead generation</option><option>Project launch strategy</option><option>International investor campaign</option><option>Landing page or funnel</option><option>CRM and automation</option><option>Full acquisition system</option></select></label>'+
        '<label>Target market<input name="target_market" data-label="Target market" required placeholder="UAE, UK, GCC, India"/></label>'+
        '<label class="full">Project or company<input name="project" data-label="Project or company" placeholder="Project, developer or brokerage"/></label>';
    }
    return '<label>Budget<select name="budget" data-label="Budget" required><option value="">Select</option><option>Below AED 1 million</option><option>AED 1 million to 2 million</option><option>AED 2 million to 5 million</option><option>AED 5 million to 10 million</option><option>Above AED 10 million</option></select></label>'+
      '<label>Timeline<select name="timeline" data-label="Purchase timeline" required><option value="">Select</option><option>Within 30 days</option><option>1 to 3 months</option><option>3 to 6 months</option><option>6 to 12 months</option><option>Researching only</option></select></label>'+
      '<label class="full">Preferred areas or projects<input name="areas" data-label="Preferred areas or projects" placeholder="Example: Dubai Hills, Creek Harbour"/></label>';
  }

  function createPopup(config){
    var root=document.createElement('div');
    root.id='intent-popup-root';
    root.className='intent-popup-root';
    root.hidden=true;
    root.innerHTML='<button class="intent-popup-backdrop" type="button" aria-label="Close enquiry form"></button>'+
      '<section class="intent-popup-panel" role="dialog" aria-modal="true" aria-labelledby="intent-popup-title" aria-describedby="intent-popup-copy">'+
      '<button class="intent-popup-close" type="button" aria-label="Close enquiry form">×</button>'+
      '<p class="intent-popup-kicker">'+config.kicker+'</p>'+
      '<h2 id="intent-popup-title">'+config.title+'</h2>'+
      '<p id="intent-popup-copy" class="intent-popup-copy">'+config.copy+'</p>'+
      '<form class="intent-popup-form" id="intent-popup-form">'+
      '<label>First name<input name="name" autocomplete="given-name" required placeholder="Your name"/></label>'+
      '<label>Your goal<select name="goal" required><option value="buy">Buy / Invest</option><option value="sell">Sell</option><option value="marketing">Marketing</option></select></label>'+
      '<div class="intent-popup-fields"></div>'+
      '<label>Anything else?<textarea name="notes" data-label="Additional details" placeholder="Add the area, project or challenge that matters most"></textarea></label>'+
      '<div class="intent-popup-actions"><button class="button nav-whatsapp" type="submit">Continue on WhatsApp <span aria-hidden="true">↗</span></button><a class="intent-popup-full-link" href="/contact/">Use full form</a></div>'+
      '<p class="intent-popup-note">Your details are not stored. This prepares a WhatsApp message for you to review.</p>'+
      '<p class="intent-popup-status" role="status" aria-live="polite"></p>'+
      '</form></section>';
    document.body.appendChild(root);

    var form=root.querySelector('form');
    var goalSelect=form.elements.goal;
    var fields=root.querySelector('.intent-popup-fields');
    var fullLink=root.querySelector('.intent-popup-full-link');
    goalSelect.value=config.goal;

    function renderFields(){
      fields.innerHTML=fieldMarkup(goalSelect.value);
      fullLink.href='/contact/?goal='+encodeURIComponent(goalSelect.value);
    }
    goalSelect.addEventListener('change',function(){renderFields();track('intent_popup_goal_change',{goal:goalSelect.value,page_path:location.pathname});});
    renderFields();

    function close(reason,remember){
      if(root.hidden){return;}
      root.classList.remove('is-visible');
      document.body.classList.remove('intent-popup-open');
      if(remember){writeStorage(localStorage,'jr_intent_popup_dismissed_at',String(Date.now()));}
      track('intent_popup_close',{close_reason:reason,page_path:location.pathname});
      setTimeout(function(){root.hidden=true;if(previousFocus&&previousFocus.focus){previousFocus.focus();}},230);
    }

    root.querySelector('.intent-popup-close').addEventListener('click',function(){close('close_button',true);});
    root.querySelector('.intent-popup-backdrop').addEventListener('click',function(){close('backdrop',true);});
    fullLink.addEventListener('click',function(){track('intent_popup_full_form',{goal:goalSelect.value,page_path:location.pathname});close('full_form',false);});

    root.addEventListener('keydown',function(event){
      if(event.key==='Escape'){event.preventDefault();close('escape',true);return;}
      if(event.key!=='Tab'){return;}
      var focusable=Array.prototype.slice.call(root.querySelectorAll('button,a[href],input,select,textarea')).filter(function(el){return !el.disabled&&el.offsetParent!==null;});
      if(!focusable.length){return;}
      var first=focusable[0];
      var last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });

    form.addEventListener('submit',function(event){
      event.preventDefault();
      if(!form.reportValidity()){return;}
      var data=new FormData(form);
      var goal=clean(data.get('goal'));
      var labels={buy:'buying or investing in Dubai property',sell:'selling a Dubai property',marketing:'real estate marketing'};
      var lines=['Hello James, I would like to discuss '+labels[goal]+'.','','Name: '+clean(data.get('name')),'Goal: '+goalSelect.options[goalSelect.selectedIndex].text];
      fields.querySelectorAll('[name]').forEach(function(field){
        var value=clean(field.value);
        if(!value){return;}
        lines.push(clean(field.dataset.label||field.name)+': '+value);
      });
      var notes=clean(data.get('notes'));
      if(notes){lines.push('Additional details: '+notes);}
      lines.push('Page viewed: '+document.title,'Page URL: '+location.href);
      if(typeof window.jamesAttribution==='function'){
        var attribution=window.jamesAttribution();
        if(attribution&&attribution!=='Direct'){lines.push('Website source: '+attribution);}
      }
      writeStorage(localStorage,'jr_intent_popup_converted_at',String(Date.now()));
      track('generate_lead',{method:'behavior_popup_to_whatsapp',service:goal,page_path:location.pathname});
      root.querySelector('.intent-popup-status').textContent='Opening WhatsApp with your enquiry.';
      window.open('https://wa.me/'+PHONE+'?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener,noreferrer');
    });

    return {root:root,open:function(reason){
      if(opened){return;}
      opened=true;
      previousFocus=document.activeElement;
      writeStorage(sessionStorage,'jr_intent_popup_shown','1');
      root.hidden=false;
      document.body.classList.add('intent-popup-open');
      requestAnimationFrame(function(){root.classList.add('is-visible');});
      setTimeout(function(){var first=form.querySelector('input[name="name"]');if(first){first.focus();}},80);
      track('intent_popup_view',{trigger_reason:reason,popup_type:config.type,default_goal:config.goal,page_path:location.pathname});
    }};
  }

  function init(){
    var config=pageConfig(location.pathname);
    if(!eligible(config)){return;}

    var existingLeadForm=document.querySelector('[data-whatsapp-qualifier],#contact-goal-form,#contact-form');
    if(existingLeadForm){
      existingLeadForm.addEventListener('input',function(){formTouched=true;},{once:true});
      existingLeadForm.addEventListener('change',function(){formTouched=true;},{once:true});
    }

    var visits=Number(readStorage(localStorage,'jr_intent_popup_visits')||0)+1;
    writeStorage(localStorage,'jr_intent_popup_visits',String(Math.min(visits,20)));
    var delay=Math.max(28,config.delay-(visits>1?8:0));
    var popup=createPopup(config);

    function blocked(){
      if(document.visibilityState!=='visible'){return true;}
      if(document.querySelector('.mobile-site-menu.is-open,.goal-nav[open]')){return true;}
      if(formTouched){return true;}
      if(existingLeadForm){
        var rect=existingLeadForm.getBoundingClientRect();
        if(rect.top<window.innerHeight*.82&&rect.bottom>window.innerHeight*.18){return true;}
      }
      return false;
    }

    function tryOpen(reason){
      if(opened||blocked()){return;}
      popup.open(reason);
    }

    function evaluate(reason){
      if(!timeReady){return;}
      var qualifies=scrollPercent>=config.scroll;
      if(config.type==='data'&&engaged&&scrollPercent>=30){qualifies=true;}
      if(config.type==='goal'&&engaged&&scrollPercent>=34){qualifies=true;}
      if(qualifies){tryOpen(reason);}
    }

    setTimeout(function(){timeReady=true;evaluate('engaged_time_and_scroll');},delay*1000);

    window.addEventListener('scroll',function(){
      var root=document.documentElement;
      var total=Math.max(1,root.scrollHeight-root.clientHeight);
      scrollPercent=Math.min(100,Math.round(((window.scrollY||root.scrollTop||0)/total)*100));
      evaluate('engaged_time_and_scroll');
    },{passive:true});

    document.querySelector('main')&&document.querySelector('main').addEventListener('click',function(event){
      if(event.target.closest('a,button,input,select,textarea,details')){engaged=true;evaluate('engaged_interaction');}
    },{passive:true});

    if(window.matchMedia('(min-width:900px)').matches){
      document.addEventListener('mouseout',function(event){
        if(opened||event.relatedTarget||event.clientY>5){return;}
        var seconds=(Date.now()-startTime)/1000;
        if(seconds>=config.exit&&scrollPercent>=15){tryOpen('desktop_exit_intent');}
      });
    }
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
