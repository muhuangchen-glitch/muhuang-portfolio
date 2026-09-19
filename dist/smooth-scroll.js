(()=>{
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width: 700px)');
 // Minimum scale: smaller values make the focus effect stronger.
 const focusConfig={desktop:{image:.94,text:.90,title:.95},mobile:{image:.97,text:.95,title:.97},range:1};
 const root=document.querySelector('.photo-case');
 const targets=[];
 const visible=new Set();
 function register(selector,type){root?.querySelectorAll(selector).forEach(element=>{element.classList.add('scroll-focus','scroll-focus--'+type);targets.push({element,type,last:null});});}
 register('.photo-case-heading h1, .anniversary-statement','title');
 register('.photo-figure img, .stamp-panel > a > img, .moment-slide > img','image');
 register('.photo-intro, .stamp-panel > div, .case-narrative, .mechanism-logic','text');
 let pending=0;
 function updateFocus(){
  if(preference.matches){targets.forEach(item=>{item.element.style.transform='scale(1)';item.last=1;});return;}
  const viewportCenter=innerHeight/2, ranges=mobile.matches?focusConfig.mobile:focusConfig.desktop;
  // Read all geometry before writing transforms. Center-origin scaling leaves
  // each element's center unchanged, preventing measurement feedback.
  const active=[...visible];
  const values=active.map(item=>{
   const rect=item.element.getBoundingClientRect();
   const distance=Math.abs(rect.top+rect.height/2-viewportCenter);
   let progress=Math.max(0,Math.min(1,1-distance/(viewportCenter*focusConfig.range)));
   progress=progress*progress*(3-2*progress);
   return ranges[item.type]+(1-ranges[item.type])*progress;
  });
  active.forEach((item,i)=>{const value=Number(values[i].toFixed(5));if(value!==item.last){item.element.style.transform='scale('+value+')';item.last=value;}});
 }
 // Only a one-shot frame for resize/load/native fallback; no second RAF loop.
 function schedule(){if(!pending)pending=requestAnimationFrame(()=>{pending=0;updateFocus();});}
 // Measure only elements near the viewport, without changing focus falloff.
 const byElement=new Map(targets.map(item=>[item.element,item]));
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   const item=byElement.get(entry.target);
   if(entry.isIntersecting){visible.add(item);item.element.style.willChange=preference.matches?'auto':'transform';}
   else{visible.delete(item);item.element.style.willChange='auto';const ranges=mobile.matches?focusConfig.mobile:focusConfig.desktop;item.last=preference.matches?1:ranges[item.type];item.element.style.transform='scale('+item.last+')';}
  });
  schedule();
 },{rootMargin:'200px 0px'});
 targets.forEach(item=>observer.observe(item.element));
 function setup(){
  if(window.portfolioScroll){window.portfolioScroll.destroy();window.portfolioScroll=null;}
  if(!preference.matches&&window.Lenis){
   window.portfolioScroll=new Lenis({autoRaf:true,lerp:.085,smoothWheel:true,syncTouch:false,anchors:{offset:-88},prevent:node=>node.classList?.contains('moment-track')&&!node.closest('.is-pinned')});
   window.portfolioScroll.on('scroll',schedule);
  }
  updateFocus();
 }
 window.addEventListener('scroll',()=>{if(!window.portfolioScroll)schedule();},{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('load',schedule,{once:true});
 if(root){new ResizeObserver(schedule).observe(root);root.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',schedule,{once:true});});}
 mobile.addEventListener('change',schedule);preference.addEventListener('change',setup);setup();
})();
