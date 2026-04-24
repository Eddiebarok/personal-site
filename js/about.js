/*
 * about.js — About page
 *
 * 1. Loads portrait photo and bio text from content/homepage.json (CMS-managed)
 * 2. Reads the visible field from each project's content/work/[slug].md
 *    and hides any CV row whose project has visible: false
 * 3. Initialises the CV tab switcher
 */

'use strict';

/* ── Minimal markdown renderer ──────────────────────────── */
// Handles *italic* and paragraph breaks from the CMS markdown widget.

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

/* ── Load CMS content ───────────────────────────────────── */

async function loadAboutContent() {
  let data;
  try {
    const res = await fetch('/content/homepage.json');
    if (!res.ok) return;
    data = await res.json();
  } catch {
    return; // fail silently — hardcoded HTML is the fallback
  }

  // Portrait
  if (data.portrait) {
    const container = document.getElementById('portrait-container');
    if (container) {
      container.innerHTML = '';
      container.className = 'portrait-live';
      const img = document.createElement('img');
      img.src = data.portrait;
      img.alt = 'Portrait — Edward de Jong';
      container.appendChild(img);
    }
  }

  // About bio
  if (data.about_bio) {
    const el = document.getElementById('about-bio');
    if (el) el.innerHTML = renderMarkdown(data.about_bio);
  }
}

/* ── CV visibility ──────────────────────────────────────── */
// Each CV row with a data-slug attribute is linked to a project.
// If that project has visible: false its CV row is hidden.

async function applyVisibility() {
  const items = Array.from(document.querySelectorAll('[data-slug]'));
  if (!items.length) return;

  // De-duplicate slugs so we only fetch each file once
  const slugs = [...new Set(items.map(el => el.dataset.slug))];

  // Fetch all markdown files in parallel
  const texts = await Promise.all(
    slugs.map(slug =>
      fetch(`/content/work/${slug}.md`)
        .then(r => r.ok ? r.text() : null)
        .catch(() => null)
    )
  );

  // Build slug → visible map
  const visible = {};
  slugs.forEach((slug, i) => {
    const text = texts[i];
    if (!text) { visible[slug] = true; return; }
    const match = text.match(/^visible:\s*(true|false)/m);
    visible[slug] = !match || match[1] !== 'false';
  });

  // Hide rows for non-visible projects
  items.forEach(item => {
    if (!visible[item.dataset.slug]) {
      item.style.display = 'none';
    }
  });
}

/* ── CV tabs ────────────────────────────────────────────── */

function initCvTabs() {
  const tabs   = Array.from(document.querySelectorAll('.cv-tab'));
  const panels = Array.from(document.querySelectorAll('.cv-panel'));
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

/* ── Init ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  initCvTabs();
  await Promise.all([
    loadAboutContent(),
    applyVisibility()
  ]);
});
