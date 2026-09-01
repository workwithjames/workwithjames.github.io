(function(){
  var endpoint='https://dxbdata.io/mcp';
  var requestId=100;
  var areaCache=[];
  var cachePrefix='dxb-market-v2:';
  var cacheTtl=15*60*1000;
  var fallbackOverview={"total_transactions":21253,"areas":151,"period":{"from":"2026-06-23","to":"2026-07-31"},"median_sale_price_aed":1156797,"top_areas_by_volume":[{"area":"Madinat Al Mataar","n":2742},{"area":"Al Barsha South Fourth","n":1456},{"area":"Jabal Ali First","n":1251},{"area":"Jabal Ali Industrial Second","n":1073},{"area":"Wadi Al Safa 4","n":808}]};
  var overviewCache=fallbackOverview;
  var fallbackYield={"property_type":"Flat","ranking":[{"area":"Al Hebiah Second","gross_rental_yield_pct":11.99,"median_price_per_sqm_aed":16236,"rent_sample":28,"sale_sample":182},{"area":"Dubai Investment Park First","gross_rental_yield_pct":7.92,"median_price_per_sqm_aed":9743,"rent_sample":7,"sale_sample":156},{"area":"Al Merkadh","gross_rental_yield_pct":6.83,"median_price_per_sqm_aed":22277,"rent_sample":27,"sale_sample":282},{"area":"Al Yelayiss 2","gross_rental_yield_pct":6.58,"median_price_per_sqm_aed":14696,"rent_sample":20,"sale_sample":121},{"area":"Al Thanyah Third","gross_rental_yield_pct":6.52,"median_price_per_sqm_aed":18737,"rent_sample":24,"sale_sample":39},{"area":"Al Barsha South Fourth","gross_rental_yield_pct":6.39,"median_price_per_sqm_aed":15101,"rent_sample":105,"sale_sample":935},{"area":"Me'Aisem First","gross_rental_yield_pct":6.28,"median_price_per_sqm_aed":14335,"rent_sample":17,"sale_sample":291},{"area":"Al Barsha South Fifth","gross_rental_yield_pct":6.23,"median_price_per_sqm_aed":17532,"rent_sample":15,"sale_sample":158},{"area":"Nadd Hessa","gross_rental_yield_pct":5.94,"median_price_per_sqm_aed":12917,"rent_sample":77,"sale_sample":135},{"area":"Hadaeq Sheikh Mohammed Bin Rashid","gross_rental_yield_pct":5.82,"median_price_per_sqm_aed":24324,"rent_sample":18,"sale_sample":149}]};
  function text(value){return String(value==null?'':value);}
  function esc(value){return text(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function money(value){var n=Number(value)||0;if(n>=1000000000){return 'AED '+(n/1000000000).toFixed(2).replace(/\.00$/,'')+'B';}if(n>=1000000){return 'AED '+(n/1000000).toFixed(2).replace(/\.00$/,'')+'M';}return 'AED '+Math.round(n).toLocaleString('en-AE');}
  function number(value){return (Number(value)||0).toLocaleString('en-AE');}
  function date(value){if(!value){return '';}var d=new Date(value+'T12:00:00Z');return new Intl.DateTimeFormat('en-AE',{day:'numeric',month:'short',year:'numeric'}).format(d);}
  function isoDate(value){return value.getUTCFullYear()+'-'+String(value.getUTCMonth()+1).padStart(2,'0')+'-'+String(value.getUTCDate()).padStart(2,'0');}
  function parseIso(value){var match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]))):null;}
  function dubaiYesterday(){
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    var values={};parts.forEach(function(part){if(part.type!=='literal'){values[part.type]=part.value;}});
    return new Date(Date.UTC(Number(values.year),Number(values.month)-1,Number(values.day))-86400000);
  }
  function rollingCoverage(data){
    var period=(data&&data.period)||{};
    var sourceFrom=parseIso(period.from);
    var sourceTo=parseIso(period.to);
    var days=39;
    if(sourceFrom&&sourceTo){days=Math.round((sourceTo-sourceFrom)/86400000)+1;}
    days=Math.max(7,Math.min(90,days));
    var end=dubaiYesterday();
    if(sourceTo&&sourceTo>end){end=sourceTo;}
    var start=new Date(end.getTime()-(days-1)*86400000);
    var lag=sourceTo?Math.max(0,Math.round((end-sourceTo)/86400000)):0;
    return {from:isoDate(start),to:isoDate(end),sourceTo:period.to||'',lagDays:lag};
  }
  function setConnectedStatus(){
    var coverage=rollingCoverage(overviewCache);
    var label=coverage.sourceTo?'Live connection · source through '+date(coverage.sourceTo):'Live data connected';
    setStatus(label,'live');
  }
  function track(action,label){if(typeof window.gtag==='function'){window.gtag('event','market_data_interaction',{action:action,item_name:label||'',page_path:location.pathname});}}
  function setStatus(message,state){var el=document.getElementById('market-live-status');if(!el){return;}el.textContent=message;el.dataset.state=state||'';}
  async function callTool(name,args){
    args=args||{};
    var cacheKey=cachePrefix+name+':'+JSON.stringify(args);
    try{var saved=JSON.parse(sessionStorage.getItem(cacheKey)||'null');if(saved&&Date.now()-saved.time<cacheTtl){return saved.data;}}catch(e){}
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},15000);
    try{
      var response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:++requestId,method:'tools/call',params:{name:name,arguments:args||{}}}),signal:controller.signal});
      if(!response.ok){throw new Error('Data service returned '+response.status);}
      var payload=await response.json();
      if(payload.error){throw new Error(payload.error.message||'Data service error');}
      var block=payload.result&&payload.result.content&&payload.result.content[0];
      if(!block||!block.text){throw new Error('No data returned');}
      var data=JSON.parse(block.text);
      try{sessionStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),data:data}));}catch(e){}
      return data;
    }finally{clearTimeout(timer);}
  }
  function renderOverview(data){
    overviewCache=data||fallbackOverview;
    var coverage=rollingCoverage(overviewCache);
    document.getElementById('market-transactions').textContent=number(data.total_transactions);
    document.getElementById('market-areas').textContent=number(data.areas);
    document.getElementById('market-median').textContent=money(data.median_sale_price_aed);
    document.getElementById('market-period').textContent=date(coverage.from)+' to '+date(coverage.to);
    document.getElementById('market-updated').textContent='Daily window through '+date(coverage.to);
    var sourceDate=document.getElementById('market-source-date');if(sourceDate){sourceDate.textContent=coverage.sourceTo?(coverage.lagDays?'Latest DXB Data source record: '+date(coverage.sourceTo)+' ('+coverage.lagDays+' day'+(coverage.lagDays===1?'':'s')+' behind the daily window).':'DXB Data source records are current through '+date(coverage.sourceTo)+'.'):'';}
    var answer=document.getElementById('market-answer');if(answer){answer.textContent='The latest available snapshot covers '+number(data.total_transactions)+' recent transactions across '+number(data.areas)+' Dubai areas, with a citywide median sale price of '+money(data.median_sale_price_aed)+'. The dashboard window advances daily and shows the provider\'s latest source date separately.';}
    var rows=data.top_areas_by_volume||[];
    var max=Math.max.apply(null,rows.map(function(row){return Number(row.n)||0;}));
    document.getElementById('market-volume-bars').innerHTML=rows.map(function(row,index){
      var width=max?Math.max(6,Math.round((Number(row.n)/max)*100)):0;
      return '<div class="market-bar-row"><div class="market-bar-label"><span>'+(index+1)+'. '+esc(row.area)+'</span><strong>'+number(row.n)+'</strong></div><div class="market-bar-track"><span style="width:'+width+'%"></span></div></div>';
    }).join('');
  }
  function renderYield(data){
    var rows=data.ranking||[];
    document.getElementById('yield-table-body').innerHTML=rows.map(function(row,index){
      return '<tr><td><span class="market-rank">'+(index+1)+'</span><strong>'+esc(row.area)+'</strong></td><td>'+Number(row.gross_rental_yield_pct).toFixed(2)+'%</td><td>'+money(row.median_price_per_sqm_aed)+'</td><td>'+number(row.sale_sample)+'</td></tr>';
    }).join('');
    document.getElementById('yield-table-label').textContent=(data.property_type||'Flat')+' rankings';
  }
  async function loadYield(type){
    setStatus('Refreshing '+type.toLowerCase()+' yields...','loading');
    try{
      var data=await callTool('rank_areas_by_yield',{property_type:type,limit:10});
      renderYield(data);
      setConnectedStatus();
    }catch(error){
      if(type==='Flat'){renderYield(fallbackYield);}
      setStatus('Showing the latest saved snapshot','saved');
    }
  }
  function populateAreas(areas){
    areaCache=areas||[];
    var options=areaCache.map(function(area){return '<option value="'+esc(area)+'"></option>';}).join('');
    document.getElementById('market-area-options').innerHTML=options;
    var selects=document.querySelectorAll('.market-area-select');
    selects.forEach(function(select,index){
      var current=select.dataset.default||'Business Bay';
      select.innerHTML=areaCache.map(function(area){return '<option value="'+esc(area)+'"'+(area===current?' selected':'')+'>'+esc(area)+'</option>';}).join('');
    });
  }
  function alias(value){
    var key=text(value).trim().toLowerCase();
    var map={'dubai marina':'Marsa Dubai','jumeirah village circle':'Al Barsha South Fourth','jvc':'Al Barsha South Fourth','dubai hills estate':'Hadaeq Sheikh Mohammed Bin Rashid','dubai production city':"Me'Aisem First",'motor city':'Al Hebiah First','downtown dubai':'Burj Khalifa'};
    return map[key]||text(value).trim();
  }
  function renderArea(snapshot,yieldData){
    var box=document.getElementById('area-result');
    box.hidden=false;
    box.innerHTML='<div class="market-result-heading"><div><p class="section-kicker">'+esc(snapshot.property_type)+' snapshot</p><h3>'+esc(snapshot.area)+'</h3></div><span>'+date(snapshot.period.from)+' to '+date(snapshot.period.to)+'</span></div><div class="market-result-grid"><div><strong>'+money(snapshot.median_price_aed)+'</strong><span>Median sale price</span></div><div><strong>'+money(snapshot.median_price_per_sqm_aed)+'</strong><span>Median price per m²</span></div><div><strong>'+Number(yieldData.gross_rental_yield_pct||0).toFixed(2)+'%</strong><span>Gross rental yield</span></div><div><strong>'+number(snapshot.sample_size)+'</strong><span>Recent sale sample</span></div></div>';
  }
  async function lookupArea(){
    var input=document.getElementById('market-area-input');
    var area=alias(input.value);
    var type=document.getElementById('market-area-type').value;
    var message=document.getElementById('area-message');
    if(!area){message.textContent='Choose or type a Dubai area.';return;}
    message.textContent='Loading '+area+'...';
    track('area_lookup',area);
    try{
      var data=await Promise.all([callTool('area_snapshot',{area:area,property_type:type}),callTool('rental_yield',{area:area,property_type:type})]);
      renderArea(data[0],data[1]);
      message.textContent='Source: Dubai Land Department transactions and Ejari data, delivered by DXB Data.';
    }catch(error){
      message.textContent='That area was not found in the current dataset. Try an official area name from the suggestions.';
    }
  }
  function renderComparison(data){
    document.getElementById('comparison-results').innerHTML=(data.areas||[]).map(function(row){
      return '<article class="comparison-card"><h3>'+esc(row.area)+'</h3><dl><div><dt>Median price</dt><dd>'+money(row.median_price_aed)+'</dd></div><div><dt>Price per m²</dt><dd>'+money(row.median_price_per_sqm_aed)+'</dd></div><div><dt>Gross yield</dt><dd>'+Number(row.gross_rental_yield_pct||0).toFixed(2)+'%</dd></div><div><dt>Sale sample</dt><dd>'+number(row.sample_size)+'</dd></div></dl></article>';
    }).join('');
  }
  async function compareAreas(){
    var areas=Array.from(document.querySelectorAll('.market-area-select')).map(function(el){return el.value;}).filter(Boolean);
    var type=document.getElementById('compare-property-type').value;
    var message=document.getElementById('comparison-message');
    message.textContent='Comparing areas...';
    track('compare_areas',areas.join(', '));
    try{
      var data=await callTool('compare_areas',{areas:areas,property_type:type});
      renderComparison(data);
      message.textContent='Comparison refreshed from the current dataset.';
    }catch(error){message.textContent='The comparison could not be refreshed. Please try again.';}
  }
  function renderAffordability(data){
    var areas=(data.areas||[]).slice(0,10);
    document.getElementById('affordability-results').innerHTML=areas.map(function(row,index){
      return '<article class="affordable-row"><span>'+(index+1)+'</span><div><strong>'+esc(row.area)+'</strong><small>'+number(row.sample_size)+' recent sales</small></div><div><strong>'+money(row.median_price_aed)+'</strong><small>'+money(row.median_price_per_sqm_aed)+' per m²</small></div></article>';
    }).join('');
    document.getElementById('affordability-count').textContent=number(data.affordable_areas_count)+' areas have a recent median within this budget.';
  }
  async function findAffordable(){
    var budget=Number(document.getElementById('market-budget').value);
    var type=document.getElementById('budget-property-type').value;
    var message=document.getElementById('affordability-count');
    if(!budget||budget<100000){message.textContent='Enter a budget of at least AED 100,000.';return;}
    message.textContent='Checking recent median prices...';
    track('affordability',String(budget));
    try{
      var data=await callTool('affordability',{budget_aed:budget,property_type:type});
      renderAffordability(data);
    }catch(error){message.textContent='The affordability results could not be refreshed. Please try again.';}
  }
  async function boot(){
    renderOverview(fallbackOverview);
    renderYield(fallbackYield);
    document.getElementById('area-lookup-button').addEventListener('click',lookupArea);
    document.getElementById('compare-areas-button').addEventListener('click',compareAreas);
    document.getElementById('affordability-button').addEventListener('click',findAffordable);
    var copyButton=document.getElementById('copy-market-link');if(copyButton){copyButton.addEventListener('click',async function(){var status=document.getElementById('copy-market-status');try{await navigator.clipboard.writeText('https://jamesrealty.uk/dubai-data/');status.textContent='Dashboard link copied.';track('share_dashboard','copy_link');}catch(error){status.textContent='Copy this address: https://jamesrealty.uk/dubai-data/';}});}
    document.getElementById('market-area-input').addEventListener('keydown',function(e){if(e.key==='Enter'){lookupArea();}});
    document.querySelectorAll('[data-yield-type]').forEach(function(button){
      button.addEventListener('click',function(){
        document.querySelectorAll('[data-yield-type]').forEach(function(item){item.classList.remove('is-active');item.setAttribute('aria-pressed','false');});
        button.classList.add('is-active');button.setAttribute('aria-pressed','true');
        loadYield(button.dataset.yieldType);track('yield_type',button.dataset.yieldType);
      });
    });
    try{
      var live=await Promise.all([callTool('market_overview',{}),callTool('list_areas',{})]);
      renderOverview(live[0]);populateAreas(live[1].areas);
      setConnectedStatus();
      compareAreas();
    }catch(error){
      setStatus('Showing the latest saved snapshot','saved');
      populateAreas(['Al Barsha South Fourth','Al Hebiah Second','Al Merkadh','Business Bay','Burj Khalifa','Dubai Investment Park First','Hadaeq Sheikh Mohammed Bin Rashid','Madinat Al Mataar','Marsa Dubai','Palm Jumeirah']);
    }
    loadYield('Flat');
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();
