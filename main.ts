// Ember Vault — a stealth game for make.fun's best-stealth-game-20261121-1759.
// Runs on Node 22 with the standard library only. It hands the entry in by
// copying this repository's game/ and screenshots/ into the output directory
// and writing /output/dossier.json with the vendored make.fun library, so the
// sealed scorer can check the game and the judge can read its dossier.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The grader runs this program as nobody in a fresh container, so the output
// directory may already exist but belong to someone else: only create it when
// it is missing, and clear its contents (never the directory itself).
if (!existsSync(out)) mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) rmSync(join(out, entry), { recursive: true, force: true });

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps: text capped at 160 KiB, at most 4 screenshots of 256 KiB,
// game/ within 993 files and 48 MiB, every game path under 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
