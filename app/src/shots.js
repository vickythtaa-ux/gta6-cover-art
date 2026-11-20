// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the cover alone, full-bleed.
// Query knobs: size=square|portrait|wide, caption=<title>,
// subtitle=<subtitle>, theme=sunset|neon|teal, photos=pier,boulevard,pier.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, studio) {
  const { state, redraw, loadSample } = studio;
  const sizeKey = query.get('size') ?? 'square';
  if (['square', 'portrait', 'wide'].includes(sizeKey)) {
    state.sizeKey = sizeKey;
    const radio = document.querySelector(`input[name=size][value="${sizeKey}"]`);
    if (radio) radio.checked = true;
  }
  const title = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Neon nights on the boulevard';
  state.title = title;
  state.subtitle = subtitle;
  document.getElementById('title').value = title;
  document.getElementById('subtitle').value = subtitle;
  const theme = query.get('theme') ?? 'sunset';
  if (['sunset', 'neon', 'teal'].includes(theme)) {
    state.theme = theme;
    document.getElementById('theme').value = theme;
  }
  const photos = (query.get('photos') ?? 'pier,boulevard,pier').split(',');
  await Promise.all(photos.map((name, i) => loadSample(name.trim(), i)));
  if (shot === 'cover') document.body.classList.add('shot-cover');
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
