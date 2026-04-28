/*
 * main.js — Homepage interactions
 *
 * Handles:
 *   - Project list rendering
 *   - Category filter pills
 *   - Hover-reveal still preview (desktop)
 *   - EN / NL bio language toggle
 *   - CV section tabs
 *   - Smooth scroll for nav links
 *   - CMS homepage content (portrait, bio texts, about bio, contact)
 *   - Per-project visibility (reads visible field from content/work/[slug].md)
 */

'use strict';

/* ── Helpers ────────────────────────────────────────────── */

function $(selector, root) {
  return (root || document).querySelector(selector);
}

function $$(selector, root) {
  return Array.from((root || document).querySelectorAll(selector));
}

/* ── Build project list ─────────────────────────────────── */

function buildProjectList() {
  const list = document.getElementById('projectList');
  if (!list) return;

  PROJECTS.forEach(project => {
    const a = document.createElement('a');
    a.className = 'project-row';
    a.href = `work.html?p=${project.slug}`;
    a.setAttribute('role', 'listitem');
    a.dataset.category = project.category;
    a.dataset.slug = project.slug;
    a.dataset.title = project.title;

    a.innerHTML = `
      <div class="project-left">
        <div class="project-thumb" aria-hidden="true"></div>
        <span class="project-title">${project.title}</span>
      </div>
      <span class="project-year">${project.year}</span>
    `;

    list.appendChild(a);
  });
}

/* ── Category filter ────────────────────────────────────── */

function initFilter() {
  const pills = $$('.pill', document.getElementById('filterPills'));
  if (!pills.length) return;

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const active = pills.find(p => p.classList.contains('active'));
      if (active === pill) return;

      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      applyFilter(pill.dataset.filter);
    });
  });
}

function applyFilter(category) {
  const rows = $$('.project-row');

  rows.forEach(row => {
    const match = category === 'all' || row.dataset.category === category;

    if (!match) {
      // Fade out then hide
      row.classList.add('fading-out');
      setTimeout(() => {
        row.classList.add('hidden');
        row.classList.remove('fading-out');
      }, 240);
    } else {
      // Show then fade in
      row.classList.remove('hidden');
      row.style.opacity = '0';
      // Double rAF ensures the display change has rendered before transitioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          row.style.opacity = '';
        });
      });
    }
  });
}

/* ── Hover-reveal still preview ─────────────────────────── */

function initStillPreview() {
  const preview = document.getElementById('stillPreview');
  const label   = document.getElementById('stillLabel');
  if (!preview || !label) return;

  // Only on pointer devices that support hover
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    preview.remove();
    return;
  }

  const PW = 290; // preview width  (matches CSS)
  const PH = Math.round(290 / 1.6); // preview height

  // Track mouse position globally
  document.addEventListener('mousemove', e => {
    let x = e.clientX + 28;
    let y = e.clientY - Math.round(PH / 2);

    // Prevent overflow
    if (x + PW > window.innerWidth - 16) {
      x = e.clientX - PW - 28;
    }
    if (y < 12) y = 12;
    if (y + PH > window.innerHeight - 12) {
      y = window.innerHeight - PH - 12;
    }

    preview.style.left = x + 'px';
    preview.style.top  = y + 'px';
  });

  // Attach to project rows (rows are built dynamically, so delegate)
  document.getElementById('projectList').addEventListener('mouseover', e => {
    const row = e.target.closest('.project-row');
    if (!row) return;
    label.textContent = `Still — ${row.dataset.title}`;
    preview.classList.add('visible');
  });

  document.getElementById('projectList').addEventListener('mouseout', e => {
    const row = e.target.closest('.project-row');
    if (!row) return;
    // Only hide if leaving the row entirely (not moving between children)
    if (!row.contains(e.relatedTarget)) {
      preview.classList.remove('visible');
    }
  });
}

/* ── EN / NL bio toggle ─────────────────────────────────── */

