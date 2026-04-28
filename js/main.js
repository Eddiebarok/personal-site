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

/* ── Build film strip ───────────────────────────────────── */

function buildFilmStrip() {
  const strip = document.getElementById('filmStrip');
  if (!strip) return;

  // Show only fiction films in a fixed order: released films, then Los last
  const ORDER = ['niks-gebeurd', 'suni', 'per-persoon', 'los'];
  const map   = Object.fromEntries(PROJECTS.map(p => [p.slug, p]));

  ORDER.forEach(slug => {
    const project = map[slug];
    if (!project) return;

    const a = document.createElement('a');
    a.href = `work.html?p=${slug}`;
    a.setAttribute('role', 'listitem');

    if (project.preProduction) {
      a.className = 'film-item film-item--upcoming';
      a.innerHTML = `
        <span class="film-title">${project.title}</span>
        <span class="film-meta">Short film&nbsp;· Pre-production</span>
      `;
    } else {
      a.className = 'film-item';
      a.innerHTML = `
        <span class="film-title">${project.title}</span>
        <span class="film-year">${project.year}</span>
      `;
    }

    strip.appendChild(a);
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
    span.style.fontSize      = '0.78rem';
    span.style.letterSpacing = '0.03em';
    container.appendChild(span);
  });

  sub.style.height       = '0';
  sub.style.marginBottom = '3.5rem';

  const SPEED = 1.8; // px per 60fps frame — identical for every word

  // Each word gets a unique starting angle so they fan out immediately
  const startAngles = [0.82, 2.47, 4.05, 5.60]; // radians, spread ~90° apart
  const vel = startAngles.map(a => ({
    vx: Math.cos(a) * SPEED,
    vy: Math.sin(a) * SPEED,
  }));

  // z-index: odd words behind title (zi=1), even words in front of title (zi=3)
  const zi = ['3', '1', '3', '1'];
  spans.forEach((span, i) => { span.style.zIndex = zi[i]; });

  const pos  = spans.map(() => ({ x: 0, y: 0 }));
  const title = container.querySelector('.intro-title');
  const LR    = 380;
  const COLL  = 110; // collision radius px

  let initialized = false;
  let lastTs      = null;

  (function tick(ts) {
    if (lastTs === null) { lastTs = ts; requestAnimationFrame(tick); return; }
    const dt   = ts - lastTs;
    lastTs = ts;
    const step = Math.min(dt / 16.67, 3);

    const W      = container.clientWidth;
    const titleH = title ? title.offsetHeight : 180;
    const lightX = 0.18 * W;
    const lightY = titleH * -0.15;

    // Lazy initialise positions once real dimensions are available
    if (!initialized) {
      const starts = [
        { x: 0.12 * W, y:  0.15 * titleH },
        { x: 0.62 * W, y:  0.55 * titleH },
        { x: 0.32 * W, y: -0.20 * titleH },
        { x: 0.78 * W, y:  0.80 * titleH },
      ];
      starts.forEach((s, i) => { pos[i].x = s.x; pos[i].y = s.y; });
      initialized = true;
    }

    // Bounce bounds: wide horizontal, generous vertical so words reach
    // below the bio (they appear behind sections via z-index)
    const minX = -20;
    const maxX = W + 20;
    const minY = -titleH * 0.6;
    const maxY =  titleH * 4.0;

    // 1. Straight-line movement + wall bounce
    spans.forEach((_, i) => {
      pos[i].x += vel[i].vx * step;
      pos[i].y += vel[i].vy * step;

      if (pos[i].x < minX) {
        pos[i].x  = minX + (minX - pos[i].x);
        vel[i].vx = Math.abs(vel[i].vx);
      } else if (pos[i].x > maxX) {
        pos[i].x  = maxX - (pos[i].x - maxX);
        vel[i].vx = -Math.abs(vel[i].vx);
      }

      if (pos[i].y < minY) {
        pos[i].y  = minY + (minY - pos[i].y);
        vel[i].vy = Math.abs(vel[i].vy);
      } else if (pos[i].y > maxY) {
        pos[i].y  = maxY - (pos[i].y - maxY);
        vel[i].vy = -Math.abs(vel[i].vy);
      }
    });

    // 2. Word-word elastic collision — equal mass, preserves speed
    for (let i = 0; i < spans.length - 1; i++) {
      for (let j = i + 1; j < spans.length; j++) {
        const ddx  = pos[j].x - pos[i].x;
        const ddy  = pos[j].y - pos[i].y;
        const dist = Math.hypot(ddx, ddy) || 1;
        if (dist < COLL) {
          const nx  = ddx / dist, ny = ddy / dist;
          // Relative velocity projected onto collision normal
          const dvn = (vel[i].vx - vel[j].vx) * nx + (vel[i].vy - vel[j].vy) * ny;
          if (dvn > 0) { // only if approaching
            // Swap velocity components along the normal (equal-mass elastic)
            vel[i].vx -= dvn * nx;  vel[i].vy -= dvn * ny;
            vel[j].vx += dvn * nx;  vel[j].vy += dvn * ny;
            // Re-normalise to SPEED (guards fp drift)
            const mi = Math.hypot(vel[i].vx, vel[i].vy) || 1;
            const mj = Math.hypot(vel[j].vx, vel[j].vy) || 1;
            vel[i].vx = vel[i].vx / mi * SPEED;  vel[i].vy = vel[i].vy / mi * SPEED;
            vel[j].vx = vel[j].vx / mj * SPEED;  vel[j].vy = vel[j].vy / mj * SPEED;
            // Push apart to prevent sticking
            const sep = (COLL - dist) * 0.5 + 1;
            pos[i].x -= nx * sep;  pos[i].y -= ny * sep;
            pos[j].x += nx * sep;  pos[j].y += ny * sep;
          }
        }
      }
    }

    // 3. Apply positions + light-reactive colour
    spans.forEach((span, i) => {
      const x = pos[i].x, y = pos[i].y;
      span.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      const litT = Math.max(0, 1 - Math.hypot(x - lightX, y - lightY) / LR);
      const r = Math.round(232 + litT * 23);
      const g = Math.round(222 + litT * 10);
      const b = Math.round(206 - litT * 56);
      const a = (0.25 + litT * 0.60).toFixed(2);
      span.style.color = `rgba(${r},${g},${b},${a})`;
    });

    requestAnimationFrame(tick);
  })(0);
}

