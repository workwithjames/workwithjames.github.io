(function(){
  const menuButton=document.querySelector('.menu-button');
  const mobileNav=document.getElementById('mobile-nav');
  if(menuButton&&mobileNav){
    menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));mobileNav.hidden=open;});
    mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');}));
  }

  const packageInput=document.getElementById('package');
  document.querySelectorAll('[data-package]').forEach(link=>link.addEventListener('click',()=>{if(packageInput)packageInput.value=link.dataset.package||'';}));

  const form=document.getElementById('quote-form');
  if(form){form.addEventListener('submit',function(e){e.preventDefault();
    const name=document.getElementById('name').value.trim();
    const business=document.getElementById('business').value.trim();
    const service=document.getElementById('service').value;
    const budget=document.getElementById('budget').value;
    const selectedPackage=document.getElementById('package').value.trim();
    const details=document.getElementById('details').value.trim();
    const lines=[
      'Hi James, I would like to discuss digital services.',
      '',
      `Name: ${name}`,
      business?`Business / brand: ${business}`:'',
      `Service: ${service}`,
      `Budget: ${budget}`,
      selectedPackage?`Package / project: ${selectedPackage}`:'',
      '',
      'Goal / details:',
      details
    ].filter(Boolean);
    const url='https://wa.me/971528420933?text='+encodeURIComponent(lines.join('\n'));
    window.open(url,'_blank','noopener');
    if(window.dataLayer){window.dataLayer.push({event:'digital_quote_whatsapp',service:service,package:selectedPackage||'custom'});}
  });}

  const year=document.getElementById('year'); if(year)year.textContent=new Date().getFullYear();
})();
