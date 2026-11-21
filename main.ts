// Leonida Trophy Compass — the entry program (Node 22, standard library only).
// The guide itself is plain static files under app/ (index.html, app.js,
// style.css, data/trophies.json) that open in a browser and work offline.
// This program hands it in: it copies app/ and screenshots/ from beside
// this file into the output directory and writes /output/dossier.json with
// the vendored make.fun library. vendor/makefun-frontend.ts is the kit's
// copy, unchanged — the scorer rebuilds the dossier with its own copy and
// compares the two byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail early with a clear message when the screenshots are missing: the
// scorer refuses an entry with no cover image, and a late failure here
// would be harder to read than this one.
if (!existsSync(join(here, 'screenshots')) || !existsSync(join(here, 'app', 'data', 'trophies.json'))) {
  throw new Error('Leonida Trophy Compass: screenshots/ or app/data/trophies.json is missing — take the screenshots first, then hand the entry in.');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the other limits refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; more than 993 files and
// directories in app/ or 48 MiB of app files — app/ counts beside /output's
// own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Leonida Trophy Compass handed in to ${out}`);

// A one-line summary of what was handed in, for the run log.
const dossier = JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf8'));
console.log(`dossier: ${(dossier.text?.length ?? 0).toLocaleString()} bytes of text, ${(dossier.images?.length ?? 0)} screenshots`);
