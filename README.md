# Sunset Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/vickythtaa-ux/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/vickythtaa-ux/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photos into a three-panel sunset poster cover, in the style of a
crime-game cover: slanted panels, a synthwave sun, a neon title band and bold
display lettering. Everything runs offline in your browser — photos are read
on your machine and never uploaded.

## What it does

- **Three panels, three photos** — load a photo into each panel from your
  machine, or use the two sample photos (a boulevard at sunset, a pier).
  One button fills all three panels with a single photo.
- **Crop and position each photo** — drag a panel in the preview to pan its
  photo, scroll over it to zoom, or use the zoom and pan sliders.
- **Caption it** — a big italic display title and a letter-spaced neon
  subtitle, in three colour themes (Sunset, Neon Pink, Teal Night).
- **Export in one click** — 1080 × 1080, 1080 × 1350 or 1920 × 1080 PNG,
  drawn at full size on a canvas and saved with `canvas.toBlob`.

The art is original: the panels, sun, lettering and colour grade are drawn
in code. No game logo, artwork or font is used anywhere — lettering is bold
system font stacks only.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Node 22 or later, no install, no build step.

## How it is built

- `app/index.html` — the editor page.
- `app/style.css` — the dark editor chrome.
- `app/src/cover.js` — the cover renderer: panels, sun, sunset grade,
  title band and display lettering.
- `app/src/main.js` — the editor wiring: photo loading, panel cards,
  drag-to-pan, wheel zoom, export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor` and
  `?shot=cover`).
- `app/samples/` — the two sample photos, made with an image model for
  make.fun and free to use.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored make.fun
  library.
- `screenshots/` — the cover and the editor at work (the first by name is
  the cover).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
