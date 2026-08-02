(function(){
  function number(card,name){
    var field=card.querySelector('[data-field="'+name+'"]');
    return Math.max(0,Number(field&&field.value)||0);
  }
  function calculate(card){
    var price=number(card,'price');
    var rent=number(card,'rent');
    var buyingCosts=number(card,'buying-costs');
    var service=number(card,'service');
    var maintenance=number(card,'maintenance');
    var managementRate=Math.min(100,number(card,'management'))/100;
    var vacancyRate=Math.min(100,number(card,'vacancy'))/100;
    var effectiveRent=rent*(1-vacancyRate);
    var management=effectiveRent*managementRate;
    var operatingCosts=service+maintenance+management;
    var netIncome=effectiveRent-operatingCosts;
    var allInCost=price+buyingCosts;
    return {
      grossYield:price?rent/price*100:0,
      netYield:price?netIncome/price*100:0,
      allInYield:allInCost?netIncome/allInCost*100:0,
      netIncome:netIncome,
      monthlyIncome:netIncome/12,
      annualCosts:rent-effectiveRent+operatingCosts,
      expenseRatio:rent?(rent-netIncome)/rent*100:0
    };
  }
  function percent(value){return (Number.isFinite(value)?value:0).toFixed(2)+'%';}
  function money(value){return new Intl.NumberFormat('en-AE',{style:'currency',currency:'AED',maximumFractionDigits:0}).format(Number.isFinite(value)?value:0);}
  function set(id,value){var output=document.getElementById(id);if(output){output.textContent=value;}}
  function render(){
    var first=calculate(document.querySelector('[data-scenario="a"]'));
    var second=calculate(document.querySelector('[data-scenario="b"]'));
    [['gross','grossYield',percent],['net','netYield',percent],['all-in','allInYield',percent],['net-income','netIncome',money],['monthly','monthlyIncome',money],['annual-costs','annualCosts',money],['expense-ratio','expenseRatio',percent]].forEach(function(item){
      set(item[0]+'-a',item[2](first[item[1]]));
      set(item[0]+'-b',item[2](second[item[1]]));
    });
    var message='Enter two scenarios to compare their net yield on total cost.';
    if(first.allInYield||second.allInYield){
      var difference=Math.abs(first.allInYield-second.allInYield);
      if(difference<0.01){message='Both scenarios currently produce the same net yield on total cost.';}
      else{message='Scenario '+(first.allInYield>second.allInYield?'A':'B')+' has the higher net yield on total cost by '+difference.toFixed(2)+' percentage points.';}
    }
    set('yield-comparison-message',message);
  }
  function track(){
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push({event:'rental_yield_calculator_use',page_path:location.pathname});
  }
  function boot(){
    var workspace=document.getElementById('yield-calculator');
    if(!workspace){return;}
    workspace.querySelectorAll('input').forEach(function(input){input.addEventListener('input',render);});
    var button=document.getElementById('recalculate-yields');
    if(button){button.addEventListener('click',function(){render();track();});}
    render();
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();
