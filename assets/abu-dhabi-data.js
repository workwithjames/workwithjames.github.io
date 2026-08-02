(function(){
  var endpoint='/api/abu-dhabi-data';
  var state={payload:null,rows:[],filters:{search:'',type:'all',sale:'all'}};

  function byId(id){return document.getElementById(id);}
  function setText(id,value){var node=byId(id);if(node)node.textContent=value;}
  function value(metric){return metric&&Number.isFinite(metric.value)?metric.value:null;}
  function compact(n){return n===null?'Not available':new Intl.NumberFormat('en-AE',{notation:'compact',maximumFractionDigits:2}).format(n);}
  function money(n){return n===null?'Not available':'AED '+compact(n);}
  function integer(n){return n===null?'Not available':new Intl.NumberFormat('en-AE',{maximumFractionDigits:0}).format(n);}
  function index(n){return n===null?'Not available':new Intl.NumberFormat('en-AE',{maximumFractionDigits:2}).format(n);}
  function yoy(metric){
    return metric&&Number.isFinite(metric.yoy)?((metric.yoy>0?'+':'')+metric.yoy.toFixed(2).replace(/\.00$/,'')+'% YoY'):'Current official reading';
  }
  function setStatus(mode,text){var node=byId('adrec-live-status');if(node){node.dataset.state=mode;node.textContent=text;}}
  function checked(value){
    var date=new Date(value);
    return Number.isNaN(date.getTime())?'Checked now':'Checked '+new Intl.DateTimeFormat('en-AE',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dubai'}).format(date);
  }
  function relabel(id,label){var node=byId(id);var card=node&&node.closest('.adrec-kpi');var title=card&&card.querySelector('span');if(title)title.textContent=label;}

  function updateCards(payload){
    var m=payload.metrics||{};
    setText('adrec-transaction-value',money(value(m.transactionValue)));
    setText('adrec-transaction-value-note','Last 12 months · '+yoy(m.transactionValue));
    setText('adrec-transaction-volume',integer(value(m.transactionVolume)));
    setText('adrec-transaction-volume-note','Last 12 months · '+yoy(m.transactionVolume));

    relabel('adrec-sales-value','Apartment sale index');
    setText('adrec-sales-value',index(value(m.apartmentSaleIndex)));
    relabel('adrec-mortgage-value','Villa sale index');
    setText('adrec-mortgage-value',index(value(m.villaSaleIndex)));
    relabel('adrec-fdi-value','Recent sales loaded');
    setText('adrec-fdi-value',integer(payload.recentSales&&payload.recentSales.rows?payload.recentSales.rows.length:0));

    setText('adrec-apartment-sale-index',index(value(m.apartmentSaleIndex)));
    setText('adrec-apartment-sale-note',yoy(m.apartmentSaleIndex));
    setText('adrec-villa-sale-index',index(value(m.villaSaleIndex)));
    setText('adrec-villa-sale-note',yoy(m.villaSaleIndex));
    setText('adrec-rented-units',integer(value(m.rentedUnits)));
    setText('adrec-rented-units-note',yoy(m.rentedUnits));
    setText('adrec-apartment-rent-index',index(value(m.apartmentRentIndex)));
    setText('adrec-apartment-rent-index-copy',index(value(m.apartmentRentIndex)));
    setText('adrec-apartment-rent-note',yoy(m.apartmentRentIndex));
    setText('adrec-villa-rent-index',index(value(m.villaRentIndex)));
    setText('adrec-villa-rent-index-copy',index(value(m.villaRentIndex)));
    setText('adrec-villa-rent-note',yoy(m.villaRentIndex));
  }

  function projectSummary(rows){
    var holder=byId('adrec-composition');if(!holder)return;
    var groups={};
    rows.forEach(function(row){
      var key=row.project||row.community||row.district||'Not stated';
      if(!groups[key])groups[key]={count:0,value:0};
      groups[key].count+=1;groups[key].value+=Number(row.priceAed)||0;
    });
    var top=Object.keys(groups).map(function(key){return {name:key,count:groups[key].count,value:groups[key].value};})
      .sort(function(a,b){return b.value-a.value;}).slice(0,6);
    if(!top.length){holder.innerHTML='<p class="adrec-empty">No recent sales rows were returned by ADREC during this check.</p>';return;}
    var max=Math.max.apply(null,top.map(function(x){return x.value||x.count;}));
    holder.innerHTML=top.map(function(item){
      var width=Math.max(7,Math.round(((item.value||item.count)/max)*100));
      return '<div class="adrec-bar-row"><div><strong>'+escapeHtml(item.name)+'</strong><span>'+item.count+' sales · '+money(item.value)+'</span></div><div class="adrec-bar-track"><span style="width:'+width+'%"></span></div></div>';
    }).join('');
  }

  function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function unique(rows,key){return Array.from(new Set(rows.map(function(r){return r[key];}).filter(Boolean))).sort();}
  function options(items,label){return '<option value="all">'+label+'</option>'+items.map(function(x){return '<option value="'+escapeHtml(x)+'">'+escapeHtml(x)+'</option>';}).join('');}

  function renderExplorer(payload){
    var container=byId('adrec-coverage');if(!container)return;
    state.rows=(payload.recentSales&&payload.recentSales.rows)||[];
    container.innerHTML='<article class="adrec-sales-explorer"><div class="adrec-explorer-head"><div><p class="section-kicker">Recent registered sales</p><h3>Filter the latest public ADREC records</h3></div><span id="adrec-result-count"></span></div><div class="adrec-filter-grid"><label>Search<input id="adrec-search" type="search" placeholder="Project, community or district"></label><label>Property type<select id="adrec-type">'+options(unique(state.rows,'propertyType'),'All property types')+'</select></label><label>Sale type<select id="adrec-sale">'+options(unique(state.rows,'saleType'),'All sale types')+'</select></label></div><div class="adrec-table-wrap"><table class="adrec-sales-table"><thead><tr><th>Registration</th><th>Property</th><th>Location</th><th>Layout</th><th>Area</th><th>Price</th><th>Rate</th></tr></thead><tbody id="adrec-sales-body"></tbody></table></div><p class="adrec-table-note">Showing up to 100 recent records returned by the official public endpoint. Dates and classifications follow ADREC.</p></article>';
    byId('adrec-search').addEventListener('input',function(e){state.filters.search=e.target.value.toLowerCase();renderRows();});
    byId('adrec-type').addEventListener('change',function(e){state.filters.type=e.target.value;renderRows();});
    byId('adrec-sale').addEventListener('change',function(e){state.filters.sale=e.target.value;renderRows();});
    renderRows();
  }

  function renderRows(){
    var search=state.filters.search;
    var rows=state.rows.filter(function(row){
      var hay=[row.project,row.community,row.district,row.propertyType,row.assetClass].join(' ').toLowerCase();
      return (!search||hay.indexOf(search)>=0)&&(state.filters.type==='all'||row.propertyType===state.filters.type)&&(state.filters.sale==='all'||row.saleType===state.filters.sale);
    });
    setText('adrec-result-count',rows.length+' records');
    var body=byId('adrec-sales-body');if(!body)return;
    body.innerHTML=rows.slice(0,100).map(function(row){
      var location=[row.project,row.community,row.district].filter(Boolean).join(', ')||'Not stated';
      var area=Number.isFinite(row.soldAreaSqm)?new Intl.NumberFormat('en-AE',{maximumFractionDigits:1}).format(row.soldAreaSqm)+' sqm':'Not stated';
      var rate=Number.isFinite(row.rateAedSqm)?money(row.rateAedSqm)+'/sqm':'Not stated';
      var date=row.registration?new Date(row.registration):null;
      var dateText=date&&!Number.isNaN(date.getTime())?new Intl.DateTimeFormat('en-AE',{dateStyle:'medium'}).format(date):String(row.registration||'Not stated');
      return '<tr><td>'+escapeHtml(dateText)+'</td><td><strong>'+escapeHtml(row.propertyType||row.assetClass||'Not stated')+'</strong><small>'+escapeHtml(row.saleType||'')+'</small></td><td>'+escapeHtml(location)+'</td><td>'+escapeHtml(row.layout||'Not stated')+'</td><td>'+escapeHtml(area)+'</td><td>'+escapeHtml(money(row.priceAed))+'</td><td>'+escapeHtml(rate)+'</td></tr>';
    }).join('')||'<tr><td colspan="7">No records match the selected filters.</td></tr>';
  }

  function setPanel(name){
    document.querySelectorAll('[data-adrec-tab]').forEach(function(button){var active=button.dataset.adrecTab===name;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',active?'true':'false');});
    document.querySelectorAll('[data-adrec-panel]').forEach(function(panel){panel.hidden=panel.dataset.adrecPanel!==name;});
  }
  function prepareTabs(){document.querySelectorAll('[data-adrec-tab]').forEach(function(button){button.addEventListener('click',function(){setPanel(button.dataset.adrecTab);});});setPanel('transactions');}
  function reveal(message){var box=byId('adrec-warning');if(box){box.hidden=false;setText('adrec-warning-message',message);}}

  async function load(force){
    setStatus('loading','Connecting to ADREC');setText('adrec-checked','Fetching official JSON data');
    try{
      var response=await fetch(endpoint+(force?'?refresh='+Date.now():''),{headers:{Accept:'application/json'}});
      var payload=await response.json();
      if(!response.ok||!payload.ok)throw new Error(payload.error||payload.detail||'ADREC data unavailable');
      state.payload=payload;updateCards(payload);projectSummary((payload.recentSales&&payload.recentSales.rows)||[]);renderExplorer(payload);
      setStatus('ready','Live source connected');
      setText('adrec-checked',checked(payload.fetchedAt)+' · Direct public JSON');
      setText('adrec-source-line','Direct ADREC JSON endpoints, cached for one hour. '+checked(payload.fetchedAt)+'.');
      if(payload.partialErrors&&Object.keys(payload.partialErrors).length)reveal('Headline data is live. Some optional chart endpoints were unavailable during this refresh.');
    }catch(error){
      setStatus('error','Official source available');setText('adrec-checked','Direct data connection needs another refresh');
      reveal(error.message||'The official data could not be retrieved.');
    }
  }

  function init(){
    prepareTabs();
    var refresh=byId('adrec-refresh');if(refresh)refresh.addEventListener('click',function(){refresh.disabled=true;refresh.textContent='Refreshing';load(true).finally(function(){refresh.disabled=false;refresh.textContent='Refresh data';});});
    var toggle=byId('adrec-toggle-official'),shell=byId('adrec-official-shell'),frame=byId('adrec-dashboard-frame');
    if(toggle&&shell)toggle.addEventListener('click',function(){var open=!shell.hidden;shell.hidden=open;toggle.textContent=open?'Open official dashboard':'Hide official dashboard';toggle.setAttribute('aria-expanded',open?'false':'true');if(!open&&frame&&!frame.src)frame.src=frame.dataset.src;});
    load(false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
