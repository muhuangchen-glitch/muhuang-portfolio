(()=>{
 const footer=document.querySelector('.editorial-footer');
 if(!footer)return;
 const toggle=footer.querySelector('.footer-disclosure');
 const content=footer.querySelector('.footer-about-content');
 toggle.addEventListener('click',()=>{
  const expanded=toggle.getAttribute('aria-expanded')!=='true';
  toggle.setAttribute('aria-expanded',String(expanded));
  content.inert=!expanded;
  content.setAttribute('aria-hidden',String(!expanded));
  footer.querySelector('.footer-toggle-symbol').textContent=expanded?'×':'＋';
 });
 footer.querySelector('.footer-back-top').addEventListener('click',()=>{
  if(window.portfolioScroll)window.portfolioScroll.scrollTo(0);
  else window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
})();