function initLangToggle() {
  const toggle = document.getElementById('langToggle');
  const pill   = document.getElementById('langPill');
  if (!toggle || !pill) return;

  const btns  = $$('.lang-btn', toggle);
  const bioEn = document.getElementById('bio-en');
  const bioNl = document.getElementById('bio-nl');
  if (!bioEn || !bioNl) return;

  let currentLang = 'nl';

  // Set initial pill size/position
  function setPill(btn) {
    pill.style.width  = btn.offsetWidth  + 'px';
    pill.style.height = btn.offsetHeight + 'px';
    // Offset relative to toggle container
    pill.style.transform = `translateX(${btn.offsetLeft - 3}px)`;
  }
  setPill(btns[1]); // NL is default

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang === currentLang) return;

      // Update pill + button states
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setPill(btn);

      // Crossfade bio text
      const fromEl = lang === 'nl' ? bioEn : bioNl;
      const toEl   = lang === 'nl' ? bioNl : bioEn;

      fromEl.style.opacity = '0';

      fromEl.addEventListener('transitionend', function handler() {
        fromEl.removeEventListener('transitionend', handler);
        fromEl.hidden = true;
        fromEl.style.opacity = '';
        toEl.hidden = false;
        toEl.style.opacity = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            toEl.style.opacity = '';
          });
        });
      });

      // Update floating keyword text
      $$('[data-nl]').forEach(s => {
        if (s.dataset[lang]) s.textContent = s.dataset[lang];
      });

      currentLang = lang;
    });
  });
}

/* ── CV tabs ────────────────────────────────────────────── */

