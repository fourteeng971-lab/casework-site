const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const motion = document.querySelector('.motion-toggle');
let userMotion = null;
function setMotion(value) {
  root.classList.toggle('reduce-motion', value);
  if (motion) { motion.textContent = value ? 'Enable motion' : 'Reduce motion'; motion.setAttribute('aria-pressed', String(value)); }
}
setMotion(reduced.matches);
reduced.addEventListener('change', e => { if (userMotion === null) setMotion(e.matches); });
if (motion) { motion.hidden = false; motion.addEventListener('click', () => { userMotion = !root.classList.contains('reduce-motion'); setMotion(userMotion); }); }
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }, {threshold: 0.08});
  document.querySelectorAll('[data-reveal]').forEach(el => { el.classList.add('reveal-ready'); observer.observe(el); });
}
for (const group of document.querySelectorAll('[data-tabs]')) {
  const tabs = [...group.querySelectorAll('[role=tab]')];
  function select(tab, focus = false) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !active; panel.classList.toggle('panel-enter', active);
      if (!active) panel.querySelectorAll('video').forEach(video => video.pause());
    }
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
    });
  });
  select(tabs[0]);
}
const dialog = document.querySelector('.lightbox');
let previousFocus;
if (dialog) {
  const image = dialog.querySelector('img');
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    previousFocus = button; image.src = button.dataset.zoom; image.alt = button.querySelector('img').alt;
    dialog.querySelector('.original-image').href = button.dataset.zoom;
    dialog.showModal(); document.body.style.overflow = 'hidden';
  }));
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; previousFocus?.focus(); });
}
