(function(){
  var PHONE='971528420933';

  function analytics(name,data){
    if(typeof window.gtag==='function'){
      window.gtag('event',name,data||{});
    }
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
    form.addEventListener('submit',function(event){
      event.preventDefault();
      if(!form.reportValidity()) return;

      var message=buildMessage(form);
      var url='https://wa.me/'+PHONE+'?text='+encodeURIComponent(message);
      if(status) status.textContent='Opening WhatsApp with your enquiry details.';
      analytics('generate_lead',{
        method:'qualified_whatsapp',
        service:clean(form.dataset.journey||'Property enquiry'),
        page_path:location.pathname
      });
      window.open(url,'_blank','noopener,noreferrer');
    });
  }

  function init(){
    document.querySelectorAll('[data-whatsapp-qualifier]').forEach(prepare);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
