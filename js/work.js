/*
 * work.js — Project detail page
 *
 * Reads the `?p=` query param, finds the project in PROJECTS,
 * then renders all content into the page.
 *
 * To add real images later:
 *   - Drop files into /images/[slug]/key.jpg, still-1.jpg, etc.
 *   - Set `imageSrc` and `stills: ['still-1.jpg', ...]` in data.js
 *   - This file will automatically use them.
 */

'use strict';

/* ── Get project slug from URL ────────────────────────────── */

function getSlug() {
  return new URLSearchParams(window.location.search).get('p');
}

/* ── Render helpers ───────────────────────────────────────── */

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function placeholderBox(label, cssClass) {
  const div = el('div', cssClass || 'work-key-still');
  div.textContent = label;
  return div;
}

/* ── Render project ───────────────────────────────────────── */

function renderProject(project) {
  const root = document.getElementById('workRoot');
  if (!root) return;

  // ── Back link ──────────────────────────────────────────────
  const back = el('a', 'work-back', '<span class="work-back-arrow">&#8592;</span> Back to work');
  back.href = 'index.html#work';
  root.appendChild(back);

  // ── Title ──────────────────────────────────────────────────
  root.appendChild(el('h1', 'work-title', project.title));

  // ── Meta row ───────────────────────────────────────────────
  const categoryLabel = {
    fiction: 'Fiction',
    commercial: 'Commercial',
    'music-video': 'Music video',
    other: 'Other'
  }[project.category] || project.category;

  const metaParts = [
    project.year,
    categoryLabel,
    project.production,
    project.duration
  ];
  const meta = el('p', 'work-meta');
  meta.innerHTML = metaParts
    .map(p => `<span>${p}</span>`)
    .join(' <span class="work-meta-sep">·</span> ');
  root.appendChild(meta);

  // ── Key still ──────────────────────────────────────────────
  if (project.imageSrc) {
    const img = el('img', 'work-key-still');
    img.src = project.imageSrc;
    img.alt = `Key still — ${project.title}`;
    img.style.objectFit = 'cover';
    root.appendChild(img);
  } else {
    root.appendChild(
      placeholderBox(`[Key still — ${project.title.toUpperCase()}]`, 'work-key-still')
    );
  }

  // ── Logline ────────────────────────────────────────────────
  root.appendChild(el('p', 'work-logline', project.logline));

  // ── Synopsis ───────────────────────────────────────────────
  root.appendChild(el('p', 'work-synopsis', project.synopsis));

  // ── Trailer ────────────────────────────────────────────────
  root.appendChild(el('p', 'work-section-label', 'Trailer'));

  const trailerWrap = el('div', 'work-trailer');
  if (project.trailerUrl) {
    // Build an iframe for Vimeo or YouTube
    const iframe = document.createElement('iframe');
    iframe.src = project.trailerUrl;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    trailerWrap.appendChild(iframe);
  } else {
    trailerWrap.textContent = '[Trailer embed — Vimeo or YouTube]';
  }
  root.appendChild(trailerWrap);

  // ── Stills gallery ─────────────────────────────────────────
  root.appendChild(el('p', 'work-section-label', 'Stills'));

  const gallery = el('div', 'work-gallery');
  const count = project.stillCount || 4;

  for (let i = 0; i < count; i++) {
    const item = el('div', 'work-still-item');
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `View still ${i + 1}`);

    const stillSrc = project.stills && project.stills[i];
    if (stillSrc) {
      const img = document.createElement('img');
      img.src = stillSrc;
      img.alt = `Still ${i + 1} — ${project.title}`;
      item.appendChild(img);
    } else {
      item.textContent = `[Still ${i + 1}]`;
    }

    item.addEventListener('click', () => openLightbox(item, i, project));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(item, i, project);
      }
    });

    gallery.appendChild(item);
  }
  root.appendChild(gallery);

  // ── Festivals ──────────────────────────────────────────────
  if (project.festivals && project.festivals.length) {
    const festWrap = el('div', 'work-festivals');
    festWrap.appendChild(el('p', 'work-section-label', 'Festival selections'));
    const list = el('div', 'festival-list');
    list.innerHTML = project.festivals
      .map(f => `<p>${f}</p>`)
      .join('');
    festWrap.appendChild(list);
    root.appendChild(festWrap);
  }

  // ── Credits ────────────────────────────────────────────────
  if (project.credits && project.credits.length) {
    const credWrap = el('div', 'work-credits');
    credWrap.appendChild(el('p', 'work-section-label', 'Credits'));
    project.credits.forEach(c => {
      const row = el('div', 'credit-row');
      row.appendChild(el('span', 'credit-role', c.role));
      row.appendChild(el('span', 'credit-name', c.name));
      credWrap.appendChild(row);
    });
    root.appendChild(credWrap);
  }

  // ── Watch link ─────────────────────────────────────────────
  if (project.watchUrl) {
    const watchLink = el('a', 'work-watch', `Watch on ${project.watchPlatform}`);
    watchLink.href = project.watchUrl;
    watchLink.target = '_blank';
    watchLink.rel = 'noopener noreferrer';
    root.appendChild(watchLink);
  }

  // ── Page title ─────────────────────────────────────────────
  document.title = `${project.title} — Edward de Jong`;
}

/* ── Lightbox ─────────────────────────────────────────────── */

let lightbox;

function buildLightbox() {
  lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Still enlarged');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    closeLightbox();
  });

  lightbox.appendChild(closeBtn);
  lightbox.addEventListener('click', closeLightbox);
  document.body.appendChild(lightbox);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
}

function openLightbox(item, index, project) {
  if (!lightbox) buildLightbox();

  // Remove previous content (keep close button)
  const closeBtn = lightbox.querySelector('.lightbox-close');
  lightbox.innerHTML = '';
  lightbox.appendChild(closeBtn);

  const stillSrc = project.stills && project.stills[index];

  if (stillSrc) {
    const img = document.createElement('img');
    img.className = 'lightbox-img';
    img.src = stillSrc;
    img.alt = `Still ${index + 1} — ${project.title}`;
    img.addEventListener('click', e => e.stopPropagation());
    lightbox.appendChild(img);
  } else {
    const ph = el('div', 'lightbox-ph', `[Still ${index + 1} — ${project.title.toUpperCase()}]`);
    ph.addEventListener('click', e => e.stopPropagation());
    lightbox.appendChild(ph);
  }

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── 404 fallback ─────────────────────────────────────────── */

function renderNotFound() {
  const root = document.getElementById('workRoot');
  if (!root) return;

  root.innerHTML = `
    <a class="work-back" href="index.html#work">
      <span class="work-back-arrow">&#8592;</span> Back to work
    </a>
    <h1 class="work-title">Project not found</h1>
    <p style="color: var(--muted); margin-top: 1rem;">
      This project page doesn't exist yet. Return to the homepage to browse available work.
    </p>
  `;
  document.title = 'Project not found — Edward de Jong';
}

/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const slug    = getSlug();
  const project = PROJECTS.find(p => p.slug === slug);

  if (project) {
    renderProject(project);
  } else {
    renderNotFound();
  }
});
