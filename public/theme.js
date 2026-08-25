// Site theme: black, every time the site is opened. The sun toggle switches
// to light for the CURRENT visit only (per-tab session) — a fresh open is
// always the brand's dark look. Loaded synchronously in <head> so the
// attribute lands before first paint — no flash.
(() => {
  try {
    localStorage.removeItem('ripley-theme'); // retire the old forever-choice
    if (sessionStorage.getItem('ripley-theme') === 'light') document.documentElement.dataset.theme = 'light';
  } catch { /* storage blocked — dark it is */ }

  // Keep the iOS status-bar / browser chrome painted the same colour as the
  // page background, so the top strip is never a stray grey. Reads the real
  // computed background so it's right on every page and both themes.
  const syncChrome = () => {
    try {
      const bg = getComputedStyle(document.body).backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
      let m = document.querySelector('meta[name="theme-color"]');
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'theme-color'); document.head.appendChild(m); }
      m.setAttribute('content', bg);
    } catch { /* no-op */ }
  };

  addEventListener('DOMContentLoaded', () => {
    syncChrome();
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
      b.addEventListener('click', () => {
        const toLight = document.documentElement.dataset.theme !== 'light';
        if (toLight) document.documentElement.dataset.theme = 'light';
        else delete document.documentElement.dataset.theme;
        try { sessionStorage.setItem('ripley-theme', toLight ? 'light' : 'dark'); } catch { /* fine */ }
        syncChrome();
      });
    });
  });
})();

// ---------------------------------------------------------------------------
// Google Preferred Sources.
// Loads Google's publisher library and drops the "Add to Preferred Sources"
// button into the site footer. It lives here rather than in the page markup
// because theme.js is the one script every page already loads in <head> —
// including the SEO pages stamped by scripts/gen-seo-pages.mjs — so the button
// appears site-wide from one place and survives a regeneration.
// Docs: https://developers.google.com/search/docs/appearance/preferred-sources
// ---------------------------------------------------------------------------
(() => {
  const SRC = 'https://news.google.com/swg/js/v1/publisher.js';

  const mount = () => {
    const footer = document.querySelector('.site-footer');
    if (!footer || footer.querySelector('[google-add-preferred-source-btn]')) return;

    const slot = document.createElement('div');
    slot.className = 'footer-pref-source';
    slot.style.marginTop = '12px';

    const btn = document.createElement('div');
    btn.setAttribute('google-add-preferred-source-btn', '');
    // Dark is the default look; the sun toggle switches it for the current visit.
    btn.setAttribute('data-theme', document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    slot.appendChild(btn);

    (footer.querySelector('.footer-brand') || footer).appendChild(slot);

    // Load the library only once the target div exists — it scans the DOM for
    // the attribute as soon as it initialises.
    if (document.querySelector('script[data-preferred-source]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = SRC;
    s.setAttribute('data-preferred-source', '');
    document.head.appendChild(s);
  };

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mount);
  else mount();
})();
