(function(){
  function number(value){return Number(value)||0;}
  function money(value){return new Intl.NumberFormat('en-AE',{style:'currency',currency:'AED',maximumFractionDigits:0}).format(Math.max(0,number(value)));}
  function track(name,data){
    data=data||{};
    data.page_path=location.pathname;
    if(typeof window.gtag==='function'){window.gtag('event',name,data);return;}
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(Object.assign({event:name},data));
  }
  function init(){
    var form=document.getElementById('buying-cost-calculator');
    if(!form){return;}
    var output=document.getElementById('calculator-breakdown');
    var totalCosts=document.getElementById('calculator-total-costs');
    var upfront=document.getElementById('calculator-upfront-cash');
    var ratio=document.getElementById('calculator-cost-ratio');
    var status=document.getElementById('calculator-status');
    var mortgageFields=Array.prototype.slice.call(form.querySelectorAll('[data-mortgage-field]'));
    var touched=false;

    function value(name){return number(form.elements[name]&&form.elements[name].value);}
    function mortgageEnabled(){return form.elements.mortgage.value==='yes';}
    function calculate(source){
      var price=Math.max(0,value('price'));
      var dld=price*value('dld_share')/100;
      var trustee=price>=500000?4200:2100;
      var titleAndMap=value('title_map');
      var agency=price*value('agency')/100;
      var agencyVat=agency*.05;
      var mortgage=mortgageEnabled();
      var downPaymentPct=mortgage?value('down_payment'):100;
      var loan=mortgage?price*Math.max(0,100-downPaymentPct)/100:0;
      var mortgageRegistration=loan*.0025;
      var bankFee=loan*value('bank_fee')/100;
      var bankFeeVat=bankFee*.05;
      var valuation=mortgage?value('valuation'):0;
      var additional=value('additional');
      var costs=dld+trustee+titleAndMap+agency+agencyVat+mortgageRegistration+bankFee+bankFeeVat+valuation+additional;
      var cashContribution=price-loan;
      var cashNeeded=cashContribution+costs;
      var rows=[
        ['DLD registration assumption',dld],
        ['Registration trustee fee incl. VAT',trustee],
        ['Title deed, unit map and government fees',titleAndMap],
        ['Agency fee estimate',agency],
        ['VAT on agency fee',agencyVat]
      ];
      if(mortgage){
        rows.push(['Mortgage registration, 0.25% of loan',mortgageRegistration]);
        rows.push(['Bank arrangement fee estimate',bankFee]);
        rows.push(['VAT on bank arrangement fee',bankFeeVat]);
        rows.push(['Valuation estimate',valuation]);
      }
      if(additional){rows.push(['Other buyer-entered costs',additional]);}
      rows.push(['Estimated acquisition costs',costs,'calculator-total']);
      output.innerHTML=rows.map(function(row){return '<div'+(row[2]?' class="'+row[2]+'"':'')+'><dt>'+row[0]+'</dt><dd>'+money(row[1])+'</dd></div>';}).join('');
      totalCosts.textContent=money(costs);
      upfront.textContent=money(cashNeeded);
      ratio.textContent=price?((costs/price)*100).toFixed(2)+'% of the property price':'0.00% of the property price';
      mortgageFields.forEach(function(field){field.hidden=!mortgage;field.querySelectorAll('input,select').forEach(function(input){input.disabled=!mortgage;});});
      if(source&&touched){track('buying_cost_calculator_use',{calculation_source:source,property_status:form.elements.property_status.value,finance_route:mortgage?'mortgage':'cash'});}
    }
    form.addEventListener('input',function(){if(!touched){touched=true;track('calculator_start',{calculator_name:'Dubai property buying cost'});}calculate('input');});
    form.addEventListener('change',function(){calculate('change');});
    document.getElementById('recalculate-buying-costs').addEventListener('click',function(){touched=true;calculate('button');track('calculator_complete',{calculator_name:'Dubai property buying cost',property_status:form.elements.property_status.value,finance_route:mortgageEnabled()?'mortgage':'cash'});status.textContent='Estimate refreshed using the current assumptions.';});
    document.getElementById('copy-buying-costs').addEventListener('click',async function(){
      var summary='Dubai property buying-cost estimate\nProperty price: '+money(value('price'))+'\nEstimated acquisition costs: '+totalCosts.textContent+'\nEstimated cash needed at purchase: '+upfront.textContent+'\nSource: jamesrealty.uk/dubai-property-buying-cost-calculator/';
      try{await navigator.clipboard.writeText(summary);status.textContent='Estimate copied.';track('calculator_action',{calculator_name:'Dubai property buying cost',action:'copy_estimate'});}catch(error){status.textContent='Copy was not available. You can take a screenshot of the result.';}
    });
    calculate();
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
