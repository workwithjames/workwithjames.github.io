(function(){
  'use strict';

  var ENDPOINTS=[
    'https://dxbdata.xyz/api/transactions',
    'https://dxbdata.io/api/transactions'
  ];
  var PAGE_SIZE=500;
  var MAX_PAGES=12;
  var REFRESH_MS=15*60*1000;
  var records=[];
  var activeEndpoint='';

  function text(value){return String(value==null?'':value);}
  function esc(value){return text(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function number(value){return (Number(value)||0).toLocaleString('en-AE');}
  function money(value){
    var n=Number(value)||0;
    if(n>=1000000000){return 'AED '+(n/1000000000).toFixed(2).replace(/\.00$/,'')+'B';}
    if(n>=1000000){return 'AED '+(n/1000000).toFixed(2).replace(/\.00$/,'')+'M';}
    return 'AED '+Math.round(n).toLocaleString('en-AE');
  }
  function dubaiParts(date){
    var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date||new Date());
    var out={};parts.forEach(function(part){if(part.type!=='literal'){out[part.type]=part.value;}});
    return out;
  }
  function dubaiDate(){var p=dubaiParts(new Date());return p.year+'-'+p.month+'-'+p.day;}
  function displayDate(value){
    var d=new Date(value+'T12:00:00+04:00');
    return new Intl.DateTimeFormat('en-AE',{timeZone:'Asia/Dubai',day:'numeric',month:'long',year:'numeric'}).format(d);
  }
  function displayTime(){return new Intl.DateTimeFormat('en-AE',{timeZone:'Asia/Dubai',hour:'numeric',minute:'2-digit'}).format(new Date());}
  function transactionDate(value){
    if(!value){return '';}
    var raw=text(value);
    var direct=raw.match(/^\d{4}-\d{2}-\d{2}/);
    if(direct){return direct[0];}
    var d=new Date(raw);if(Number.isNaN(d.getTime())){return '';}
    var p=dubaiParts(d);return p.year+'-'+p.month+'-'+p.day;
  }
  function median(values){
    var list=values.map(Number).filter(function(v){return Number.isFinite(v)&&v>0;}).sort(function(a,b){return a-b;});
    if(!list.length){return 0;}
    var mid=Math.floor(list.length/2);return list.length%2?list[mid]:(list[mid-1]+list[mid])/2;
  }
  function track(action,label){
    if(typeof window.gtag==='function'){window.gtag('event','today_transactions_interaction',{action:action,item_name:label||'',page_path:location.pathname});}
  }
  function addStyles(){
    if(document.getElementById('today-transactions-style')){return;}
    var style=document.createElement('style');style.id='today-transactions-style';
    style.textContent='.today-dashboard{scroll-margin-top:110px}.today-dashboard .today-status{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:0 0 1rem;flex-wrap:wrap}.today-dashboard .today-status p{margin:0}.today-dashboard .today-live-dot{display:inline-block;width:.55rem;height:.55rem;border-radius:50%;background:currentColor;margin-right:.45rem}.today-dashboard .today-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:1rem}.today-dashboard .today-panel{min-width:0}.today-dashboard .today-area-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.75rem;align-items:center;padding:.8rem 0;border-bottom:1px solid rgba(255,255,255,.08)}.today-dashboard .today-area-row:last-child{border-bottom:0}.today-dashboard .today-area-row span{display:block}.today-dashboard .today-area-row small{display:block;opacity:.7;margin-top:.2rem}.today-dashboard .today-empty{padding:1rem 0;opacity:.78}.today-dashboard .today-source-note{margin-top:1rem;font-size:.88rem;opacity:.78}.today-dashboard .today-table td,.today-dashboard .today-table th{white-space:nowrap}.today-dashboard .today-table td:first-child,.today-dashboard .today-table th:first-child{white-space:normal}.today-dashboard .today-refresh[disabled]{opacity:.55;cursor:wait}@media(max-width:900px){.today-dashboard .today-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }
  function createSection(){
    if(document.getElementById('today-transactions')){return document.getElementById('today-transactions');}
    var overview=document.querySelector('.market-overview');
    if(!overview){return null;}
    var section=document.createElement('section');
    section.id='today-transactions';section.className='section-shell today-dashboard';section.setAttribute('aria-labelledby','today-transactions-title');
    section.innerHTML='<div class="section-heading market-heading"><div><p class="section-kicker">Today in Dubai</p><h2 id="today-transactions-title">Today\'s property transactions.</h2></div><p id="today-transactions-date">Dubai date</p></div>'+
      '<div class="today-status"><p id="today-transactions-status" aria-live="polite"><span class="today-live-dot" aria-hidden="true"></span>Connecting to today\'s feed...</p><button id="today-transactions-refresh" class="button button-outline today-refresh" type="button">Refresh today</button></div>'+
      '<div class="market-stats"><article><span>Transactions today</span><strong id="today-total">—</strong></article><article><span>Registered value</span><strong id="today-value">—</strong></article><article><span>Median sale price</span><strong id="today-median">—</strong></article><article><span>Dubai areas</span><strong id="today-areas">—</strong></article></div>'+
      '<div class="today-grid"><article class="market-card today-panel"><div class="market-card-heading"><div><p class="section-kicker">Activity by location</p><h3>Most active areas today</h3></div><span id="today-area-count">Loading</span></div><div id="today-area-list" aria-live="polite"><p class="today-empty">Waiting for today\'s records.</p></div></article>'+
      '<article class="market-card today-panel"><div class="market-card-heading"><div><p class="section-kicker">Latest available records</p><h3>Recent transactions today</h3></div><span>Up to 10 shown</span></div><div class="market-table-wrap"><table class="market-table today-table"><thead><tr><th>Area</th><th>Type</th><th>Size</th><th>Value</th></tr></thead><tbody id="today-transaction-rows"><tr><td colspan="4">Waiting for today\'s records.</td></tr></tbody></table></div></article></div>'+
      '<p id="today-source-note" class="today-source-note">Today means the current Dubai calendar date. Figures appear only after the public source publishes records for that date and may remain incomplete during the day.</p>';
    overview.insertAdjacentElement('afterend',section);
    document.getElementById('today-transactions-refresh').addEventListener('click',function(){load(true);track('manual_refresh',dubaiDate());});
    return section;
  }
  function status(message,state){
    var el=document.getElementById('today-transactions-status');if(!el){return;}
    el.innerHTML='<span class="today-live-dot" aria-hidden="true"></span>'+esc(message);
    el.dataset.state=state||'';
  }
  async function fetchPage(endpoint,date,offset){
    var params=new URLSearchParams({from_date:date,to_date:date,limit:String(PAGE_SIZE),offset:String(offset),sort:'instance_date',order:'DESC'});
    var controller=new AbortController();var timer=setTimeout(function(){controller.abort();},20000);
    try{
      var response=await fetch(endpoint+'?'+params.toString(),{headers:{'Accept':'application/json'},signal:controller.signal,cache:'no-store'});
      if(!response.ok){throw new Error('HTTP '+response.status);}
      var payload=await response.json();
      if(!payload||!Array.isArray(payload.data)){throw new Error('Unexpected response');}
      return payload.data;
    }finally{clearTimeout(timer);}
  }
  async function fetchToday(date){
    var lastError=null;
    for(var e=0;e<ENDPOINTS.length;e++){
      var endpoint=ENDPOINTS[e];var all=[];
      try{
        for(var page=0;page<MAX_PAGES;page++){
          var batch=await fetchPage(endpoint,date,page*PAGE_SIZE);
          all=all.concat(batch);
          if(batch.length<PAGE_SIZE){break;}
        }
        activeEndpoint=endpoint;
        return {data:all.filter(function(row){return transactionDate(row.instance_date)===date;}),capped:all.length>=PAGE_SIZE*MAX_PAGES};
      }catch(error){lastError=error;}
    }
    throw lastError||new Error('Today feed unavailable');
  }
  function aggregateAreas(data){
    var map={};
    data.forEach(function(row){
      var area=text(row.area_name_en||'Area not specified').trim()||'Area not specified';
      if(!map[area]){map[area]={area:area,count:0,value:0};}
      map[area].count+=1;map[area].value+=Number(row.actual_worth)||0;
    });
    return Object.keys(map).map(function(key){return map[key];}).sort(function(a,b){return b.count-a.count||b.value-a.value;});
  }
  function render(data,date,capped){
    records=data;
    var totalValue=data.reduce(function(sum,row){return sum+(Number(row.actual_worth)||0);},0);
    var med=median(data.map(function(row){return row.actual_worth;}));
    var areas=aggregateAreas(data);
    document.getElementById('today-transactions-date').textContent=displayDate(date);
    document.getElementById('today-total').textContent=number(data.length)+(capped?'+':'');
    document.getElementById('today-value').textContent=money(totalValue);
    document.getElementById('today-median').textContent=med?money(med):'—';
    document.getElementById('today-areas').textContent=number(areas.length);
    document.getElementById('today-area-count').textContent=areas.length?number(areas.length)+' areas':'No published areas';
    var areaList=document.getElementById('today-area-list');
    if(!data.length){
      areaList.innerHTML='<p class="today-empty">No transactions dated '+esc(displayDate(date))+' are available from the source yet.</p>';
      document.getElementById('today-transaction-rows').innerHTML='<tr><td colspan="4">No same-day records have been published yet.</td></tr>';
      status('No same-day records published yet. Last checked '+displayTime()+' Dubai time.','empty');
    }else{
      areaList.innerHTML=areas.slice(0,8).map(function(row,index){return '<div class="today-area-row"><div><strong>'+(index+1)+'. '+esc(row.area)+'</strong><small>'+money(row.value)+' registered value</small></div><strong>'+number(row.count)+'</strong></div>';}).join('');
      document.getElementById('today-transaction-rows').innerHTML=data.slice(0,10).map(function(row){
        var type=row.property_sub_type_en||row.property_type_en||'—';
        var size=Number(row.procedure_area)||0;
        return '<tr><td><strong>'+esc(row.area_name_en||'Not specified')+'</strong></td><td>'+esc(type)+'</td><td>'+(size?number(Math.round(size))+' m²':'—')+'</td><td>'+money(row.actual_worth)+'</td></tr>';
      }).join('');
      status(number(data.length)+(capped?'+':'')+' records dated today. Refreshed '+displayTime()+' Dubai time.','live');
    }
    var note=document.getElementById('today-source-note');
    note.textContent='Source: DLD-derived transaction records delivered by DXBData. Today means '+displayDate(date)+' in Dubai. The feed may update in batches, so intraday totals are provisional'+(capped?' and the displayed count is capped by the public endpoint.':'.');
    try{sessionStorage.setItem('today-transactions-cache',JSON.stringify({date:date,time:Date.now(),data:data,capped:capped}));}catch(e){}
    track('dashboard_loaded',String(data.length));
  }
  function renderUnavailable(date){
    document.getElementById('today-transactions-date').textContent=displayDate(date);
    ['today-total','today-value','today-median','today-areas'].forEach(function(id){document.getElementById(id).textContent='Unavailable';});
    document.getElementById('today-area-count').textContent='Connection unavailable';
    document.getElementById('today-area-list').innerHTML='<p class="today-empty">The same-day transaction source could not be reached. The broader market snapshot below remains available.</p>';
    document.getElementById('today-transaction-rows').innerHTML='<tr><td colspan="4">Today\'s feed is temporarily unavailable.</td></tr>';
    status('Today\'s feed is temporarily unavailable.','error');
  }
  async function load(force){
    var date=dubaiDate();var button=document.getElementById('today-transactions-refresh');
    if(button){button.disabled=true;button.textContent='Refreshing...';}
    status('Checking records dated '+displayDate(date)+'...','loading');
    if(!force){
      try{
        var cached=JSON.parse(sessionStorage.getItem('today-transactions-cache')||'null');
        if(cached&&cached.date===date&&Date.now()-cached.time<5*60*1000){render(cached.data||[],date,!!cached.capped);if(button){button.disabled=false;button.textContent='Refresh today';}return;}
      }catch(e){}
    }
    try{var result=await fetchToday(date);render(result.data,date,result.capped);}
    catch(error){renderUnavailable(date);}
    finally{if(button){button.disabled=false;button.textContent='Refresh today';}}
  }
  function boot(){
    if(!document.querySelector('.market-page')){return;}
    addStyles();if(!createSection()){return;}load(false);window.setInterval(function(){load(true);},REFRESH_MS);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();
