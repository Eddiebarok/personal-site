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

  let currentLang = 'en';

  // Set initial pill size/position
  function setPill(btn) {
    pill.style.width  = btn.offsetWidth  + 'px';
    pill.style.height = btn.offsetHeight + 'px';
    // Offset relative to toggle container
    pill.style.transform = `translateX(${btn.offsetLeft - 3}px)`;
  }
  setPill(btns[0]); // EN is default

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

  // Load CMS content and apply visibility — run in parallel
  await Promise.all([
    loadHomepageContent(),
    applyProjectVisibility()
  ]);
});
