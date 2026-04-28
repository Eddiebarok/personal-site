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

/* ── Cursor as light source ───────────────────────────────
 *
 * Follows the cursor with a warm amber glow disc (mix-blend-mode: screen).
 * On every frame, each text element gets a text-shadow whose direction and
 * intensity depend on the cursor-to-element vector — nearer = darker & harder.
 */
function initCursorLight() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  // Warm glow disc — small and punchy
  const disc = document.createElement('div');
  Object.assign(disc.style, {
    position:      'fixed',
    width:         '260px',
    height:        '260px',
    borderRadius:  '50%',
    background:    'radial-gradient(circle, rgba(230,155,30,0.55) 0%, rgba(190,110,15,0.22) 38%, transparent 68%)',
    pointerEvents: 'none',
    zIndex:        '8990',
    transform:     'translate(-50%,-50%)',
    mixBlendMode:  'screen',
    opacity:       '0',
    transition:    'opacity 0.4s ease',
  });
  document.body.appendChild(disc);

  const SELS = [
    '.intro-title .letter',
    '.nav-name',
    '.nav-links a',
    '.section-label',
    '.film-title',
    '.film-year',
    '.film-meta',
    '.bio-text',
    '.contact-email a',
    '.contact-note',
  ].join(', ');

  const MAX_DIST = 420; // tighter radius — effect is focused around the cursor
  let cx = -9999, cy = -9999;
  let pending = false;

  function castShadows() {
    pending = false;
    document.querySelectorAll(SELS).forEach(el => {
      const r  = el.getBoundingClientRect();
      const ex = r.left + r.width  * 0.5;
      const ey = r.top  + r.height * 0.5;
      const dx = ex - cx;           // vector from cursor to element
      const dy = ey - cy;
      const dist = Math.max(Math.hypot(dx, dy), 1);

      if (dist > MAX_DIST) { el.style.textShadow = ''; return; }

      const t     = 1 - dist / MAX_DIST;      // 1 = cursor on element, 0 = at edge
      const nx    = dx / dist;                 // unit direction: cursor → element
      const ny    = dy / dist;
      const off   = 3 + 14 * t;               // offset px — larger for crisper shadow
      const blur  = 1 + 10 * (1 - t * 0.8);  // blur px — hard near cursor, soft far
      const alpha = 0.18 + 0.78 * t;          // opacity — near 1.0 right under cursor

      el.style.textShadow =
        `${(nx * off).toFixed(1)}px ${(ny * off).toFixed(1)}px ` +
        `${blur.toFixed(1)}px rgba(0,0,0,${alpha.toFixed(2)})`;
    });
  }

  document.addEventListener('mousemove', e => {
    cx = e.clientX;
    cy = e.clientY;
    disc.style.left = cx + 'px';
    disc.style.top  = cy + 'px';
    if (!pending) { pending = true; requestAnimationFrame(castShadows); }
  });

  document.addEventListener('mouseenter', () => {
    disc.style.opacity = '1';
  });

  document.addEventListener('mouseleave', () => {
    disc.style.opacity = '0';
    document.querySelectorAll(SELS).forEach(el => { el.style.textShadow = ''; });
  });
}

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFilmGrain();
  initPageTransitions();
  initCursorLight();
});
