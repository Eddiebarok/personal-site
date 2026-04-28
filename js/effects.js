'use strict';

/* ── Film grain ───────────────────────────────────────────
 *
 * A half-resolution canvas redrawn at ~15 fps — enough to
 * look like real moving film grain without hammering the CPU.
 * mix-blend-mode: overlay blends it naturally with the page.
 */
function initFilmGrain() {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position:      'fixed',
    inset:         '0',
    width:         '100%',
    height:        '100%',
    pointerEvents: 'none',
    zIndex:        '9000',
    opacity:       '0.05',
    mixBlendMode:  'screen',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    // Half the device pixels keeps it fast while grain stays fine
    W = canvas.width  = Math.ceil(window.innerWidth  * 0.5);
    H = canvas.height = Math.ceil(window.innerHeight * 0.5);
  }
  resize();
  window.addEventListener('resize', resize);

  let last = 0;
  function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - last < 66) return; // cap at ~15 fps
    last = ts;

    const img = ctx.createImageData(W, H);
    // Uint32Array lets us write 4 bytes at once — much faster than RGBA loops
    const buf = new Uint32Array(img.data.buffer);
    for (let i = 0; i < buf.length; i++) {
      const v = (Math.random() * 256) | 0;
      // Little-endian RGBA: 0xFF_B_G_R  →  A=255, R=G=B=v (grayscale)
      buf[i] = 0xff000000 | (v << 16) | (v << 8) | v;
    }
    ctx.putImageData(img, 0, 0);
  }
  requestAnimationFrame(draw);
}

/* ── Page transitions ─────────────────────────────────────
 *
 * The overlay div lives in the HTML so it covers the first paint.
 * On load: fades out. On internal link click: fades back in, then navigates.
 */
function initPageTransitions() {
  const overlay = document.getElementById('pageOverlay');
  if (!overlay) return;

  // Double rAF: ensures the browser has painted the overlay before we fade it
  requestAnimationFrame(() =>
    requestAnimationFrame(() => overlay.classList.add('faded'))
  );

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    // Leave anchors, external URLs, mailto, and tel alone
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href)) return;
    e.preventDefault();
    overlay.classList.remove('faded');
    setTimeout(() => { window.location.href = href; }, 220);
  });
}

/* ── Film strip scrollbar ─────────────────────────────────
 *
 * A draggable film-strip on the right edge of the viewport.
 * Native scroll events (wheel, keyboard) still work normally;
 * the thumb stays in sync and can also be pulled to scroll.
 * Only active on pointer:fine (desktop) — touch devices keep
 * their native scroll behaviour.
 */
function initFilmScrollbar() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const bar   = document.createElement('div');
  bar.className = 'film-scrollbar';
  bar.setAttribute('aria-hidden', 'true');

  const thumb = document.createElement('div');
  thumb.className = 'film-scrollbar-thumb';
  bar.appendChild(thumb);
  document.body.appendChild(bar);

  /* ── sync thumb to current scroll position ── */
  function updateThumb() {
    const totalH     = document.documentElement.scrollHeight;
    const viewH      = window.innerHeight;
    const scrollable = Math.max(totalH - viewH, 1);
    const ratio      = window.scrollY / scrollable;
    const thumbH     = Math.max(28, Math.round(viewH * viewH / totalH));
    const thumbTop   = Math.round(ratio * (viewH - thumbH));
    thumb.style.height = thumbH + 'px';
    thumb.style.top    = thumbTop + 'px';
  }

  window.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  // Re-check after fonts + images settle
  window.addEventListener('load', updateThumb);
  updateThumb();

  /* ── drag the thumb ── */
  let dragging    = false;
  let startY      = 0;
  let startScroll = 0;

  thumb.addEventListener('mousedown', e => {
    dragging    = true;
    startY      = e.clientY;
    startScroll = window.scrollY;
    bar.classList.add('film-scrollbar--dragging');
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const totalH     = document.documentElement.scrollHeight;
    const viewH      = window.innerHeight;
    const thumbH     = thumb.offsetHeight;
    const trackH     = viewH;
    const dy         = e.clientY - startY;
    const scrollable = totalH - viewH;
    const newScroll  = startScroll + dy * scrollable / Math.max(trackH - thumbH, 1);
    window.scrollTo({ top: newScroll, behavior: 'instant' });
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    bar.classList.remove('film-scrollbar--dragging');
  });

  /* ── click on the track → jump to that position ── */
  bar.addEventListener('click', e => {
    if (e.target === thumb) return;
    const totalH     = document.documentElement.scrollHeight;
    const viewH      = window.innerHeight;
    const thumbH     = thumb.offsetHeight;
    const ratio      = Math.max(0, Math.min(1,
      (e.clientY - thumbH / 2) / (viewH - thumbH)
    ));
    window.scrollTo({ top: ratio * (totalH - viewH), behavior: 'smooth' });
  });
}

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFilmGrain();
  initPageTransitions();
  initFilmScrollbar();
});
