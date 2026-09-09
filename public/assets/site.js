const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const motion = document.querySelector('.motion-toggle');
let userMotion = null;
function setMotion(value) {
  root.classList.toggle('reduce-motion', value);
  document.dispatchEvent(new Event('casework:motionchange'));
  if (motion) { motion.textContent = value ? 'Play motion' : 'Pause motion'; motion.setAttribute('aria-pressed', String(value)); }
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
    document.dispatchEvent(new Event('casework:viewchange'));
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

// Motion is part of the page, with playback limited to visible sections.
const ambientVideos = [...document.querySelectorAll('[data-ambient-video]')];
const visibleVideos = new Set();
function canAnimate(video) {
  return !document.hidden && !root.classList.contains('reduce-motion') && visibleVideos.has(video) && !video.closest('[hidden]');
}
function refreshVideos() {
  for (const video of ambientVideos) {
    const retry = video.closest('.motion-hero, .demo-figure')?.querySelector('.video-retry');
    if (!canAnimate(video)) {
      video.pause();
      if (retry) retry.hidden = true;
      continue;
    }
    if (!video.paused) continue;
    video.play().then(() => {
      if (!canAnimate(video)) video.pause();
      if (retry) retry.hidden = true;
    }).catch(() => { if (retry) retry.hidden = !canAnimate(video); });
  }
}
for (const video of ambientVideos) {
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playbackRate = 0.7;
  video.addEventListener('contextmenu', event => event.preventDefault());
  const retry = video.closest('.motion-hero, .demo-figure')?.querySelector('.video-retry');
  if (retry) retry.addEventListener('click', () => {
    video.play().then(() => { retry.hidden = true; }).catch(() => { retry.textContent = 'Preview unavailable'; });
  });
}
if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleVideos.add(entry.target); else visibleVideos.delete(entry.target);
    }
    refreshVideos();
  }, {threshold:0.05});
  ambientVideos.forEach(video => videoObserver.observe(video));
} else {
  const updateVisibleVideos = () => {
    for (const video of ambientVideos) {
      const bounds = video.getBoundingClientRect();
      if (bounds.width && bounds.bottom > 0 && bounds.top < innerHeight) visibleVideos.add(video); else visibleVideos.delete(video);
    }
    refreshVideos();
  };
  addEventListener('scroll', updateVisibleVideos, {passive:true});
  addEventListener('resize', updateVisibleVideos);
  updateVisibleVideos();
}
document.addEventListener('visibilitychange', refreshVideos);
document.addEventListener('casework:motionchange', refreshVideos);
document.addEventListener('casework:viewchange', refreshVideos);
