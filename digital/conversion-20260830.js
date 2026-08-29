(function(){
  'use strict';
  function qs(s,r){return (r||document).querySelector(s)}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function encode(v){return encodeURIComponent(v||'')}
  function details(form){var fd=new FormData(form), out=[]; fd.forEach(function(v,k){if(v && !String(k).startsWith('_')) out.push(k+': '+v)}); return out.join('\n')}

  var lead=qs('#lead-form');
  if(lead){
    var next=qs('[data-lead-next]',lead), step2=qs('[data-step="2"]',lead), prepared=qs('[data-prepared-actions]',lead);
    if(next){next.addEventListener('click',function(){var req=qsa('[data-step="1"] [required]',lead);var bad=req.find(function(el){return !el.checkValidity()});if(bad){bad.reportValidity();return}step2.hidden=false;next.hidden=true;step2.scrollIntoView({behavior:'smooth',block:'start'})})}
    lead.addEventListener('submit',function(e){e.preventDefault();if(!lead.checkValidity()){lead.reportValidity();return}var text='Hi James, I would like to discuss a digital project.\n\n'+details(lead);var wa=qs('[data-send-whatsapp]',lead), em=qs('[data-send-email]',lead);wa.href='https://wa.me/971528420933?text='+encode(text);em.href='mailto:james@jamesrealty.uk?subject='+encode('Digital project enquiry')+'&body='+encode(text);prepared.hidden=false;prepared.scrollIntoView({behavior:'smooth',block:'center'});window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'project_brief_prepared',page_path:location.pathname})})
  }

  var call=qs('#call-form');
  if(call){
    var date=qs('#call-date',call), zone=qs('#call-timezone',call), preparedCall=qs('[data-call-actions]',call);
    if(zone) zone.value=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
    if(date){var now=new Date();now.setHours(now.getHours()+2);date.min=now.toISOString().slice(0,16)}
    call.addEventListener('submit',function(e){e.preventDefault();if(!call.checkValidity()){call.reportValidity();return}var fd=new FormData(call), chosen=fd.get('preferred_time'), tz=fd.get('timezone')||'UTC', text='Hi James, I would like to request a project call.\n\n'+details(call)+'\n\nPlease confirm the selected time before the meeting.';var wa=qs('[data-call-whatsapp]',call), em=qs('[data-call-email]',call), cal=qs('[data-call-calendar]',call);wa.href='https://wa.me/971528420933?text='+encode(text);em.href='mailto:james@jamesrealty.uk?subject='+encode('Call request')+'&body='+encode(text);var start=new Date(chosen), end=new Date(start.getTime()+30*60000);function stamp(d){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}cal.href='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encode('Provisional call with James Digital')+'&dates='+stamp(start)+'/'+stamp(end)+'&details='+encode('Provisional hold. The time is confirmed only after James replies.')+'&ctz='+encode(tz);preparedCall.hidden=false;preparedCall.scrollIntoView({behavior:'smooth',block:'center'});window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'call_request_prepared',page_path:location.pathname})})
  }

  if(!qs('.mobile-conversion-bar') && !document.body.classList.contains('start-project-page') && !document.body.classList.contains('book-call-page')){
    var bar=document.createElement('div');bar.className='mobile-conversion-bar';bar.innerHTML='<a href="/start-project.html">Start a Project</a><a href="/book-call.html">Book a Call</a>';document.body.appendChild(bar)
  }
})();
