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
    opacity:       '0.048',
    mixBlendMode:  'overlay',
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

/* ── Cursor trailer ───────────────────────────────────────
 *
 * A small ring that springs toward the cursor with a slight lag.
 * Desktop / fine-pointer devices only.
 */
function initCursorTrail() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(ring);

  let tx = -60, ty = -60; // where the cursor actually is
  let cx = tx,  cy = ty;  // where the ring is (lags behind)

  document.addEventListener('mousemove', e => {
    tx = e.clientX;
    ty = e.clientY;
  });

  document.addEventListener('mouseleave', () => { ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { ring.style.opacity = ''; });

  (function tick() {
    cx += (tx - cx) * 0.13; // spring constant — higher = less lag
    cy += (ty - cy) * 0.13;
    ring.style.transform =
      `translate(${(cx - 10).toFixed(1)}px,${(cy - 10).toFixed(1)}px)`;
    requestAnimationFrame(tick);
  })();
}

/* ── Page transitions ─────────────────────────────────────
 *
 * Every page fades in from black on load.
 * Clicking any internal link fades to black before navigating.
 */
function initPageTransitions() {
  const overlay = document.createElement('div');
  overlay.className = 'page-overlay';
  document.body.appendChild(overlay);

  // Double rAF: ensures the browser has painted opacity:1 before we remove it
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
    setTimeout(() => { window.location.href = href; }, 400);
  });
}

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFilmGrain();
  initCursorTrail();
  initPageTransitions();
});
