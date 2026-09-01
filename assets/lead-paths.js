(function(){
  var PHONE='971528420933';

  function analytics(name,data){
    if(typeof window.gtag==='function'){
      window.gtag('event',name,data||{});
      return;
    }
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(Object.assign({event:name},data||{}));
  }

  function clean(value){
    return String(value||'').replace(/\s+/g,' ').trim();
  }

  function fieldValue(field){
    if(field.type==='checkbox') return field.checked?'Yes':'';
    if(field.tagName==='SELECT'){
      var option=field.options[field.selectedIndex];
      return option?clean(option.textContent):'';
    }
    return clean(field.value);
  }

  function buildMessage(form){
    var journey=clean(form.dataset.journey||'Property enquiry');
    var intro=clean(form.dataset.intro||('Hello James, I would like to discuss '+journey.toLowerCase()+'.'));
    var lines=[intro,''];

    form.querySelectorAll('[name]').forEach(function(field){
      var value=fieldValue(field);
      if(!value) return;
      var label=clean(field.dataset.label||field.getAttribute('aria-label')||field.name.replace(/[_-]+/g,' '));
      lines.push(label+': '+value);
    });

    if(typeof window.jamesAttribution==='function'){
      var attribution=window.jamesAttribution();
      if(attribution&&attribution!=='Direct'){
        lines.push('','Website source: '+attribution);
      }
    }

    return lines.join('\n');
  }

  function prepare(form){
    var status=form.querySelector('.qualifier-status');
    form.addEventListener('submit',async function(event){
      event.preventDefault();
      if(!form.reportValidity()) return;

      var message=buildMessage(form);
      var submit=form.querySelector('button[type="submit"]');
      if(!window.jrPropertyLeads){if(status)status.textContent='The secure enquiry service is still loading. Please try again.';return;}
      if(status) status.textContent='Saving your enquiry securely…';
      if(submit) submit.disabled=true;
      try{
        var result=await window.jrPropertyLeads.send(window.jrPropertyLeads.buildPayload(form,{intent:form.dataset.journey}));
        var reference=String(result.lead_id).slice(0,8);
        analytics('generate_lead',{method:'saved_before_whatsapp',lead_id:reference,service:clean(form.dataset.journey||'Property enquiry'),page_path:location.pathname});
        analytics('qualified_lead_submit',{service:clean(form.dataset.journey||'Property enquiry'),field_count:form.querySelectorAll('[name]').length,page_path:location.pathname});
        if(status) status.textContent='Enquiry saved. Opening WhatsApp with reference '+reference+'.';
        window.open('https://wa.me/'+PHONE+'?text='+encodeURIComponent(message+'\n\nRequest reference: '+reference),'_blank','noopener,noreferrer');
      }catch(error){
        if(status) status.textContent='Your enquiry could not be saved yet. A private safety copy remains on this device; please retry.';
        analytics('property_lead_capture_error',{page_path:location.pathname,error_message:String(error.message||error).slice(0,120)});
      }finally{if(submit)submit.disabled=false;}
    });
  }

  function init(){
    document.querySelectorAll('[data-whatsapp-qualifier]').forEach(prepare);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
