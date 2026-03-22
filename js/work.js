/*
 * work.js — Project detail page
 *
 * Flow:
 *   1. Read ?p=[slug] from the URL
 *   2. Find the matching project in PROJECTS (js/data.js)
 *   3. Fetch /content/work/[slug].md — the CMS-managed file
 *   4. Parse its YAML frontmatter (thumbnail, description, gallery)
 *   5. Merge CMS content over the base project data (CMS takes precedence)
 *   6. Render the page
 *
 * To add real content via the CMS:
 *   Visit /admin, log in, select the project, upload images and write a
 *   description, drag stills into the desired order, and save.
 *   The CMS commits to GitHub — the page updates automatically.
 *
 * To add real content manually (without the CMS):
 *   Edit content/work/[slug].md directly.
 */

'use strict';

/* ── Get slug from URL ────────────────────────────────────── */

function getSlug() {
  return new URLSearchParams(window.location.search).get('p');
}

/* ── Fetch & parse CMS markdown file ─────────────────────── */

async function fetchCmsContent(slug) {
  try {
    const res = await fetch(`/content/work/${slug}.md`);
    if (!res.ok) return null;
    const text = await res.text();
    return parseFrontmatter(text);
  } catch {
    return null;
  }
}

function parseFrontmatter(text) {
  // Match the YAML block between the two --- fences
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return window.jsyaml.load(match[1]) || {};
  } catch (e) {
    console.warn('[work.js] Frontmatter parse error:', e);
    return {};
  }
}

/* ── DOM helpers ──────────────────────────────────────────── */

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function phBox(label, cssClass) {
  const div = el('div', cssClass || 'work-key-still');
  div.textContent = label;
  return div;
}

/* ── Render ───────────────────────────────────────────────── */

