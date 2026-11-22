import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ID_PATTERN } from './lib/catalog.mjs';
import { discoverMedia } from './lib/media-discovery.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const exercisesDir = path.join(rootDir, 'exercises');
const localesDir = path.join(rootDir, 'locales');
const distDir = path.join(rootDir, 'dist');
const taxonomyDir = path.join(rootDir, 'taxonomy');

const validMuscles = new Set(JSON.parse(fs.readFileSync(path.join(taxonomyDir, 'muscles.json'), 'utf8')));
const validEquipment = new Set(JSON.parse(fs.readFileSync(path.join(taxonomyDir, 'equipment.json'), 'utf8')));
const validModalities = new Set(JSON.parse(fs.readFileSync(path.join(taxonomyDir, 'modalities.json'), 'utf8')));

console.log('🏋️  Building SparkyFitness Exercise Library...\n');

if (!fs.existsSync(exercisesDir)) {
  console.error(`❌ Exercises directory not found at ${exercisesDir}`);
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });

const exerciseFolders = fs
  .readdirSync(exercisesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .sort();

const allExercises = [];
const enLocaleEntries = {};
const stats = {
  total: 0,
  modalities: {},
  equipment: {},
  muscles: {},
};

for (const folder of exerciseFolders) {
  const jsonPath = path.join(exercisesDir, folder, 'exercise.json');
  if (!fs.existsSync(jsonPath)) {
    console.warn(`⚠️  Skipping ${folder}: missing exercise.json`);
    continue;
  }

  let exercise;
  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    exercise = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed parsing JSON in ${folder}:`, err.message);
    process.exit(1);
  }

  // Schema assertions
  if (!exercise.id || !exercise.name || !exercise.taxonomy || !exercise.steps) {
    console.error(`❌ ${folder}/exercise.json is missing required fields (id, name, taxonomy, steps)`);
    process.exit(1);
  }

  if (!ID_PATTERN.test(exercise.id)) {
    console.error(`❌ ${folder}/exercise.json id must look like 'sf-core-oth-0001'. Got: '${exercise.id}'`);
    process.exit(1);
  }

  if (!validModalities.has(exercise.taxonomy.modality)) {
    console.error(`❌ ${folder}/exercise.json invalid modality: '${exercise.taxonomy.modality}'`);
    process.exit(1);
  }

  if (!validEquipment.has(exercise.taxonomy.equipment)) {
    console.error(`❌ ${folder}/exercise.json invalid equipment: '${exercise.taxonomy.equipment}'`);
    process.exit(1);
  }

  for (const muscle of exercise.taxonomy.primary_muscles || []) {
    if (!validMuscles.has(muscle)) {
      console.error(`❌ ${folder}/exercise.json invalid primary muscle: '${muscle}'`);
      process.exit(1);
    }
  }

  for (const muscle of exercise.taxonomy.secondary_muscles || []) {
    if (!validMuscles.has(muscle)) {
      console.error(`❌ ${folder}/exercise.json invalid secondary muscle: '${muscle}'`);
      process.exit(1);
    }
  }

  // Auto-discover media by file name
  const discoveredMedia = discoverMedia(folder, path.join(exercisesDir, folder));

  // Generate continuous instructions from steps for DB backward-compatibility
  // The schema path and the upstream source ids stay in exercise.json but are not published in dist.
  const { $schema: _schema, sources: _sources, ...publishedFields } = exercise;
  const compiledExercise = {
    ...publishedFields,
    instructions: exercise.steps.join(' '),
    folder: folder,
    media: discoveredMedia,
  };

  allExercises.push(compiledExercise);

  // Collect English locale strings for Weblate template
  enLocaleEntries[exercise.id] = {
    name: exercise.name,
    steps: exercise.steps,
    coaching_cues: exercise.coaching_cues || [],
  };

  // Collect stats
  stats.total += 1;
  const mod = exercise.taxonomy.modality || 'unknown';
  stats.modalities[mod] = (stats.modalities[mod] || 0) + 1;

  const eq = exercise.taxonomy.equipment || 'unknown';
  stats.equipment[eq] = (stats.equipment[eq] || 0) + 1;

  for (const muscle of exercise.taxonomy.primary_muscles || []) {
    stats.muscles[muscle] = (stats.muscles[muscle] || 0) + 1;
  }
}

// 1. Write dist/exercises.json (Consolidated catalog for server/app)
const distPath = path.join(distDir, 'exercises.json');
fs.writeFileSync(distPath, JSON.stringify(allExercises, null, 2), 'utf-8');
console.log(`✅ Generated ${distPath} (${allExercises.length} exercises)`);

// 2. Sync locales/en/exercises.json (Weblate base template)
const enLocalePath = path.join(localesDir, 'en', 'exercises.json');
fs.mkdirSync(path.dirname(enLocalePath), { recursive: true });
fs.writeFileSync(enLocalePath, JSON.stringify(enLocaleEntries, null, 2), 'utf-8');
console.log(`✅ Synced Weblate base template: ${enLocalePath}`);

console.log('\n📊 Summary:');
console.log(`Total Exercises: ${stats.total}`);
console.log('Modalities:', stats.modalities);
console.log('Equipment:', stats.equipment);
console.log('\n✨ Build completed successfully!\n');