function initCvTabs() {
  const tabs   = $$('.cv-tab');
  const panels = $$('.cv-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const panel = document.getElementById(`panel-${tab.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ── Scroll offset for sticky nav ───────────────────────── */

function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navH = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
      ) * 16; // convert rem to px (approximate)
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ── Letter repel effect ─────────────────────────────────── */
// Each letter in the hero name flees the cursor, then springs back.
// Each letter has a fixed random angle offset so they scatter in
// genuinely different directions even at the same distance.

function initLetterRepel() {
  const title = document.querySelector('.intro-title');
  if (!title) return;

  // Touch screens: skip
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const raw = title.textContent;

  // Assign a fixed personality angle to every character position
  const personalities = raw.split('').map(ch =>
    ch === ' ' ? 0 : (Math.random() - 0.5) * Math.PI * 0.8
  );

  // Rewrite as spans — spaces stay as plain text nodes
  title.innerHTML = raw.split('').map((ch, i) => {
    if (ch === ' ') return ' ';
    return `<span class="letter" data-a="${personalities[i].toFixed(4)}">${ch}</span>`;
  }).join('');

  const letters = title.querySelectorAll('.letter');
  const RADIUS  = 130; // px — how far the cursor's "field" reaches
  const POWER   = 55;  // px — max displacement at cursor centre

  let rafPending = false;
  let cx = -9999, cy = -9999;

  function repel() {
    letters.forEach(letter => {
      const r  = letter.getBoundingClientRect();
      const lx = r.left + r.width  * 0.5;
      const ly = r.top  + r.height * 0.5;
      const dx = lx - cx;
      const dy = ly - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < RADIUS && dist > 0) {
        // Force increases sharply as cursor gets close
        const t  = 1 - dist / RADIUS;
        const f  = t * t * POWER;
        const angle = Math.atan2(dy, dx) + parseFloat(letter.dataset.a);
        const tx = Math.cos(angle) * f;
        const ty = Math.sin(angle) * f;
        letter.style.transition = 'transform 0.08s linear';
        letter.style.transform  = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px)`;
      } else {
        // Spring back
        letter.style.transition = 'transform 0.65s cubic-bezier(0.34,1.56,0.64,1)';
        letter.style.transform  = '';
      }
    });
    rafPending = false;
  }

  title.addEventListener('mousemove', e => {
    cx = e.clientX;
    cy = e.clientY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(repel);
    }
  });

  title.addEventListener('mouseleave', () => {
    cx = cy = -9999;
    letters.forEach(l => {
      l.style.transition = 'transform 0.65s cubic-bezier(0.34,1.56,0.64,1)';
      l.style.transform  = '';
    });
  });
}

/* ── Floating keywords ───────────────────────────────────── */
// Two-harmonic Lissajous paths, 2× speed, 3× range.
// Collision detection: words repel each other on close approach.
// Hard Y clamp keeps words above the bio line; can go off-screen elsewhere.

function initFloatingWords() {
  const section = document.getElementById('intro');
  if (!section) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const container = section.querySelector('.container');
  const sub       = section.querySelector('.intro-sub');
  if (!sub || !container) return;

  const spans = Array.from(sub.querySelectorAll('span'));
  if (!spans.length) return;

  spans.forEach(span => {
    span.style.position      = 'absolute';
    span.style.left          = '0';
    span.style.top           = '0';
    span.style.whiteSpace    = 'nowrap';
    span.style.pointerEvents = 'none';
    span.style.willChange    = 'transform';
    span.style.opacity       = '0.48';
    span.style.fontSize      = '0.78rem';
    span.style.letterSpacing = '0.03em';
    span.style.color         = 'var(--muted)';
    container.appendChild(span);
  });

  sub.style.height       = '0';
  sub.style.marginBottom = '3.5rem';

  // Two sine harmonics per word → non-repeating chaotic paths
  // Amplitudes 3× original, frequencies 2× original
  const cfg = [
    { bx: 0.06, byF: 0.28,
      Ax: 216, Ay: 174, wx: 0.00044, wy: 0.00034, px: 0.0, py: 1.1,
      Ax2: 90,  Ay2: 60,  wx2: 0.00067, wy2: 0.00051, px2: 1.7, py2: 3.1, zi: '3' },
    { bx: 0.52, byF: 0.55,
      Ax: 174, Ay: 138, wx: 0.00062, wy: 0.00048, px: 2.1, py: 0.4,
      Ax2: 110, Ay2: 80,  wx2: 0.00041, wy2: 0.00073, px2: 0.8, py2: 1.9, zi: '1' },
    { bx: 0.28, byF: 0.14,
      Ax: 246, Ay: 180, wx: 0.00036, wy: 0.00058, px: 1.3, py: 2.3,
      Ax2: 75,  Ay2: 105, wx2: 0.00078, wy2: 0.00038, px2: 2.5, py2: 0.7, zi: '3' },
    { bx: 0.70, byF: 0.62,
      Ax: 186, Ay: 150, wx: 0.00054, wy: 0.00040, px: 3.5, py: 0.9,
      Ax2: 100, Ay2: 65,  wx2: 0.00053, wy2: 0.00066, px2: 1.2, py2: 2.8, zi: '1' },
  ];

  spans.forEach((span, i) => { span.style.zIndex = cfg[i].zi; });

  // Per-word collision perturbation state
  const st  = spans.map(() => ({ dx: 0, dy: 0, vx: 0, vy: 0 }));
  const pos = spans.map(() => ({ x: 0, y: 0 }));

  const title = container.querySelector('.intro-title');
  const bioEl = container.querySelector('[data-animate="3"]');
  const COLL  = 90; // collision radius px

  (function tick(ts) {
    const W      = container.clientWidth;
    const titleH = title ? title.offsetHeight : 180;
    const maxY   = bioEl  ? bioEl.offsetTop - 10 : titleH * 1.5;

    // 1. Base two-harmonic Lissajous positions
    spans.forEach((_, i) => {
      const c  = cfg[i];
      pos[i].x = c.bx  * W
        + c.Ax  * Math.sin(c.wx  * ts + c.px)
        + c.Ax2 * Math.sin(c.wx2 * ts + c.px2);
      pos[i].y = c.byF * titleH
        + c.Ay  * Math.sin(c.wy  * ts + c.py)
        + c.Ay2 * Math.sin(c.wy2 * ts + c.py2);
    });

    // 2. Pairwise collision repulsion
    for (let i = 0; i < spans.length - 1; i++) {
      for (let j = i + 1; j < spans.length; j++) {
        const ddx  = pos[j].x - pos[i].x;
        const ddy  = pos[j].y - pos[i].y;
        const dist = Math.hypot(ddx, ddy) || 1;
        if (dist < COLL) {
          const f  = ((COLL - dist) / COLL) * 2.5;
          const nx = ddx / dist, ny = ddy / dist;
          st[i].vx -= nx * f;  st[i].vy -= ny * f;
          st[j].vx += nx * f;  st[j].vy += ny * f;
        }
      }
    }

    // 3. Integrate perturbation with damping (velocity → position → spring back)
    st.forEach(s => {
      s.vx *= 0.88;  s.vy *= 0.88;
      s.dx += s.vx;  s.dy += s.vy;
      s.dx *= 0.97;  s.dy *= 0.97;
    });

    // 4. Apply positions — hard clamp at bio line, small bounce
    spans.forEach((span, i) => {
      const x = pos[i].x + st[i].dx;
      let   y = pos[i].y + st[i].dy;
      if (y > maxY) {
        st[i].dy -= (y - maxY);
        st[i].vy *= -0.4;
        y = maxY;
      }
      span.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    });

    requestAnimationFrame(tick);
  })(0);
}

/* ── Fit title to container width ───────────────────────── */
// Sets the hero name's font-size so it spans exactly the container width.
// Runs after fonts load and on every resize. Mobile: let CSS handle it.

function fitTitle() {
  const el = document.querySelector('.intro-title');
  if (!el) return;
  if (window.innerWidth <= 768) {
    el.style.fontSize = '';
    return;
  }
  el.style.fontSize = '200px';
  const scale = el.parentElement.clientWidth / el.scrollWidth;
  el.style.fontSize = Math.floor(200 * scale * 0.99) + 'px';
}

/* ── CMS homepage content ───────────────────────────────── */

/**
 * Minimal markdown renderer:
 * - *text* → <em>text</em>
 * - Double newlines → paragraph breaks
 * Handles the About bio from the CMS markdown widget.
 */
function renderMarkdown(text) {
  if (!text) return '';
  const paragraphs = text.trim().split(/\n\n+/);
  return paragraphs.map(p => {
    const html = p
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/_([^_\n]+)_/g, '<em>$1</em>');
    return `<p>${html}</p>`;
  }).join('\n');
}

async function loadHomepageContent() {
  let data;
  try {
    const res = await fetch('/content/homepage.json');
    if (!res.ok) return;
    data = await res.json();
  } catch {
    return; // fail silently — hardcoded HTML is the fallback
  }

  // ── Intro bio (EN) ────────────────────────────────────────
  if (data.bio_en) {
    const el = document.getElementById('bio-en');
    if (el) el.textContent = data.bio_en;
  }

  // ── Intro bio (NL) ────────────────────────────────────────
  if (data.bio_nl) {
    const el = document.getElementById('bio-nl');
    if (el) el.textContent = data.bio_nl;
  }

  // ── Contact email ─────────────────────────────────────────
  if (data.contact_email) {
    const el = document.getElementById('contact-email');
    if (el) {
      el.innerHTML = `<a href="mailto:${data.contact_email}">${data.contact_email}</a>`;
    }
  }

  // ── Contact phone ─────────────────────────────────────────
  if (data.contact_phone) {
    const el = document.getElementById('contact-phone');
    if (el) el.textContent = data.contact_phone;
  }

  // ── Contact note ──────────────────────────────────────────
  if (data.contact_note) {
    const el = document.getElementById('contact-note');
    if (el) el.textContent = data.contact_note;
  }
}

/* ── Project visibility ─────────────────────────────────── */

/**
 * Fetches each project's markdown file in parallel and removes
 * any row whose frontmatter contains `visible: false`.
 * Missing files or parse errors default to visible.
 */
async function applyProjectVisibility() {
  const rows = $$('.project-row');
  if (!rows.length) return;

  const texts = await Promise.all(
    rows.map(row =>
      fetch(`/content/work/${row.dataset.slug}.md`)
        .then(r => r.ok ? r.text() : null)
        .catch(() => null)
    )
  );

  rows.forEach((row, i) => {
    const text = texts[i];
    if (!text) return; // file missing → visible by default
    const match = text.match(/^visible:\s*(true|false)/m);
    const visible = !match || match[1] !== 'false';
    if (!visible) row.remove();
  });
}

/* ── Init ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  buildProjectList();
  initFilter();
  initStillPreview();
  initLangToggle();
  initCvTabs();
  initSmoothScroll();
  initLetterRepel();          // wraps letters in spans first
  initFloatingWords();        // drifts keywords through the name area
  fitTitle();                  // then measures & fits
  document.fonts.ready.then(fitTitle);
  window.addEventListener('resize', fitTitle);

  // Load CMS content and apply visibility — run in parallel
  await Promise.all([
    loadHomepageContent(),
    applyProjectVisibility()
  ]);
});
