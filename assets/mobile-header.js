(function(){
  function init(){
    var header=document.querySelector('.site-header .nav-shell');
    var menu=document.getElementById('mobile-site-menu')||document.querySelector('.mobile-page-tabs');
    if(!header||!menu){return;}

    menu.id='mobile-site-menu';
    menu.classList.add('mobile-site-menu');
    menu.setAttribute('aria-hidden','true');

    var toggle=header.querySelector('.mobile-menu-toggle');
    if(!toggle){
      toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='mobile-menu-toggle';
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-controls','mobile-site-menu');
      toggle.setAttribute('aria-label','Open site menu');
      toggle.innerHTML='<span class="mobile-menu-label">Menu</span><span class="mobile-menu-icon" aria-hidden="true"><span></span><span></span></span>';
      var cta=header.querySelector('.nav-cta');
      header.insertBefore(toggle,cta||null);
    }

    var label=toggle.querySelector('.mobile-menu-label');
    function isOpen(){return menu.classList.contains('is-open');}

    function focusableItems(){
      return Array.prototype.slice.call(menu.querySelectorAll('a[href],summary,button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function(item){
        return item.getClientRects().length>0;
      });
    }

    function focusMenu(){
      var preferred=menu.querySelector('a[aria-current="page"]')||menu.querySelector('.goal-nav.is-current>summary');
      var items=focusableItems();
      var target=preferred||items[0];
      if(target){target.focus({preventScroll:true});}
    }

    function setOpen(open,restoreFocus){
      menu.classList.toggle('is-open',open);
      document.body.classList.toggle('mobile-menu-open',open);
      toggle.setAttribute('aria-expanded',open?'true':'false');
      toggle.setAttribute('aria-label',open?'Close site menu':'Open site menu');
      menu.setAttribute('aria-hidden',open?'false':'true');
      if(label){label.textContent=open?'Close':'Menu';}

      if(open){
        window.setTimeout(focusMenu,90);
      }else{
        menu.querySelectorAll('.goal-nav[open]').forEach(function(goal){goal.open=false;});
        if(restoreFocus){toggle.focus({preventScroll:true});}
      }
    }

    toggle.addEventListener('click',function(event){
      event.stopPropagation();
      setOpen(!isOpen(),false);
      if(isOpen()&&typeof window.gtag==='function'){
        window.gtag('event','navigation_menu_open',{menu_name:'Compact site menu',page_path:location.pathname});
      }
    });

    menu.addEventListener('click',function(event){
      var link=event.target.closest('a');
      if(link){setOpen(false,false);}
    });

    document.addEventListener('click',function(event){
      if(!isOpen()){return;}
      if(menu.contains(event.target)||toggle.contains(event.target)){return;}
      setOpen(false,false);
    });

    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&isOpen()){
        event.preventDefault();
        setOpen(false,true);
        return;
      }

      if(event.key!=='Tab'||!isOpen()){return;}
      var items=[toggle].concat(focusableItems());
      if(!items.length){return;}
      var first=items[0];
      var last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });

    var desktop=window.matchMedia('(min-width:1081px)');
    function handleBreakpoint(event){if(event.matches){setOpen(false,false);}}
    if(typeof desktop.addEventListener==='function'){desktop.addEventListener('change',handleBreakpoint);}
    else if(typeof desktop.addListener==='function'){desktop.addListener(handleBreakpoint);}
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();
