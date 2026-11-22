import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, execFileSync } from 'node:child_process';
import { ID_PATTERN, mediaNamePattern } from './lib/catalog.mjs';
import { validateExercise } from './lib/exercise-form.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const exercisesDir = path.join(rootDir, 'exercises');
const taxonomyDir = path.join(rootDir, 'taxonomy');

const validMuscles = new Set(JSON.parse(fs.readFileSync(path.join(taxonomyDir, 'muscles.json'), 'utf8')));
const validEquipment = new Set(JSON.parse(fs.readFileSync(path.join(taxonomyDir, 'equipment.json'), 'utf8')));
const validModalities = new Set(JSON.parse(fs.readFileSync(path.join(taxonomyDir, 'modalities.json'), 'utf8')));

// Video standards for long-term maintainability
const MAX_VIDEO_SIZE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB hard cap (ideal <= 1.5 MB)
const MIN_DURATION_SECONDS = 5;
const MAX_DURATION_SECONDS = 15;

// Check if ffprobe is available on the system
let hasFfprobe = false;
try {
  execSync('ffprobe -version', { stdio: 'ignore' });
  hasFfprobe = true;
} catch {
  // ffprobe not installed or not in PATH
}

console.log('🔍 Validating SparkyFitness Exercise Library...\n');

const exerciseFolders = fs
  .readdirSync(exercisesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .sort();

let errorCount = 0;
let warningCount = 0;
// Labels for the taxonomy values (muscles, equipment, levels, ...) in every language
const labelsDir = path.join(rootDir, 'locales');
const taxonomyEn = JSON.parse(fs.readFileSync(path.join(labelsDir, 'en', 'taxonomy.json'), 'utf8'));
for (const lang of fs.readdirSync(labelsDir)) {
  const file = path.join(labelsDir, lang, 'taxonomy.json');
  // Languages with translated exercises (exercises.json) need every label; the others fall back to English
  const complete = fs.existsSync(path.join(labelsDir, lang, 'exercises.json'));
  if (lang === 'en' || !fs.existsSync(file)) continue;
  const labels = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [section, terms] of Object.entries(taxonomyEn)) {
    for (const term of Object.keys(terms)) {
      if (complete && !labels[section]?.[term]) {
        console.error(`❌ locales/${lang}/taxonomy.json is missing ${section}.${term}`);
        errorCount++;
      }
    }
  }
}
const seenIds = new Set();
const checkContext = { idPattern: ID_PATTERN, validMuscles, validEquipment, validModalities };

// Longest allowed path inside the repository. Keeps clones under Windows' 260 character limit.
const MAX_RELATIVE_PATH_LENGTH = 160;

