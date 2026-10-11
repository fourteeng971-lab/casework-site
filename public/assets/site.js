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

// Help search: find topics as you type. The index is the page's own text, read here, so it can never
// disagree with what is on the page. Nothing is sent anywhere; this runs entirely in the browser.
const helpSearch = document.querySelector('[data-help-search]');
if (helpSearch) {
  const input = helpSearch.querySelector('input');
  const status = helpSearch.querySelector('.help-status');
  const list = helpSearch.querySelector('.help-results');
  const fold = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const clean = text => text.replace(/\s+/g, ' ').trim();

  // One entry per section (and one per article's opening line): where it lives and what it says.
  const entries = [];
  for (const article of document.querySelectorAll('main article[id]')) {
    const articleTitle = clean(article.querySelector('h2')?.textContent ?? '');
    let current = { id: article.id, articleTitle, title: articleTitle, text: clean(article.querySelector('.lede')?.textContent ?? '') };
    entries.push(current);
    for (const node of article.children) {
      if (node.tagName === 'H3') {
        current = { id: node.id || article.id, articleTitle, title: clean(node.textContent), text: '' };
        entries.push(current);
      } else if (node.tagName === 'P' && !node.classList.contains('lede')) {
        current.text += ' ' + clean(node.textContent);
      } else if (node.tagName === 'FIGURE') {
        // A figure's numbered captions are part of what the section teaches, and are searchable.
        current.text += ' ' + [...node.querySelectorAll('figcaption li')].map(item => clean(item.textContent)).join(' ');
      }
    }
  }
  for (const entry of entries) {
    entry.text = entry.text.trim();     // so positions in the folded copy line up with the original
    entry.foldedTitle = fold(entry.title);
    entry.foldedArticle = fold(entry.articleTitle);
    entry.foldedText = fold(entry.text);
  }

  // Words are matched from their start, so "count" finds "countertop" and not "account". A plural
  // typed by the reader still finds the singular: the trailing s is dropped from the query.
  const wordStart = (haystack, term, from = 0) => {
    for (let i = haystack.indexOf(term, from); i >= 0; i = haystack.indexOf(term, i + 1)) {
      if (i === 0 || !/[a-z0-9]/.test(haystack[i - 1])) return i;
    }
    return -1;
  };

  const score = (entry, terms) => {
    let total = 0;
    for (const term of terms) {
      const inTitle = wordStart(entry.foldedTitle, term) >= 0;
      const inArticle = wordStart(entry.foldedArticle, term) >= 0;
      const at = wordStart(entry.foldedText, term);
      if (!inTitle && !inArticle && at < 0) return 0;        // every word has to be somewhere
      if (inTitle) total += 10;
      if (inArticle) total += 4;
      if (at >= 0) total += 2 + Math.min(4, entry.foldedText.split(term).length - 2);   // and a little for repeats
    }
    return total;
  };

  // A short run of the section's text around the first word found, with the words marked.
  const snippet = (entry, terms) => {
    const text = entry.text.trim();
    const comparable = entry.foldedText.length === entry.text.length;   // positions line up
    let first = -1;
    if (comparable) for (const term of terms) { const i = wordStart(entry.foldedText, term); if (i >= 0 && (first < 0 || i < first)) first = i; }
    const start = first > 60 ? text.lastIndexOf(' ', first - 40) + 1 : 0;
    const piece = text.slice(start, start + 170);
    const out = document.createDocumentFragment();
    if (start > 0) out.append('… ');
    const foldedPiece = comparable ? entry.foldedText.slice(start, start + 170) : '';
    const spans = [];
    if (foldedPiece) for (const term of terms) {
      for (let i = wordStart(foldedPiece, term); i >= 0; i = wordStart(foldedPiece, term, i + term.length)) {
        // The whole word, not just the letters typed, so "estimat" marks "estimate".
        let end = i + term.length; while (end < foldedPiece.length && /[a-z0-9]/.test(foldedPiece[end])) end++;
        spans.push([i, end]);
      }
    }
    spans.sort((a, b) => a[0] - b[0]);
    let cursor = 0;
    for (const [from, to] of spans) {
      if (from < cursor) continue;
      out.append(piece.slice(cursor, from));
      const mark = document.createElement('mark'); mark.textContent = piece.slice(from, to); out.append(mark);
      cursor = to;
    }
    out.append(piece.slice(cursor));
    if (start + 170 < text.length) out.append(' …');
    return out;
  };

  const run = () => {
    const query = input.value.trim();
    list.replaceChildren();
    if (!query) { status.textContent = ''; return; }
    const terms = fold(query).split(/\s+/).filter(Boolean)
      .map(term => term.length > 3 && term.endsWith('s') ? term.slice(0, -1) : term);
    const found = entries
      .map((entry, order) => ({ entry, order, points: score(entry, terms) }))
      .filter(item => item.points > 0)
      .sort((a, b) => b.points - a.points || a.order - b.order)
      .slice(0, 10);
    if (!found.length) { status.textContent = `No topics match “${query}”. Try fewer or different words.`; return; }
    status.textContent = found.length === 10 ? 'Showing the 10 best matches.' : `${found.length} ${found.length === 1 ? 'topic' : 'topics'} found.`;
    for (const { entry } of found) {
      const item = document.createElement('li');
      const link = document.createElement('a'); link.href = '#' + entry.id;
      const crumb = document.createElement('span'); crumb.className = 'crumb'; crumb.textContent = entry.articleTitle;
      const name = document.createElement('strong'); name.textContent = entry.title === entry.articleTitle ? 'Overview' : entry.title;
      const body = document.createElement('span'); body.className = 'snippet'; body.append(snippet(entry, terms));
      link.append(crumb, name, body); item.append(link); list.append(item);
    }
  };

  input.addEventListener('input', run);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { input.value = ''; run(); }
    else if (event.key === 'ArrowDown') { list.querySelector('a')?.focus(); event.preventDefault(); }
    else if (event.key === 'Enter') { const first = list.querySelector('a'); if (first) { event.preventDefault(); first.click(); } }
  });
  list.addEventListener('keydown', event => {
    const links = [...list.querySelectorAll('a')], at = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') { links[Math.min(at + 1, links.length - 1)]?.focus(); event.preventDefault(); }
    else if (event.key === 'ArrowUp') { (at > 0 ? links[at - 1] : input).focus(); event.preventDefault(); }
    else if (event.key === 'Escape') { input.focus(); }
  });
  // A link such as /support?q=countertop opens with the search already run.
  const preset = new URLSearchParams(location.search).get('q');
  if (preset) { input.value = preset; run(); }
  helpSearch.hidden = false;
}
