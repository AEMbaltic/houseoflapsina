(function () {
  'use strict';
  // Only the public gallery is measured, never admin or local previews.
  if (location.hostname !== 'foxart.aembaltic.com') return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.va('beforeSend', function (event) {
    const url = new URL(event.url);
    url.search = '';
    url.hash = '';
    return Object.assign({}, event, { url: url.href });
  });
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);
})();
