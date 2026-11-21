// Vice Cover Studio — entrypoint (Node 22, standard library only). It copies
// app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library. Outside the
// grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function main() {
  if (!existsSync(join(here, 'app', 'index.html'))) {
    throw new Error('app/index.html: no such file');
  }
  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
  const shots = join(here, 'screenshots');
  if (!existsSync(shots)) throw new Error('screenshots/: no such directory');
  const images = readdirSync(shots).filter((n) => !n.startsWith('.'));
  if (images.length < 3) throw new Error(`screenshots/: only ${images.length} images, need at least 3`);
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(shots, join(out, 'screenshots'), { recursive: true });
  writeFileSync(
    join(out, 'dossier.json'),
    buildDossier(out, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      app_max_files: 993,
      app_max_bytes: 50331648,
      app_path_max_bytes: 1000,
    }),
  );
}

main();
