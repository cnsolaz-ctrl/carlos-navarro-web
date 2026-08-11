// ============ LOGO COLOR SWITCH (black on light sections, white on dark) ============
const railBrand = document.querySelector('.rail-brand');
const topSections = Array.from(document.querySelectorAll('body > section'));

function updateLogoColor(){
  if(!railBrand || topSections.length === 0) return;
  const probeY = window.scrollY + 40; // roughly the vertical center of the fixed top rail
  let current = topSections[0];
  topSections.forEach(sec => {
    if(sec.offsetParent !== null && sec.offsetTop <= probeY) current = sec;
  });
  const isDark = current.classList.contains('section--dark');
  railBrand.classList.toggle('on-dark', isDark);
}
window.addEventListener('scroll', updateLogoColor, {passive:true});
window.addEventListener('resize', updateLogoColor);

// ============ GATED SECTIONS: recruiter vs. personal route ============
const GATED_IDS = ['about','experience','projects','how-i-work','skills','certifications','cv','contact'];
const RECRUITER_IDS = ['experience','projects','skills','certifications','cv','contact'];
const PERSONAL_IDS = ['about','experience','projects','how-i-work','contact'];

function revealIds(ids){
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.add('is-visible');
    el.querySelectorAll('.reveal').forEach(r => r.classList.add('in'));
  });
  if(typeof updateLogoColor === 'function') updateLogoColor();
}
function hideIds(ids){
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.remove('is-visible');
  });
  if(typeof updateLogoColor === 'function') updateLogoColor();
}
function showCta(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('show');
  el.querySelectorAll('.reveal').forEach(r => r.classList.add('in'));
}
function hideCta(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('show');
}
function goTo(id){
  const el = document.getElementById(id);
  if(el) requestAnimationFrame(() => el.scrollIntoView({behavior:'smooth'}));
}

function goRecruiterRoute(){
  revealIds(RECRUITER_IDS);
  hideIds(['about','how-i-work']);
  showCta('cta-a'); hideCta('cta-b');
  goTo('experience');
}
function goPersonalRoute(){
  revealIds(PERSONAL_IDS);
  hideIds(['skills','certifications','cv']);
  showCta('cta-b'); hideCta('cta-a');
  goTo('about');
}
function expandAllSections(){
  revealIds(GATED_IDS);
  hideCta('cta-a'); hideCta('cta-b');
}

const routeRecruiterLink = document.getElementById('routeRecruiter');
const routePersonalLink = document.getElementById('routePersonal');
if(routeRecruiterLink) routeRecruiterLink.addEventListener('click', (e) => {
  e.preventDefault(); e.stopPropagation();
  goRecruiterRoute();
});
if(routePersonalLink) routePersonalLink.addEventListener('click', (e) => {
  e.preventDefault(); e.stopPropagation();
  goPersonalRoute();
});

const ctaABtn = document.getElementById('ctaABtn');
const ctaBBtn = document.getElementById('ctaBBtn');
if(ctaABtn) ctaABtn.addEventListener('click', () => { revealIds(['about','how-i-work']); hideCta('cta-a'); goTo('about'); });
if(ctaBBtn) ctaBBtn.addEventListener('click', () => { revealIds(['skills','certifications','cv']); hideCta('cta-b'); goTo('skills'); });

// any other in-page link (nav rail, menu, hero CTAs, contact links) that points to a
// still-hidden gated section: reveal everything first, then let the smooth scroll happen
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if(!link) return;
  const id = link.getAttribute('href').slice(1);
  if(id === 'home') return; // hero/home is always public
  const target = document.getElementById(id);
  if(!target) return;
  const gatedAncestor = target.closest('.gated');
  if(gatedAncestor && !gatedAncestor.classList.contains('is-visible')){
    e.preventDefault();
    expandAllSections();
    if(typeof menuOverlay !== 'undefined') menuOverlay.classList.remove('open');
    goTo(id);
  }
});

// ============ LANGUAGE TOGGLE ============
const langBtns = document.querySelectorAll('.lang-btn');
const body = document.body;

function setLang(lang){
  body.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang);
  langBtns.forEach(b => b.classList.toggle('active', b.dataset.setLang === lang));
  localStorage.setItem('cn-lang', lang); // note: falls back gracefully if unavailable
}

langBtns.forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.setLang));
});

// restore saved language preference if present
try{
  const saved = localStorage.getItem('cn-lang');
  if(saved) setLang(saved);
}catch(e){ /* storage unavailable, default (es) stands */ }

// ============ FULLSCREEN MENU ============
const menuOverlay = document.getElementById('menuOverlay');
document.getElementById('menuOpen').addEventListener('click', () => menuOverlay.classList.add('open'));
document.getElementById('menuClose').addEventListener('click', () => menuOverlay.classList.remove('open'));
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', () => menuOverlay.classList.remove('open'));
});

updateLogoColor(); // now that .rail-brand markup above is in the DOM, run an initial pass

// ============ PROGRESS RAIL — scroll spy + click nav ============
const nodes = document.querySelectorAll('.progress-rail .node');
const sections = Array.from(nodes).map(n => document.getElementById(n.dataset.target)).filter(Boolean);

nodes.forEach(node => {
  node.addEventListener('click', () => {
    const target = document.getElementById(node.dataset.target);
    if(!target) return;
    const gatedAncestor = target.closest('.gated');
    if(gatedAncestor && !gatedAncestor.classList.contains('is-visible')){
      expandAllSections();
    }
    goTo(node.dataset.target);
  });
});

function updateActiveNode(){
  const scrollPos = window.scrollY + window.innerHeight * 0.4;
  let currentIndex = 0;
  sections.forEach((sec, i) => {
    // offsetParent is null for display:none elements — skip sections not currently shown
    if(sec && sec.offsetParent !== null && sec.offsetTop <= scrollPos) currentIndex = i;
  });
  nodes.forEach((n, i) => n.classList.toggle('active', i === currentIndex));
}
window.addEventListener('scroll', updateActiveNode, {passive:true});
updateActiveNode();

// ============ REVEAL ON SCROLL ============
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold:0.12});
revealEls.forEach(el => revealObserver.observe(el));

// ============ ANIMATED COUNTERS ============
const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, {threshold:0.5});
counters.forEach(c => counterObserver.observe(c));

function animateCounter(el){
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();

  function tick(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = Math.round(target * eased);
    el.textContent = prefix + value + suffix;
    if(progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
