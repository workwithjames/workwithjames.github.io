(function(){
  var PHONE='971528420933';
  var GOAL_LABELS={buy:'Buy or invest in Dubai property',sell:'Sell a Dubai property',marketing:'Real estate marketing'};

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function track(name,data){if(typeof window.gtag==='function'){window.gtag('event',name,data||{});}}

  function init(){
    var form=document.getElementById('contact-goal-form');
    if(!form){return;}

    var goalInputs=Array.prototype.slice.call(form.querySelectorAll('input[name="goal"]'));
    var panels=Array.prototype.slice.call(form.querySelectorAll('[data-goal-panel]'));
    var title=document.getElementById('contact-form-title');
    var status=document.getElementById('contact-goal-status');
    var started=false;

    function setPanelRequirements(panel,active){
      panel.querySelectorAll('[data-required="true"]').forEach(function(field){field.required=active;});
      panel.querySelectorAll('input,select,textarea').forEach(function(field){field.disabled=!active;});
    }

    function selectGoal(goal,source){
      if(!GOAL_LABELS[goal]){goal='buy';}
      goalInputs.forEach(function(input){input.checked=input.value===goal;});
      panels.forEach(function(panel){
        var active=panel.dataset.goalPanel===goal;
        panel.hidden=!active;
        setPanelRequirements(panel,active);
      });
      if(title){title.textContent=GOAL_LABELS[goal]+' enquiry';}
      try{sessionStorage.setItem('jr_contact_goal',goal);}catch(error){}
      if(source){track('contact_goal_selected',{goal:goal,selection_source:source,page_path:location.pathname});}
    }

    function inferredGoal(){
      var query=new URLSearchParams(location.search).get('goal');
      if(query&&GOAL_LABELS[query]){return query;}
      var path='';
      try{path=new URL(document.referrer).pathname;}catch(error){}
      if(path.indexOf('/sell-dubai-property/')===0){return 'sell';}
      if(path.indexOf('/real-estate-marketing/')===0){return 'marketing';}
      if(path.indexOf('/buy-invest-dubai/')===0){return 'buy';}
      try{
        var saved=sessionStorage.getItem('jr_contact_goal');
        if(saved&&GOAL_LABELS[saved]){return saved;}
      }catch(error){}
      return 'buy';
    }

    goalInputs.forEach(function(input){
      input.addEventListener('change',function(){if(input.checked){selectGoal(input.value,'contact_page');}});
    });

    form.addEventListener('input',function(){
      if(started){return;}
      started=true;
      track('form_start',{form_name:'Goal contact form',page_path:location.pathname});
    },{once:true});

    form.addEventListener('submit',function(event){
      event.preventDefault();
      if(!form.reportValidity()){return;}

      var data=new FormData(form);
      var goal=clean(data.get('goal'))||'buy';
      var lines=['Hello James, I would like to discuss '+GOAL_LABELS[goal].toLowerCase()+'.',''];
      var common=[
        ['Name',data.get('name')],
        ['Email',data.get('email')||'Not provided'],
        ['Current location',data.get('location')||'Not provided']
      ];
      common.forEach(function(item){lines.push(item[0]+': '+clean(item[1]));});
      lines.push('Goal: '+GOAL_LABELS[goal]);

      var panel=form.querySelector('[data-goal-panel="'+goal+'"]');
      if(panel){
        panel.querySelectorAll('[name]').forEach(function(field){
          if(field.disabled){return;}
          var value=clean(field.value);
          if(!value){return;}
          var label=clean(field.dataset.label||field.name.replace(/[_-]+/g,' '));
          lines.push(label+': '+value);
        });
      }

      var extra=clean(data.get('additional_details'));
      if(extra){lines.push('','Additional details:',extra);}
      if(typeof window.jamesAttribution==='function'){
        var attribution=window.jamesAttribution();
        if(attribution&&attribution!=='Direct'){lines.push('','Website source: '+attribution);}
      }

      try{
        localStorage.setItem('jr_intent_popup_converted_at',String(Date.now()));
        sessionStorage.setItem('jr_contact_goal',goal);
      }catch(error){}

      track('generate_lead',{method:'goal_contact_form_to_whatsapp',service:goal,page_path:location.pathname});
      if(status){status.textContent='Opening WhatsApp with your enquiry details.';}
      window.open('https://wa.me/'+PHONE+'?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener,noreferrer');
    });

    selectGoal(inferredGoal(),'inferred');
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
