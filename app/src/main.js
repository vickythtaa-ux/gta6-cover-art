// Sunset Cover Studio — the editor.
//
// Three panels, each with its own photo (a file from the user's machine or
// one of the two sample photos), a caption, a colour theme and three export
// sizes. Photos are read locally with FileReader / object URLs and are never
// uploaded anywhere. Drag a panel in the preview to pan its photo, scroll
// over it to zoom; the sliders do the same thing precisely.

import { drawCover, panelsFor, pointInPolygon, SIZES, THEMES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');

const state = {
  sizeKey: 'square',
  theme: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'Neon nights on the boulevard',
  panels: [
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selected = 0;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function currentSize() {
  return SIZES[state.sizeKey];
}

function redraw() {
  const { w, h } = currentSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, {
    panels: state.panels,
    title: state.title,
    subtitle: state.subtitle,
    theme: state.theme,
  });
  document.querySelectorAll('.panel-card').forEach((card, i) => {
    card.classList.toggle('selected', i === selected);
  });
}

/** Builds the three panel cards (photo, zoom, pan) into #panels. */
function buildPanelCards() {
  const host = document.getElementById('panels');
  host.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const card = document.createElement('section');
    card.className = 'panel-card';
    card.innerHTML = `
      <h3>Panel ${i + 1}</h3>
      <label>Photo <input type="file" accept="image/*" data-panel="${i}"></label>
      <div class="row">
        <button type="button" data-sample="boulevard" data-panel="${i}">Boulevard</button>
        <button type="button" data-sample="pier" data-panel="${i}">Pier</button>
        <button type="button" data-fill-all="${i}">Use in all panels</button>
      </div>
      <label>Zoom <input type="range" min="1" max="3" step="0.05" value="${panel.zoom}" data-zoom="${i}"></label>
      <label>Pan left–right <input type="range" min="-1" max="1" step="0.05" value="${panel.ox}" data-panx="${i}"></label>
      <label>Pan up–down <input type="range" min="-1" max="1" step="0.05" value="${panel.oy}" data-pany="${i}"></label>`;
    card.addEventListener('click', () => { selected = i; redraw(); });
    host.appendChild(card);
  });
  host.addEventListener('change', async (e) => {
    const fileInput = e.target.closest('input[type=file]');
    if (fileInput) {
      const file = fileInput.files[0];
      if (!file) return;
      const i = Number(fileInput.dataset.panel);
      selected = i;
      state.panels[i].img = await loadImage(URL.createObjectURL(file));
      status.textContent = `Panel ${i + 1}: ${file.name} loaded`;
      redraw();
      return;
    }
    const zoom = e.target.closest('input[data-zoom]');
    if (zoom) { state.panels[Number(zoom.dataset.zoom)].zoom = Number(zoom.value); redraw(); return; }
    const panx = e.target.closest('input[data-panx]');
    if (panx) { state.panels[Number(panx.dataset.panx)].ox = Number(panx.value); redraw(); return; }
    const pany = e.target.closest('input[data-pany]');
    if (pany) { state.panels[Number(pany.dataset.pany)].oy = Number(pany.value); redraw(); }
  });
  host.addEventListener('click', async (e) => {
    const sample = e.target.closest('button[data-sample]');
    if (sample) {
      const i = Number(sample.dataset.panel);
      selected = i;
      state.panels[i].img = await loadImage(`samples/${sample.dataset.sample}.jpg`);
      status.textContent = `Panel ${i + 1}: sample ${sample.dataset.sample} loaded`;
      redraw();
      return;
    }
    const fillAll = e.target.closest('button[data-fill-all]');
    if (fillAll) {
      const src = state.panels[Number(fillAll.dataset.fillAll)];
      if (!src.img) { status.textContent = 'Load a photo in this panel first'; return; }
      state.panels.forEach((p) => { p.img = src.img; });
      status.textContent = 'One photo now fills all three panels';
      redraw();
    }
  });
}

// Size, theme and caption controls.
document.querySelectorAll('input[name=size]').forEach((radio) => {
  radio.addEventListener('change', () => { state.sizeKey = radio.value; redraw(); });
});
document.getElementById('theme').addEventListener('change', (e) => {
  state.theme = e.target.value;
  redraw();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// Drag to pan the panel under the pointer; wheel to zoom it.
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const panels = panelsFor(canvas.width, canvas.height);
  const hit = panels.findIndex((poly) => pointInPolygon(p.x, p.y, poly));
  if (hit === -1) return;
  selected = hit;
  drag = { panel: hit, x: p.x, y: p.y, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[drag.panel];
  panel.ox = Math.max(-1, Math.min(1, drag.ox + (p.x - drag.x) / (canvas.width * 0.25)));
  panel.oy = Math.max(-1, Math.min(1, drag.oy + (p.y - drag.y) / (canvas.height * 0.25)));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
  redraw();
}, { passive: false });

// Export: draw the cover at full size on a fresh canvas and save it.
document.getElementById('export').addEventListener('click', () => {
  const { w, h } = currentSize();
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  drawCover(out, {
    panels: state.panels,
    title: state.title,
    subtitle: state.subtitle,
    theme: state.theme,
  });
  out.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${w}x${h}.png`;
    a.click();
    window.__lastExport = { w, h, bytes: blob.size };
    status.textContent = `Saved cover-${w}x${h}.png (${Math.round(blob.size / 1024)} KiB)`;
  }, 'image/png');
});

// Exposed for the shot scenes and for browser tests.
window.__studio = {
  state,
  redraw,
  async loadSample(name, panelIndex) {
    const img = await loadImage(`samples/${name}.jpg`);
    state.panels[panelIndex].img = img;
    redraw();
    return img;
  },
};

buildPanelCards();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, window.__studio);
} else {
  // Default scene: the two sample photos already in place.
  Promise.all([
    window.__studio.loadSample('pier', 0),
    window.__studio.loadSample('boulevard', 1),
    window.__studio.loadSample('pier', 2),
  ]).catch(() => { status.textContent = 'Sample photos failed to load'; });
}