for (const folder of exerciseFolders) {
  const exercisePath = path.join(exercisesDir, folder);
  const jsonPath = path.join(exercisePath, 'exercise.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ [${folder}] Missing exercise.json`);
    errorCount++;
    continue;
  }

  let exercise;
  try {
    exercise = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    console.error(`❌ [${folder}] Invalid JSON: ${err.message}`);
    errorCount++;
    continue;
  }

  // 1-3. Field checks shared with the exercise generator (ID, slug, taxonomy, name, steps)
  for (const problem of validateExercise(exercise, checkContext)) {
    console.error(`❌ [${folder}] ${problem}`);
    errorCount++;
  }

  // 1a. Every taxonomy value needs a label in locales/en/taxonomy.json (the other languages are checked above)
  const t = exercise.taxonomy ?? {};
  const used = {
    category: [t.category],
    body_part: [t.body_part],
    equipment: [t.equipment],
    modality: [t.modality],
    level: [t.level],
    mechanic: [t.mechanic],
    force: [t.force],
    muscle: [...(t.primary_muscles ?? []), ...(t.secondary_muscles ?? [])],
    laterality: [exercise.biomechanics?.laterality],
    movement_plane: [exercise.biomechanics?.movement_plane],
  };
  for (const [section, values] of Object.entries(used)) {
    for (const value of values.filter(Boolean)) {
      if (!taxonomyEn[section]?.[value]) {
        console.error(`❌ [${folder}] '${value}' (${section}) has no label in locales/en/taxonomy.json. Add it there and in every other language.`);
        errorCount++;
      }
    }
  }

  // 1b. Checks that need the folder or the other exercises
  if (exercise.id) {
    if (seenIds.has(exercise.id)) {
      console.error(`❌ [${folder}] Duplicate id '${exercise.id}'`);
      errorCount++;
    }
    seenIds.add(exercise.id);
    if (typeof exercise.slug === 'string' && folder !== `${exercise.id}_${exercise.slug}`) {
      console.error(`❌ [${folder}] folder name must be '<id>_<slug>' = '${exercise.id}_${exercise.slug}'`);
      errorCount++;
    }
  }

  // 4a. Credits for media from elsewhere (sources.media): the files must exist and the credit must be complete
  for (const [i, credit] of (exercise.sources?.media ?? []).entries()) {
    for (const key of ['author', 'url', 'license']) {
      if (typeof credit[key] !== 'string' || !credit[key].trim()) {
        console.error(`❌ [${folder}] sources.media[${i}] needs '${key}'`);
        errorCount++;
      }
    }
    if (typeof credit.url === 'string' && !credit.url.startsWith('https://')) {
      console.error(`❌ [${folder}] sources.media[${i}].url must be an https:// address`);
      errorCount++;
    }
    if (!Array.isArray(credit.files) || credit.files.length === 0) {
      console.error(`❌ [${folder}] sources.media[${i}].files must list the covered files`);
      errorCount++;
    }
    for (const file of credit.files ?? []) {
      if (!fs.existsSync(path.join(exercisePath, file))) {
        console.error(`❌ [${folder}] sources.media[${i}] lists '${file}', which is not in the folder`);
        errorCount++;
      }
    }
  }

  // 4b. Media file names: <folder>_<m|f>_<9_16|16_9|thumb>.<ext>, and a path short enough for Windows
  const namePattern = mediaNamePattern(folder);
  for (const entry of fs.readdirSync(exercisePath, { withFileTypes: true })) {
    if (entry.isDirectory() || entry.name === 'exercise.json' || entry.name.startsWith('_temp_')) continue;
    if (!namePattern.test(entry.name)) {
      console.error(`❌ [${folder}] '${entry.name}' must be named '${folder}_<m|f>_<9_16|16_9|thumb>.<ext>'`);
      errorCount++;
    } else if (`exercises/${folder}/${entry.name}`.length > MAX_RELATIVE_PATH_LENGTH) {
      console.error(`❌ [${folder}] '${entry.name}' makes the path longer than ${MAX_RELATIVE_PATH_LENGTH} characters`);
      errorCount++;
    }
  }

  // 5. Validate video files on disk
  const localFiles = fs.readdirSync(exercisePath);
  const videoFiles = new Set([
    ...localFiles.filter((f) => f.endsWith('.mp4') && !f.startsWith('_temp_')),
  ].filter(Boolean));

  for (const videoFileName of videoFiles) {
    let localVideoPath;
    try {
      localVideoPath = path.resolve(exercisePath, videoFileName);
      const rel = path.relative(exercisePath, localVideoPath);
      if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
    } catch {
      continue;
    }

    if (fs.existsSync(localVideoPath)) {
      const stats = fs.statSync(localVideoPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      if (stats.size > MAX_VIDEO_SIZE_BYTES) {
        console.error(
          `❌ [${folder}] Video ${videoFileName} is ${sizeMB} MB (exceeds 2.5 MB limit). Please compress to ~1MB:\n` +
          `   ffmpeg -i "${videoFileName}" -vcodec libx264 -crf 24 -an -movflags +faststart "${videoFileName}_compressed.mp4"`
        );
        errorCount++;
      } else if (stats.size > 1.8 * 1024 * 1024) {
        console.warn(`⚠️  [${folder}] Video ${videoFileName} is ${sizeMB} MB (recommended <= 1.5 MB for optimal performance)`);
        warningCount++;
      }

      // Deep inspection with ffprobe if installed
      if (hasFfprobe) {
        try {
          const probeOutput = execFileSync(
            'ffprobe',
            [
              '-v', 'error',
              '-select_streams', 'v:0',
              '-show_entries', 'stream=codec_name,width,height,duration:format_tags=comment',
              '-of', 'json',
              localVideoPath,
            ],
            { encoding: 'utf8' }
          );
          const probeData = JSON.parse(probeOutput);
          const stream = probeData.streams?.[0];

          const comment = probeData.format?.tags?.comment ?? '';
          if (exercise.id && !comment.includes(exercise.id)) {
            console.warn(`⚠️  [${folder}] Video ${videoFileName} has no ID metadata. Run 'pnpm media' to embed it.`);
            warningCount++;
          }

          if (stream) {
            // Check codec
            if (stream.codec_name !== 'h264') {
              console.warn(`⚠️  [${folder}] Video ${videoFileName} codec is '${stream.codec_name}'. H.264 ('h264') is recommended for mobile support.`);
              warningCount++;
            }

            // Check duration
            const duration = parseFloat(stream.duration);
            if (duration && (duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS)) {
              console.warn(`⚠️  [${folder}] Video ${videoFileName} duration is ${duration.toFixed(1)}s (recommended: 5s - 15s exercise loop)`);
              warningCount++;
            }
          }
        } catch {
          // ignore probe error
        }
      }
    }
  }
}

console.log('\n--- Validation Result ---');
if (errorCount === 0 && warningCount === 0) {
  console.log(`✅ All ${exerciseFolders.length} exercises passed validation! Zero errors.\n`);
} else if (errorCount === 0) {
  console.log(`✅ All ${exerciseFolders.length} exercises passed schema validation (${warningCount} optimization warnings).\n`);
} else {
  console.error(`💥 Validation failed with ${errorCount} error(s) and ${warningCount} warning(s).\n`);
  process.exit(1);
}
