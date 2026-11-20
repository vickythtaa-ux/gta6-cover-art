// Sunset Cover Studio — the cover renderer.
//
// Draws a multi-panel poster cover onto a canvas: each panel holds one of the
// user's photos (cover-fit, pannable, zoomable), a synthwave sun sits in the
// first panel's top corner, and a slanted black band at the foot carries the
// bold title and subtitle. No image ever leaves the machine:
// photos are drawn from <img> elements the editor built from local files.
//
// All lettering uses bold system font stacks only — no downloaded fonts, no
// game artwork, no logos. Everything drawn here is original.

export const THEMES = {
  sunset: { glow: '#ff7a18', neon: '#ff2e88', pale: '#ffd166', sky: '#ff9a3d' },
  neon: { glow: '#ff2e88', neon: '#7b2fff', pale: '#00e5ff', sky: '#ff5da2' },
  teal: { glow: '#00e5ff', neon: '#0077ff', pale: '#7dffce', sky: '#2dd4bf' },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080 (square)' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350 (portrait)' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080 (wide)' },
};

/** Panels for a canvas of w × h: three slanted polygons, like a poster. */
export function panelsFor(w, h) {
  if (w === h) {
    return [
      [[0, 0], [0.6 * w, 0], [0.54 * w, h], [0, h]],
      [[0.62 * w, 0], [w, 0], [w, 0.47 * h], [0.56 * w, 0.47 * h]],
      [[0.56 * w, 0.5 * h], [w, 0.5 * h], [w, h], [0.52 * w, h]],
    ];
  }
  if (h > w) {
    return [
      [[0, 0], [w, 0], [w, 0.56 * h], [0, 0.6 * h]],
      [[0, 0.62 * h], [0.48 * w, 0.58 * h], [0.48 * w, h], [0, h]],
      [[0.52 * w, 0.58 * h], [w, 0.56 * h], [w, h], [0.52 * w, h]],
    ];
  }
  return [
    [[0, 0], [0.4 * w, 0], [0.36 * w, h], [0, h]],
    [[0.42 * w, 0], [0.68 * w, 0], [0.64 * w, h], [0.38 * w, h]],
    [[0.7 * w, 0], [w, 0], [w, h], [0.66 * w, h]],
  ];
}

/** True when point (x, y) lies inside the polygon (ray casting). */
export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function tracePoly(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

function polyBox(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
}

/** Draws one photo cover-fit inside a panel polygon, with zoom and pan. */
function drawPanelPhoto(ctx, img, poly, zoom, ox, oy) {
  const box = polyBox(poly);
  const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = box.x + box.w / 2 + ox * box.w * 0.25;
  const cy = box.y + box.h / 2 + oy * box.h * 0.25;
  ctx.save();
  tracePoly(ctx, poly);
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

/** A synthwave sun: gradient disc with horizontal slits, clipped to a panel. */
function drawSun(ctx, poly, theme) {
  const box = polyBox(poly);
  // Tucked into the panel's top corner, over sky rather than over a face.
  const cx = box.x + box.w * 0.16;
  const cy = box.y + box.h * 0.15;
  const r = Math.min(box.w, box.h) * 0.13;
  ctx.save();
  tracePoly(ctx, poly);
  ctx.clip();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.9);
  glow.addColorStop(0, theme.glow + 'aa');
  glow.addColorStop(1, theme.glow + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#fff3b0');
  disc.addColorStop(0.45, theme.sky);
  disc.addColorStop(1, theme.neon);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 8, 30, 0.85)';
  for (let i = 0; i < 3; i++) {
    const sy = cy + r * (0.08 + i * 0.26);
    const half = Math.sqrt(Math.max(0, r * r - (sy - cy) * (sy - cy)));
    ctx.fillRect(cx - half, sy, half * 2, r * 0.05);
  }
  ctx.restore();
}

/** Fits one line of bold display type inside maxWidth, returning its size. */
function fitTitle(ctx, text, maxWidth, startSize, fontStack) {
  let size = startSize;
  const set = () => { ctx.font = `italic 900 ${size}px ${fontStack}`; };
  set();
  while (ctx.measureText(text).width > maxWidth && size > 16) {
    size -= 2;
    set();
  }
  return size;
}

const DISPLAY = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

/**
 * Draws the whole cover onto `canvas` (which must already be the export
 * size). `state` is { panels: [{img, zoom, ox, oy}...], title, subtitle,
 * theme } where theme is a key of THEMES.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const theme = THEMES[state.theme] ?? THEMES.sunset;
  const panels = panelsFor(w, h);

  ctx.fillStyle = '#12081d';
  ctx.fillRect(0, 0, w, h);

  state.panels.forEach((panel, i) => {
    if (panel.img) drawPanelPhoto(ctx, panel.img, panels[i], panel.zoom, panel.ox, panel.oy);
    else {
      ctx.save();
      tracePoly(ctx, panels[i]);
      ctx.clip();
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#3d1c54');
      g.addColorStop(1, '#12081d');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  });

  // Sunset grade over the whole poster, then a vignette.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const grade = ctx.createLinearGradient(0, 0, 0, h);
  grade.addColorStop(0, 'rgba(255, 190, 80, 0.28)');
  grade.addColorStop(0.55, 'rgba(255, 90, 120, 0.22)');
  grade.addColorStop(1, 'rgba(120, 40, 180, 0.30)');
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10, 4, 18, 0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  drawSun(ctx, panels[0], theme);

  // Panel gutters: thick black seams with a thin pale edge.
  for (const poly of panels) {
    ctx.save();
    tracePoly(ctx, poly);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0b0512';
    ctx.lineWidth = Math.max(8, w * 0.008);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.stroke();
    ctx.restore();
  }

  // Slanted title band at the foot.
  const bandTop = h * 0.76;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, bandTop + h * 0.02);
  ctx.lineTo(w, bandTop - h * 0.015);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(8, 3, 14, 0.88)';
  ctx.fill();
  ctx.strokeStyle = theme.neon;
  ctx.lineWidth = Math.max(3, h * 0.004);
  ctx.beginPath();
  ctx.moveTo(0, bandTop + h * 0.02);
  ctx.lineTo(w, bandTop - h * 0.015);
  ctx.stroke();
  // Halftone dots along the band's top edge.
  ctx.fillStyle = theme.pale;
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = 0.35 + (i % 3) * 0.15;
    ctx.beginPath();
    ctx.arc(w * (0.04 + i * 0.068), bandTop + h * 0.03, Math.max(2, w * 0.003), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Title: huge italic display caps, gradient fill, heavy black outline.
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const size = fitTitle(ctx, title, w * 0.9, h * 0.115, DISPLAY);
    const ty = h * 0.9;
    const grad = ctx.createLinearGradient(0, ty - size, 0, ty);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, theme.pale);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0b0512';
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(title, w / 2, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, w / 2, ty);
    ctx.restore();
  }

  // Subtitle: letter-spaced neon caps under the title.
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (subtitle) {
    ctx.save();
    ctx.textAlign = 'center';
    try { ctx.letterSpacing = `${Math.max(2, w * 0.004)}px`; } catch { /* older canvas: no tracking */ }
    const subSize = Math.max(14, h * 0.028);
    ctx.font = `700 ${subSize}px ${DISPLAY}`;
    ctx.fillStyle = theme.neon;
    ctx.shadowColor = theme.neon;
    ctx.shadowBlur = subSize * 0.6;
    ctx.fillText(subtitle, w / 2, h * 0.965);
    ctx.restore();
  }
}
