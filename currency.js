/* ==========================================================================
   washee — landing page currency switch (₫ VND / $ USD)
   Plain script. Price nodes carry both values as data-vnd / data-usd; this
   swaps between them, remembers the choice in localStorage, and defaults to
   VND (the service is priced natively in đồng; USD is an approximate
   convenience conversion at ~25,000₫ per US dollar).
   ========================================================================== */
(() => {
  'use strict';

  const LS_CUR = 'washee.currency';
  const saved = localStorage.getItem(LS_CUR);
  const initial = saved === 'usd' || saved === 'vnd' ? saved : 'vnd';

  function applyCurrency(cur) {
    document.querySelectorAll('[data-vnd][data-usd]').forEach((el) => {
      el.textContent = cur === 'usd' ? el.dataset.usd : el.dataset.vnd;
    });
    document.querySelectorAll('.cur-btn').forEach((btn) => {
      const on = btn.dataset.cur === cur;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.cur-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      localStorage.setItem(LS_CUR, btn.dataset.cur);
      applyCurrency(btn.dataset.cur);
    })
  );

  applyCurrency(initial);
})();
