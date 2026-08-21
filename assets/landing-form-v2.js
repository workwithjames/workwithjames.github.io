(()=>{
  'use strict';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

  /* Load the shared James Realty/Tasmeer design layer after every developer- or
     country-specific stylesheet so the final typography, theme and glow stay consistent. */
  if(!document.querySelector('link[data-site-system-final]')){
    const system=document.createElement('link');
    system.rel='stylesheet';
    system.href='/assets/site-system.css?v=2';
    system.setAttribute('data-site-system-final','');
    document.head.appendChild(system);
  }

  const isArabic=document.documentElement.dir==='rtl'||document.documentElement.lang.startsWith('ar');
  const copy=isArabic?{
    eyebrow:'طلب خاص',duration:'حوالي دقيقة واحدة',micro:'أدخل المعلومات الأساسية أولاً. يمكنك إضافة التفاصيل الأخرى إذا رغبت.',interest:'الاهتمام الحالي',privacy:'يتم حفظ طلبك أولاً، ثم يمكنك المتابعة على واتساب.',name:'الاسم الكامل',phone:'+971 50 123 4567',email:'name@example.com',notes:'الهدف، المنطقة أو الجدول الزمني الذي تفضله'
  }:{
    eyebrow:'Private enquiry',duration:'About 1 minute',micro:'Start with the essentials. Add property details only if they help refine your shortlist.',interest:'Current interest',privacy:'Your request is saved first, then you can continue on WhatsApp.',name:'Full name',phone:'+971 50 123 4567',email:'name@example.com',notes:'Goal, preferred area or timeline'
  };

  qsa('[data-lead-capture]').forEach(form=>{
    if(form.dataset.formOptimized==='v2') return;
    form.dataset.formOptimized='v2';
    form.classList.add('jr-form--optimized');

    const intro=document.createElement('div');
    intro.className='jr-form__introbar';
    intro.innerHTML=`<span class="jr-form__eyebrow">${copy.eyebrow}</span><span class="jr-form__duration">${copy.duration}</span>`;
    const micro=document.createElement('p');
    micro.className='jr-form__microcopy';
    micro.textContent=copy.micro;
    const interest=document.createElement('div');
    interest.className='jr-form__interest';
    interest.hidden=true;
    interest.innerHTML=`<span>${copy.interest}</span><strong data-form-interest></strong>`;
    form.prepend(interest);
    form.prepend(micro);
    form.prepend(intro);

    const submitWrap=qs('button[type="submit"]',form)?.parentElement;
    if(submitWrap){
      const note=document.createElement('p');
      note.className='jr-form__privacy-note';
      note.textContent=copy.privacy;
      submitWrap.insertAdjacentElement('afterend',note);
    }

    const placeholders={name:copy.name,phone:copy.phone,email:copy.email,notes:copy.notes};
    Object.entries(placeholders).forEach(([name,value])=>{
      const field=form.elements[name];
      if(field && !field.placeholder) field.placeholder=value;
    });
    if(form.elements.name) form.elements.name.setAttribute('enterkeyhint','next');
    if(form.elements.phone) form.elements.phone.setAttribute('enterkeyhint','next');
    if(form.elements.email){form.elements.email.setAttribute('inputmode','email');form.elements.email.spellcheck=false;}

    const validateField=field=>{
      if(!field.matches('input,select,textarea')||field.classList.contains('jr-honeypot')) return;
      if(field.checkValidity()) field.removeAttribute('aria-invalid');
      else field.setAttribute('aria-invalid','true');
    };
    qsa('input,select,textarea',form).forEach(field=>{
      field.addEventListener('invalid',()=>field.setAttribute('aria-invalid','true'));
      field.addEventListener('input',()=>validateField(field),{passive:true});
      field.addEventListener('change',()=>validateField(field),{passive:true});
    });

    const submit=qs('button[type="submit"]',form);
    const success=qs('[data-lead-success]',form);
    if(submit){
      const observer=new MutationObserver(()=>{
        const busy=submit.disabled&&!submit.hidden;
        form.classList.toggle('is-submitting',busy);
        if(busy) form.setAttribute('aria-busy','true'); else form.removeAttribute('aria-busy');
        if(success && !success.hidden){
          success.setAttribute('tabindex','-1');
          success.focus({preventScroll:true});
        }
      });
      observer.observe(submit,{attributes:true,attributeFilter:['disabled','hidden']});
      if(success) observer.observe(success,{attributes:true,attributeFilter:['hidden']});
    }
  });

  qsa('[data-project-select]').forEach(link=>link.addEventListener('click',()=>{
    const project=String(link.dataset.projectSelect||'').trim();
    if(!project) return;
    const form=qs('[data-lead-capture]');
    const box=qs('.jr-form__interest',form);
    const value=qs('[data-form-interest]',box);
    if(box&&value){value.textContent=project;box.hidden=false;}
  }));

  const form=qs('[data-lead-capture]');
  const initialInterest=String(form?.elements?.interest?.value||'').trim();
  if(initialInterest){
    const box=qs('.jr-form__interest',form),value=qs('[data-form-interest]',box);
    if(box&&value){value.textContent=initialInterest;box.hidden=false;}
  }
})();
