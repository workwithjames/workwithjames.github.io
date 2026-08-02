(function(){
  var endpoint='/api/abu-dhabi-data-safe';
  var state={payload:null,active:'transactions'};
  var defaultCoverage={
    transactions:['Sales','Mortgages','Other transactions','Residential','Commercial','Monthly','Quarterly','Yearly'],
    residentialSales:['Apartments','Villas','Townhouses','Penthouses','Plots','Ready','Off-plan','Court-mandated'],
    leases:['Rented residential units','Residential lease values','Average annual rents','Apartment rent index','Villa rent index'],
    geography:['Abu Dhabi City','Al Ain City','Al Dhafra Region','District','Community','Project'],
    recentSales:['Asset type','Property type','Sale type','District','Community','Project','Layout']
  };

  function byId(id){return document.getElementById(id);}
  function metricValue(metric){return metric&&typeof metric.value==='number'?metric.value:null;}
  function compact(value){
    if(value===null||value===undefined||!Number.isFinite(value)){return 'Not available';}
    var abs=Math.abs(value);
    var maximum=abs>=1e9?1:abs>=1e6?1:0;
    return new Intl.NumberFormat('en-AE',{notation:'compact',maximumFractionDigits:maximum}).format(value);
  }
  function money(value){return value===null||value===undefined||!Number.isFinite(value)?'Not available':'AED '+compact(value);}
  function integer(value){return value===null||value===undefined||!Number.isFinite(value)?'Not available':new Intl.NumberFormat('en-AE',{maximumFractionDigits:0}).format(value);}
  function indexValue(value){return value===null||value===undefined||!Number.isFinite(value)?'Not available':new Intl.NumberFormat('en-AE',{maximumFractionDigits:2}).format(value);}
  function yoy(metric){
    if(!metric||typeof metric.yoy!=='number'||!Number.isFinite(metric.yoy)){return 'Official current reading';}
    var sign=metric.yoy>0?'+':'';
    return sign+metric.yoy.toFixed(2).replace(/\.00$/,'')+'% year on year';
  }
  function setText(id,value){var node=byId(id);if(node){node.textContent=value;}}
  function setStatus(mode,text){var status=byId('adrec-live-status');if(status){status.dataset.state=mode;status.textContent=text;}}
  function sourceTime(value){
    if(!value){return 'Checked just now';}
    var date=new Date(value);
    if(Number.isNaN(date.getTime())){return 'Checked just now';}
    return 'Checked '+new Intl.DateTimeFormat('en-AE',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dubai'}).format(date);
  }

  function updateKpis(payload){
    var metrics=payload.metrics||{};
    var performance=payload.marketPerformance||{};
    var transactionValue=metricValue(metrics.transactionValue);
    if(transactionValue===null){transactionValue=metricValue(performance.ytdTransactionValue);}
    setText('adrec-transaction-value',money(transactionValue));
    setText('adrec-transaction-value-note',metrics.transactionValue?yoy(metrics.transactionValue):'Current year to date market performance');
    setText('adrec-transaction-volume',integer(metricValue(metrics.transactionVolume)));
    setText('adrec-transaction-volume-note',yoy(metrics.transactionVolume));
    setText('adrec-sales-value',money(metricValue(performance.ytdSalesValue)));
    setText('adrec-mortgage-value',money(metricValue(performance.ytdMortgageValue)));
    setText('adrec-fdi-value',money(metricValue(performance.ytdFdiValue)));
    setText('adrec-apartment-sale-index',indexValue(metricValue(metrics.apartmentSaleIndex)));
    setText('adrec-apartment-sale-note',yoy(metrics.apartmentSaleIndex));
    setText('adrec-villa-sale-index',indexValue(metricValue(metrics.villaSaleIndex)));
    setText('adrec-villa-sale-note',yoy(metrics.villaSaleIndex));
    setText('adrec-rented-units',integer(metricValue(metrics.rentedUnits)));
    setText('adrec-rented-units-note',yoy(metrics.rentedUnits));
    var apartmentRent=indexValue(metricValue(metrics.apartmentRentIndex));
    var villaRent=indexValue(metricValue(metrics.villaRentIndex));
    setText('adrec-apartment-rent-index',apartmentRent);
    setText('adrec-apartment-rent-index-copy',apartmentRent);
    setText('adrec-apartment-rent-note',yoy(metrics.apartmentRentIndex));
    setText('adrec-villa-rent-index',villaRent);
    setText('adrec-villa-rent-index-copy',villaRent);
    setText('adrec-villa-rent-note',yoy(metrics.villaRentIndex));
  }

  function composition(payload){
    var holder=byId('adrec-composition');
    if(!holder){return;}
    var performance=payload.marketPerformance||{};
    var values=[
      {label:'Sales',value:metricValue(performance.ytdSalesValue)},
      {label:'Mortgages',value:metricValue(performance.ytdMortgageValue)},
      {label:'Foreign direct investment',value:metricValue(performance.ytdFdiValue)}
    ].filter(function(item){return item.value!==null&&item.value>0;});
    if(!values.length){
      holder.innerHTML='<p class="adrec-empty">The official source did not expose the market-composition values in readable page markup during this check. Use the official dashboard below for the complete live view.</p>';
      return;
    }
    var max=Math.max.apply(null,values.map(function(item){return item.value;}));
    holder.innerHTML=values.map(function(item){
      var width=Math.max(8,Math.round((item.value/max)*100));
      return '<div class="adrec-bar-row"><div><strong>'+item.label+'</strong><span>'+money(item.value)+'</span></div><div class="adrec-bar-track"><span style="width:'+width+'%"></span></div></div>';
    }).join('');
  }

  function coverage(payload){
    var container=byId('adrec-coverage');
    if(!container){return;}
    var source=payload.coverage||defaultCoverage;
    var groups={transactions:'Transactions',residentialSales:'Residential sales',leases:'Residential leases',geography:'Geography',recentSales:'Recent sales filters'};
    container.innerHTML=Object.keys(groups).map(function(key){
      var items=source[key]||[];
      return '<article><p class="section-kicker">'+groups[key]+'</p><div class="adrec-chip-row">'+items.map(function(item){return '<span>'+item+'</span>';}).join('')+'</div></article>';
    }).join('');
  }

  function setPanel(name){
    state.active=name;
    document.querySelectorAll('[data-adrec-tab]').forEach(function(button){
      var active=button.dataset.adrecTab===name;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    document.querySelectorAll('[data-adrec-panel]').forEach(function(panel){panel.hidden=panel.dataset.adrecPanel!==name;});
  }

  function prepareTabs(){
    document.querySelectorAll('[data-adrec-tab]').forEach(function(button){button.addEventListener('click',function(){setPanel(button.dataset.adrecTab);});});
    setPanel('transactions');
  }

  function revealFallback(message){
    var warning=byId('adrec-warning');
    if(warning){warning.hidden=false;setText('adrec-warning-message',message||'Some official figures were not readable during this check. The official ADREC dashboard remains available below.');}
  }

  async function load(force){
    setStatus('loading','Connecting to ADREC');
    setText('adrec-checked','Checking the newest public market data');
    try{
      var url=endpoint+(force?'?refresh='+Date.now():'');
      var response=await fetch(url,{headers:{Accept:'application/json'}});
      var payload=await response.json();
      state.payload=payload;
      coverage(payload);
      if(!response.ok||!payload.ok){throw new Error(payload.error||payload.warning||'The public source did not return readable metrics.');}
      updateKpis(payload);
      composition(payload);
      setStatus('ready','Live source connected');
      setText('adrec-checked',sourceTime(payload.fetchedAt)+' · Source updates daily');
      setText('adrec-source-line','Live fetch from ADREC, cached for performance. '+sourceTime(payload.fetchedAt)+'.');
      if(payload.warning){revealFallback(payload.warning);}
    }catch(error){
      coverage({coverage:defaultCoverage});
      setStatus('error','Official source available');
      setText('adrec-checked','Custom data cards are temporarily unavailable');
      setText('adrec-source-line','Use the official dashboard while the custom source connection refreshes.');
      revealFallback(error&&error.message?error.message:'The live data cards could not be refreshed.');
      composition({marketPerformance:{}});
    }
  }

  function prepareRefresh(){
    var button=byId('adrec-refresh');
    if(!button){return;}
    button.addEventListener('click',function(){button.disabled=true;button.textContent='Refreshing';load(true).finally(function(){button.disabled=false;button.textContent='Refresh data';});});
  }

  function prepareOfficialToggle(){
    var button=byId('adrec-toggle-official');
    var shell=byId('adrec-official-shell');
    var frame=byId('adrec-dashboard-frame');
    if(!button||!shell){return;}
    button.addEventListener('click',function(){
      var open=!shell.hidden;
      shell.hidden=open;
      button.setAttribute('aria-expanded',open?'false':'true');
      button.textContent=open?'Open official dashboard':'Hide official dashboard';
      if(!open&&frame&&!frame.getAttribute('src')){frame.setAttribute('src',frame.dataset.src);}
    });
  }

  function init(){prepareTabs();prepareRefresh();prepareOfficialToggle();coverage({coverage:defaultCoverage});load(false);}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