/* ── Deakins per-letter gradient ────────────────────────── */
// Applies a radial gradient to each .letter span so the light source
// appears to come from a single point (upper-left) across the full name.

function applyDeakinsGradient() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const title = document.querySelector('.intro-title');
  if (!title) return;
  const letters = title.querySelectorAll('.letter');
  if (!letters.length) return;

  const tRect = title.getBoundingClientRect();
  const W = tRect.width, H = tRect.height;
  // Light source: upper-left corner of the title block
  const lx0 = 0.18 * W;
  const ly0 = H * -0.15;

  letters.forEach(letter => {
    const r  = letter.getBoundingClientRect();
    // Shift gradient origin so it's continuous across all letters
    const lx = lx0 - (r.left - tRect.left);
    const ly = ly0 - (r.top  - tRect.top);
    letter.style.background =
      `radial-gradient(ellipse 600px 420px at ${lx.toFixed(0)}px ${ly.toFixed(0)}px,` +
      ' #fffbe0 0%, #fde060 8%, #d49010 23%, #824015 40%, #2e1204 58%, #0e0501 78%, #060200 100%)';
    letter.style.webkitBackgroundClip = 'text';
    letter.style.backgroundClip       = 'text';
    letter.style.webkitTextFillColor  = 'transparent';
    letter.style.color                 = '';
  });
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

document.addEventListener('DOMContentLoaded', () => {
  buildFilmStrip();
  initLangToggle();
  initCvTabs();
  initSmoothScroll();
  initLetterRepel();
  fitTitle();
  applyDeakinsGradient();
  document.fonts.ready.then(() => { fitTitle(); applyDeakinsGradient(); });
  window.addEventListener('resize', () => { fitTitle(); applyDeakinsGradient(); });
  loadHomepageContent();
});