function renderProject(project) {
  const root = document.getElementById('workRoot');
  if (!root) return;

  // ── Back link ────────────────────────────────────────────
  const back = el('a', 'work-back',
    '<span class="work-back-arrow">&#8592;</span> Back to work');
  back.href = 'index.html#work';
  root.appendChild(back);

  // ── Title ────────────────────────────────────────────────
  root.appendChild(el('h1', 'work-title', project.title));

  // ── Meta row ─────────────────────────────────────────────
  const catLabel = {
    fiction:       'Fiction',
    commercial:    'Commercial',
    'music-video': 'Music video',
    other:         'Other'
  }[project.category] || project.category;

  const meta = el('p', 'work-meta');
  meta.innerHTML = [project.year, catLabel, project.production, project.duration]
    .map(p => `<span>${p}</span>`)
    .join(' <span class="work-meta-sep">·</span> ');
  root.appendChild(meta);

  // ── Key still ────────────────────────────────────────────
  // CMS thumbnail → data.js imageSrc → placeholder
  const thumbSrc = project.thumbnail || project.imageSrc || null;
  if (thumbSrc) {
    const img = document.createElement('img');
    img.className = 'work-key-still';
    img.src = thumbSrc;
    img.alt = `Key still — ${project.title}`;
    img.style.objectFit = 'cover';
    root.appendChild(img);
  } else {
    root.appendChild(phBox(`[Key still — ${project.title.toUpperCase()}]`, 'work-key-still'));
  }

  // ── Logline ──────────────────────────────────────────────
  root.appendChild(el('p', 'work-logline', project.logline));

  // ── Synopsis / description ───────────────────────────────
  // CMS description → data.js synopsis
  const synText = project.cmsDescription || project.synopsis;
  const synEl = el('p', 'work-synopsis');
  synEl.textContent = synText;
  root.appendChild(synEl);

  // ── Trailer ──────────────────────────────────────────────
  root.appendChild(el('p', 'work-section-label', 'Trailer'));
  const trailerWrap = el('div', 'work-trailer');
  if (project.trailerUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = project.trailerUrl;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    trailerWrap.appendChild(iframe);
  } else {
    trailerWrap.textContent = '[Trailer embed — Vimeo or YouTube]';
  }
  root.appendChild(trailerWrap);

  // ── Gallery ──────────────────────────────────────────────
  // CMS gallery array (ordered, with optional captions) takes priority.
  // Falls back to data.js stills or placeholder boxes.
  root.appendChild(el('p', 'work-section-label', 'Stills'));
  const galleryEl = el('div', 'work-gallery');

  const cmsGallery = project.gallery; // [{image, caption}, ...] from CMS

  if (cmsGallery && cmsGallery.length) {
    // ── CMS gallery — respects the order set in the admin ──
    cmsGallery.forEach((item, i) => {
      const figure = document.createElement('figure');
      figure.className = 'work-still-figure';

      const stillEl = el('div', 'work-still-item');
      stillEl.setAttribute('role', 'button');
      stillEl.setAttribute('tabindex', '0');
      stillEl.setAttribute('aria-label', item.caption || `View still ${i + 1}`);

      if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.caption || `Still ${i + 1} — ${project.title}`;
        stillEl.appendChild(img);
      } else {
        stillEl.textContent = `[Still ${i + 1}]`;
      }

      stillEl.addEventListener('click', () => openLightbox(i, cmsGallery, project.title));
      stillEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(i, cmsGallery, project.title);
        }
      });

      figure.appendChild(stillEl);
      if (item.caption) {
        figure.appendChild(el('figcaption', 'work-still-caption', item.caption));
      }
      galleryEl.appendChild(figure);
    });

  } else {
    // ── Fallback: data.js stills or placeholder boxes ───────
    const count = project.stillCount || 4;
    for (let i = 0; i < count; i++) {
      const stillEl = el('div', 'work-still-item');
      stillEl.setAttribute('role', 'button');
      stillEl.setAttribute('tabindex', '0');
      stillEl.setAttribute('aria-label', `View still ${i + 1}`);

      const src = project.stills && project.stills[i];
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Still ${i + 1} — ${project.title}`;
        stillEl.appendChild(img);
      } else {
        stillEl.textContent = `[Still ${i + 1}]`;
      }

      stillEl.addEventListener('click', () => openLightbox(i, null, project.title, project.stills));
      stillEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(i, null, project.title, project.stills);
        }
      });
      galleryEl.appendChild(stillEl);
    }
  }

  root.appendChild(galleryEl);

  // ── Festival selections ───────────────────────────────────
  if (project.festivals && project.festivals.length) {
    const festWrap = el('div', 'work-festivals');
    festWrap.appendChild(el('p', 'work-section-label', 'Festival selections'));
    const list = el('div', 'festival-list');
    list.innerHTML = project.festivals.map(f => `<p>${f}</p>`).join('');
    festWrap.appendChild(list);
    root.appendChild(festWrap);
  }

  // ── Credits ───────────────────────────────────────────────
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

  // ── Watch link ────────────────────────────────────────────
  if (project.watchUrl) {
    const link = el('a', 'work-watch', `Watch on ${project.watchPlatform}`);
    link.href = project.watchUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    root.appendChild(link);
  }

  document.title = `${project.title} — Edward de Jong`;
}

/* ── Lightbox ─────────────────────────────────────────────── */

let lightbox;

function buildLightbox() {
  lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });

  lightbox.appendChild(closeBtn);
  lightbox.addEventListener('click', closeLightbox);
  document.body.appendChild(lightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

/**
 * openLightbox
 * @param {number} index       - which still to show
 * @param {Array|null} gallery - CMS gallery array [{image, caption}, ...]
 * @param {string} title       - project title (for alt text)
 * @param {Array|null} stills  - fallback stills array [srcString, ...]
 */
function openLightbox(index, gallery, title, stills) {
  if (!lightbox) buildLightbox();

  const closeBtn = lightbox.querySelector('.lightbox-close');
  lightbox.innerHTML = '';
  lightbox.appendChild(closeBtn);

  const src     = gallery ? gallery[index]?.image    : (stills && stills[index]);
  const caption = gallery ? gallery[index]?.caption  : null;

  if (src) {
    const img = document.createElement('img');
    img.className = 'lightbox-img';
    img.src = src;
    img.alt = caption || `Still ${index + 1} — ${title}`;
    img.addEventListener('click', e => e.stopPropagation());
    lightbox.appendChild(img);

    if (caption) {
      const cap = el('p', 'lightbox-caption', caption);
      cap.addEventListener('click', e => e.stopPropagation());
      lightbox.appendChild(cap);
    }
  } else {
    const ph = el('div', 'lightbox-ph', `[Still ${index + 1} — ${title.toUpperCase()}]`);
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
      No project found for this URL. Return to the homepage to browse available work.
    </p>
  `;
  document.title = 'Not found — Edward de Jong';
}

/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  const slug    = getSlug();
  const project = PROJECTS.find(p => p.slug === slug);

  if (!project) {
    renderNotFound();
    return;
  }

  // Fetch CMS-managed content (may be null if file is empty or missing)
  const cms = await fetchCmsContent(slug);

  // Merge: CMS fields take precedence over data.js defaults
  const merged = {
    ...project,
    thumbnail:      cms?.thumbnail                              || null,
    cmsDescription: (cms?.description && cms.description.trim()) ? cms.description : null,
    // Only use CMS gallery if it has at least one item with an image
    gallery:        (cms?.gallery?.some(g => g.image))           ? cms.gallery : null,
  };

  renderProject(merged);
});
