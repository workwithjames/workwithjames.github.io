(function(){
  'use strict';
  var DATA_URL='/data/yesterday-transactions.json';
  var REFRESH_MS=15*60*1000;

  function text(value){return String(value==null?'':value);}
  function esc(value){return text(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function number(value){return (Number(value)||0).toLocaleString('en-AE');}
  function money(value){var n=Number(value)||0;if(n>=1e9){return 'AED '+(n/1e9).toFixed(2).replace(/\.00$/,'')+'B';}if(n>=1e6){return 'AED '+(n/1e6).toFixed(2).replace(/\.00$/,'')+'M';}return 'AED '+Math.round(n).toLocaleString('en-AE');}
  function displayDate(value){if(!value){return 'Previous Dubai day';}return new Intl.DateTimeFormat('en-AE',{timeZone:'Asia/Dubai',day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00+04:00'));}
  function displayTimestamp(value){if(!value){return 'refresh pending';}var d=new Date(value);return new Intl.DateTimeFormat('en-AE',{timeZone:'Asia/Dubai',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(d)+' Dubai time';}
  function expectedYesterday(){var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());var p={};parts.forEach(function(x){if(x.type!=='literal'){p[x.type]=x.value;}});var today=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)));today.setUTCDate(today.getUTCDate()-1);return today.toISOString().slice(0,10);}
  function track(action,label){if(typeof window.gtag==='function'){window.gtag('event','yesterday_transactions_interaction',{action:action,item_name:label||'',page_path:location.pathname});}}

  function addStyles(){
    if(document.getElementById('yesterday-transactions-style')){return;}
    var style=document.createElement('style');style.id='yesterday-transactions-style';
    style.textContent='.yesterday-dashboard{scroll-margin-top:110px}.yesterday-dashboard .snapshot-status{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:0 0 1rem;flex-wrap:wrap}.yesterday-dashboard .snapshot-status p{margin:0}.yesterday-dashboard .snapshot-dot{display:inline-block;width:.55rem;height:.55rem;border-radius:50%;background:currentColor;margin-right:.45rem}.yesterday-dashboard .snapshot-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:1rem}.yesterday-dashboard .snapshot-panel{min-width:0}.yesterday-dashboard .snapshot-area-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.75rem;align-items:center;padding:.8rem 0;border-bottom:1px solid rgba(255,255,255,.08)}.yesterday-dashboard .snapshot-area-row:last-child{border-bottom:0}.yesterday-dashboard .snapshot-area-row small{display:block;opacity:.7;margin-top:.2rem}.yesterday-dashboard .snapshot-empty{padding:1rem 0;opacity:.78}.yesterday-dashboard .snapshot-note{margin-top:1rem;font-size:.88rem;opacity:.78}.yesterday-dashboard .snapshot-table td,.yesterday-dashboard .snapshot-table th{white-space:nowrap}.yesterday-dashboard .snapshot-table td:first-child,.yesterday-dashboard .snapshot-table th:first-child{white-space:normal}.yesterday-dashboard .snapshot-refresh[disabled]{opacity:.55;cursor:wait}@media(max-width:900px){.yesterday-dashboard .snapshot-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function createSection(){
    var old=document.getElementById('today-transactions');if(old){old.remove();}
    var existing=document.getElementById('yesterday-transactions');if(existing){return existing;}
    var overview=document.querySelector('.market-overview');if(!overview){return null;}
    var section=document.createElement('section');section.id='yesterday-transactions';section.className='section-shell yesterday-dashboard';section.setAttribute('aria-labelledby','yesterday-transactions-title');
    section.innerHTML='<div class="section-heading market-heading"><div><p class="section-kicker">Previous completed day</p><h2 id="yesterday-transactions-title">Yesterday\'s property transactions.</h2></div><p id="yesterday-transactions-date">Dubai date</p></div>'+
      '<div class="snapshot-status"><p id="yesterday-transactions-status" aria-live="polite"><span class="snapshot-dot" aria-hidden="true"></span>Loading the saved snapshot...</p><button id="yesterday-transactions-refresh" class="button button-outline snapshot-refresh" type="button">Refresh snapshot</button></div>'+
      '<div class="market-stats"><article><span>Transactions</span><strong id="yesterday-total">—</strong></article><article><span>Registered value</span><strong id="yesterday-value">—</strong></article><article><span>Median transaction value</span><strong id="yesterday-median">—</strong></article><article><span>Dubai areas</span><strong id="yesterday-areas">—</strong></article></div>'+
      '<div class="snapshot-grid"><article class="market-card snapshot-panel"><div class="market-card-heading"><div><p class="section-kicker">Activity by location</p><h3>Most active areas</h3></div><span id="yesterday-area-count">Loading</span></div><div id="yesterday-area-list"><p class="snapshot-empty">Waiting for the saved snapshot.</p></div></article>'+
      '<article class="market-card snapshot-panel"><div class="market-card-heading"><div><p class="section-kicker">Latest records</p><h3>Recent transactions from that day</h3></div><span>Up to 10 shown</span></div><div class="market-table-wrap"><table class="market-table snapshot-table"><thead><tr><th>Area</th><th>Type</th><th>Size</th><th>Value</th></tr></thead><tbody id="yesterday-transaction-rows"><tr><td colspan="4">Waiting for the saved snapshot.</td></tr></tbody></table></div></article></div>'+
      '<p id="yesterday-source-note" class="snapshot-note">The server refreshes the previous Dubai calendar day every hour and stores the result on this website.</p>';
    overview.insertAdjacentElement('afterend',section);
    document.getElementById('yesterday-transactions-refresh').addEventListener('click',function(){load(true);track('manual_refresh',expectedYesterday());});
    return section;
  }

  function status(message,state){var el=document.getElementById('yesterday-transactions-status');if(!el){return;}el.innerHTML='<span class="snapshot-dot" aria-hidden="true"></span>'+esc(message);el.dataset.state=state||'';}

  function render(snapshot){
    var date=snapshot.target_date||expectedYesterday();var rows=Array.isArray(snapshot.latest_transactions)?snapshot.latest_transactions:[];var areas=Array.isArray(snapshot.top_areas)?snapshot.top_areas:[];var stale=date!==expectedYesterday();
    document.getElementById('yesterday-transactions-date').textContent=displayDate(date);
    document.getElementById('yesterday-total').textContent=number(snapshot.total_transactions)+(snapshot.capped?'+':'');
    document.getElementById('yesterday-value').textContent=money(snapshot.total_value_aed);
    document.getElementById('yesterday-median').textContent=Number(snapshot.median_sale_price_aed)>0?money(snapshot.median_sale_price_aed):'—';
    document.getElementById('yesterday-areas').textContent=number(snapshot.areas_count);
    document.getElementById('yesterday-area-count').textContent=Number(snapshot.areas_count)?number(snapshot.areas_count)+' areas':'No published areas';
    document.getElementById('yesterday-area-list').innerHTML=areas.length?areas.slice(0,8).map(function(row,index){return '<div class="snapshot-area-row"><div><strong>'+(index+1)+'. '+esc(row.area)+'</strong><small>'+money(row.value_aed)+' registered value</small></div><strong>'+number(row.count)+'</strong></div>';}).join(''):'<p class="snapshot-empty">No transactions were returned for '+esc(displayDate(date))+'.</p>';
    document.getElementById('yesterday-transaction-rows').innerHTML=rows.length?rows.slice(0,10).map(function(row){var type=row.property_sub_type_en||row.property_type_en||'—';var size=Number(row.procedure_area)||0;return '<tr><td><strong>'+esc(row.area_name_en||'Not specified')+'</strong></td><td>'+esc(type)+'</td><td>'+(size?number(Math.round(size))+' m²':'—')+'</td><td>'+money(row.actual_worth)+'</td></tr>';}).join(''):'<tr><td colspan="4">No records were published for this date.</td></tr>';
    if(snapshot.status==='pending'){status('The first saved snapshot is being prepared.','loading');}
    else if(stale){status('Showing the last successful snapshot for '+displayDate(date)+'. The '+displayDate(expectedYesterday())+' refresh is pending.','saved');}
    else if(snapshot.status==='no_records'){status('No records were published for '+displayDate(date)+'. Refreshed '+displayTimestamp(snapshot.generated_at)+'.','empty');}
    else{status(number(snapshot.total_transactions)+' saved records for '+displayDate(date)+'. Refreshed '+displayTimestamp(snapshot.generated_at)+'.','live');}
    document.getElementById('yesterday-source-note').textContent='Source: DLD-derived transaction records delivered by DXBData. The server requests the exact date '+displayDate(date)+' and stores the result locally, so the dashboard remains accessible even when the external service is temporarily unavailable.';
    track('dashboard_loaded',text(snapshot.total_transactions));
  }

  function renderError(){status('The saved snapshot could not be loaded. Please refresh the page.','error');document.getElementById('yesterday-area-list').innerHTML='<p class="snapshot-empty">The local snapshot file is temporarily unavailable.</p>';document.getElementById('yesterday-transaction-rows').innerHTML='<tr><td colspan="4">Snapshot unavailable.</td></tr>';}

  async function load(force){
    var button=document.getElementById('yesterday-transactions-refresh');if(button){button.disabled=true;button.textContent='Refreshing...';}
    status('Loading the saved previous-day snapshot...','loading');
    try{var response=await fetch(DATA_URL+'?v='+(force?Date.now():'1'),{cache:'no-store'});if(!response.ok){throw new Error('HTTP '+response.status);}render(await response.json());}
    catch(error){renderError();}
    finally{if(button){button.disabled=false;button.textContent='Refresh snapshot';}}
  }

  function boot(){if(!document.querySelector('.market-page')){return;}addStyles();if(!createSection()){return;}load(false);window.setInterval(function(){load(true);},REFRESH_MS);}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();
