// Sunset Cover Studio — the entry program for gta6-cover-art-01.
//
// The app is plain static files under app/ (index.html plus its own ES
// modules, styles and the two sample photos; no build step, no network).
// This program hands it in: it copies app/ and screenshots/ from beside
// this file into the output directory and writes /output/dossier.json with
// the vendored make.fun library, so the scorer can compare it byte for
// byte with the dossier it builds itself.
//
// Node 22, standard library only: no network, no wall clock, no files
// outside this repository. The output is deterministic — two runs write
// the same bytes — because the copy is a fresh one every time and the
// dossier is a pure function of the files copied.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  throw new Error(`main.ts: ${message}`);
}

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shots.length < 3 || shots.length > 4) fail(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
for (const name of shots) {
  const bytes = statSync(join(shotsDir, name));
  if (bytes.size > 262144) fail(`screenshots/${name} is over 256 KiB`);
  if (!/^[A-Za-z0-9._-]+$/.test(name)) fail(`screenshots/${name} has an unsafe name`);
}

// A fresh output directory, so nothing stale survives from an earlier run.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// The scorer's own caps (from the kit's gate): only text_max_bytes shapes
// the dossier's bytes; the other caps refuse an entry the scorer would
// refuse, so passing them here fails loudly instead of silently.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`wrote ${shots.length} screenshots and dossier.json to ${outDir}`);
