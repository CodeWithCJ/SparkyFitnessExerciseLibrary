// Copies the compiled catalog, translations and the media it references into
// docs/src/public so the VitePress site can serve them. Run by the docs scripts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'docs/src/public');

function copy(rel, destRel = rel) {
  const src = path.resolve(root, rel);
  const dest = path.resolve(pub, destRel);
  if (!src.startsWith(root + path.sep) || !dest.startsWith(pub + path.sep)) {
    throw new Error(`Refusing to copy outside the repository: ${rel}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

for (const dir of ['data', 'locales', 'exercises']) {
  fs.rmSync(path.join(pub, dir), { recursive: true, force: true });
}

copy('dist/exercises.json', 'data/exercises.json');

const langs = fs.readdirSync(path.join(root, 'locales')).filter((l) =>
  fs.existsSync(path.join(root, 'locales', l, 'exercises.json'))
);
for (const l of langs) copy(`locales/${l}/exercises.json`);

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'dist/exercises.json'), 'utf8'));
const files = new Set();
for (const e of catalog) {
  for (const value of Object.values(e.media ?? {})) {
    if (typeof value === 'string' && value.startsWith('exercises/')) files.add(value);
  }
}
for (const f of files) copy(f);

console.log(`Site data ready: ${catalog.length} exercises, ${langs.length} languages, ${files.size} media files.`);
