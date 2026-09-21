/**
 * AGORA LENS — deployment build
 *
 * Assembles dist/ from the site files plus the freshly published snapshot.
 *
 * Explicitly lists what ships rather than excluding what doesn't. An allow-list
 * cannot accidentally publish a new file someone drops in the repo root — which
 * matters here, because the repo also holds the backend scripts and the SQL
 * that describes the database.
 *
 *   node build.mjs
 */

import { cpSync, existsSync, mkdirSync, rmSync, statSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, 'dist');

// Everything the browser needs, and nothing else.
const SHIP = [
  'index.html',
  'manifest.json',
  'sw.js',
  'css',
  'js',
  'Assets',
  'data'
];

// Present in the source tree but never served.
const NEVER_SHIP = ['backend', '.env', 'node_modules', '.git'];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

let copied = 0;
for (const entry of SHIP) {
  const from = resolve(root, entry);

  if (!existsSync(from)) {
    // data/agora.json is generated; everything else missing is a real problem.
    if (entry === 'data') {
      console.warn('  ! data/ missing — the site will fall back to the bundled dataset');
      continue;
    }
    throw new Error(`Missing required file: ${entry}`);
  }

  cpSync(from, join(dist, entry), { recursive: true });
  copied += 1;
}

// The snapshot is the whole point of the build step; say plainly whether the
// deploy will carry live data or quietly fall back to the bundled copy.
const snapshot = join(dist, 'data', 'agora.json');
if (existsSync(snapshot)) {
  const { size } = statSync(snapshot);
  console.log(`  snapshot: ${(size / 1024).toFixed(0)} KB`);
} else {
  console.warn('  ! no snapshot — deploying with the bundled fallback data');
}

// A README dropped in data/ would be harmless; a stray .env would not be.
for (const banned of NEVER_SHIP) {
  if (existsSync(join(dist, banned))) {
    throw new Error(`${banned} must not be deployed — check the SHIP list`);
  }
}

const count = (dir) => readdirSync(dir, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? count(join(dir, e.name)) : 1), 0);

console.log(`  dist/: ${copied} entries, ${count(dist)} files`);
