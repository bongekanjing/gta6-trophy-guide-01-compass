// Leonida Trophy Compass — the entry program for gta6-trophy-guide-01.
//
// The guide itself is app/: plain static files (index.html, app.js, style.css
// and data/trophies.json) that a browser opens with no build step and no
// network. This program hands it in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there,
// built with buildDossier from the vendored make.fun library.
//
// The output directory is /output in the grader. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for it:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Node 22+, standard library only. The run is deterministic: the same
// repository always writes the same bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps: at most 4 screenshots of 256 KiB each, at most 993
// files and 48 MiB under app/, and the dossier's text budget.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
