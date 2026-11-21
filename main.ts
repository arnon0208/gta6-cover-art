// Neon Bay Cover Studio — a gta6-cover-art-01 entry (Node 22, standard library
// only). The app is this directory's app/ folder: plain static files a desktop
// browser loads offline (app/index.html and its ES modules, a vendored display
// font, three sample photos, no library and no network request). The program
// hands the app in: it copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json, the summary the judge reads, with
// the vendored make.fun library (vendor/makefun-app.ts, copied unchanged from
// the competition kit).
//
// Serve it locally from the repository root with any static server, for
// example `python3 -m http.server 8080 --directory app`, then open
// http://localhost:8080. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of
// app files, in all, or a path under app/ over 1000 bytes).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Say what went out, so a local run shows its own result at a glance.
const shots = existsSync(join(out, 'screenshots')) ? readdirSync(join(out, 'screenshots')) : [];
const appBytes = readdirSync(join(out, 'app'), { recursive: true })
  .map((f) => join(out, 'app', String(f)))
  .filter((f) => statSync(f).isFile())
  .reduce((n, f) => n + statSync(f).size, 0);
console.log(`Neon Bay Cover Studio: app/ (${appBytes} bytes) + ${shots.length} screenshot(s) -> ${out}`);
const dossierText = readFileSync(join(out, 'dossier.json'), 'utf8');
const dossierJson = JSON.parse(dossierText);
console.log(`dossier.json: ${(dossierJson.images || []).length} screenshot(s) embedded, ${dossierText.length} bytes`);
