// main.ts — Sizzle & Serve entry builder (Node 22 stdlib only).
// Copies game/ and screenshots/ beside this file into the output dir and
// writes dossier.json with the kit's buildDossier. No network, no deps.
import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  console.error('sizzle-serve build failed: ' + message);
  process.exit(1);
}

function copyTree(name: string): void {
  const src = join(HERE, name);
  const dst = join(OUT, name);
  if (!existsSync(src)) fail('missing ' + name + '/ beside main.ts');
  if (!statSync(src).isDirectory()) fail(name + ' is not a directory');
  cpSync(src, dst, { recursive: true });
  console.log('copied ' + name + '/ -> ' + dst);
}

// main.ts (part 2) — build the output dir, then the dossier.
mkdirSync(OUT, { recursive: true });
copyTree('game');
copyTree('screenshots');

const dossier = buildDossier(OUT, CAPS);
writeFileSync(join(OUT, 'dossier.json'), dossier);
console.log('wrote ' + join(OUT, 'dossier.json') + ' (' + dossier.length + ' bytes)');
console.log('sizzle-serve build OK');
