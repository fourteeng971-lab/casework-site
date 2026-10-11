// Chooses the language of the English page a visitor lands on.
//
// English lives at the root and German, Spanish, French and Portuguese under /de/, /es/, /fr/ and
// /pt/. A visitor who arrives from outside the site with a browser set to one of those four is sent to
// the same page in that language, keeping the section anchor and any query. Everyone else stays on
// English, which is also what happens with scripts off.
//
// Nothing is stored and nothing is sent: the browser's language list is read once and discarded.
// A choice made with the language menu is never overridden. Its English link carries ?lang=en, and
// moving around the site (a same-site referrer) never redirects, so the manual choice holds without a
// cookie or any other storage.
(function () {
  var page = document.documentElement.getAttribute('data-page');
  if (!page) return;                                   // the 404 page, and every translated page
  var params = new URLSearchParams(location.search);
  if (params.has('lang')) {                            // an explicit choice: honour it, tidy the address
    params.delete('lang');
    var rest = params.toString();
    try { history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash); } catch (e) {}
    return;
  }
  try {
    if (document.referrer && new URL(document.referrer).origin === location.origin) return;
  } catch (e) {}
  var supported = ['de', 'es', 'fr', 'pt'];
  var wanted = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  for (var i = 0; i < wanted.length; i++) {
    var code = String(wanted[i]).toLowerCase().split('-')[0];
    if (code === 'en') return;                         // English is asked for before anything we offer
    if (supported.indexOf(code) >= 0) {
      location.replace('/' + code + (page === '/' ? '/' : page) + location.search + location.hash);
      return;
    }
  }
})();
