document.querySelectorAll('.moments-carousel').forEach(gallery=>{
 const track=gallery.querySelector('.moment-track'),slides=[...gallery.querySelectorAll('.moment-slide')],thumbs=[...gallery.querySelectorAll('.moment-thumb')];
 const prev=gallery.querySelector('.moment-prev'),next=gallery.querySelector('.moment-next'),count=gallery.querySelector('.moment-count');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),desktop=matchMedia('(min-width: 900px) and (min-height: 650px) and (pointer: fine)');
 const shell=document.createElement('div');shell.className='moment-scroll-shell';gallery.before(shell);shell.append(gallery);
 const progress=document.createElement('div');progress.className='moment-progress';progress.innerHTML='<span></span>';gallery.append(progress);
 let pinned=false,index=0,requested=0,desired=0,actual=0,raf=0,start=0,distance=1,max=1,drag=false,origin=0,initial=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const pos=i=>slides[i].offsetLeft-slides[0].offsetLeft;
 function paint(){const fraction=max?track.scrollLeft/max:0;index=Math.round(fraction*(slides.length-1));thumbs.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));count.textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');prev.disabled=index===0;next.disabled=index===slides.length-1;progress.firstElementChild.style.transform='scaleX('+fraction+')';}
 function tick(){raf=0;if(!pinned)return;actual=window.portfolioScroll?desired:actual+(desired-actual)*.12;if(Math.abs(desired-actual)<.3)actual=desired;track.scrollLeft=actual;paint();if(actual!==desired)raf=requestAnimationFrame(tick);}
 function onScroll(){if(!pinned)return;desired=clamp((window.scrollY-start)/distance,0,1)*max;requested=Math.round(desired/max*(slides.length-1));if(!raf)raf=requestAnimationFrame(tick);}
 function measure(){pinned=desktop.matches&&!reduced.matches;shell.classList.toggle('is-pinned',pinned);max=track.scrollWidth-track.clientWidth;distance=Math.max(1,innerHeight*2.4);shell.style.height=pinned?(gallery.offsetHeight+distance)+'px':'';start=shell.getBoundingClientRect().top+scrollY-88;if(pinned){actual=track.scrollLeft;onScroll();}else{cancelAnimationFrame(raf);raf=0;}paint();}
 function go(i){requested=clamp(i,0,slides.length-1);if(pinned){const y=start+distance*requested/(slides.length-1);if(window.portfolioScroll)window.portfolioScroll.scrollTo(y,{duration:.9,lerp:0});else window.scrollTo({top:y,behavior:'smooth'});}else track.scrollTo({left:pos(requested),behavior:reduced.matches?'instant':'smooth'});}
 prev.addEventListener('click',()=>go(requested-1));next.addEventListener('click',()=>go(requested+1));thumbs.forEach((b,i)=>b.addEventListener('click',()=>go(i)));
 track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();go(e.key==='Home'?0:e.key==='End'?slides.length-1:requested+(e.key==='ArrowRight'?1:-1));}});
 track.addEventListener('scroll',()=>{if(!pinned)paint();},{passive:true});track.addEventListener('scrollend',()=>{if(!pinned)requested=index;});
 track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag=true;origin=e.clientX;initial=pinned?desired:track.scrollLeft;track.classList.add('dragging');track.setPointerCapture(e.pointerId);});
 track.addEventListener('pointermove',e=>{if(!drag)return;const x=clamp(initial+origin-e.clientX,0,max);if(pinned){const y=start+distance*x/max;if(window.portfolioScroll)window.portfolioScroll.scrollTo(y,{immediate:true});else window.scrollTo({top:y,behavior:'instant'});}else track.scrollLeft=x;});
 function release(){if(!drag)return;drag=false;track.classList.remove('dragging');go(Math.round((pinned?desired:track.scrollLeft)/max*(slides.length-1)));}
 track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
 window.addEventListener('scroll',onScroll,{passive:true});let resize;window.addEventListener('resize',()=>{clearTimeout(resize);resize=setTimeout(measure,150);});desktop.addEventListener('change',measure);reduced.addEventListener('change',measure);window.addEventListener('load',measure);measure();
});
