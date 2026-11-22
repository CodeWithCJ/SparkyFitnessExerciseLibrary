// Writes the exercise ID, name, model and license (or the credit of a video from elsewhere) into an MP4's metadata, so a video that is
// renamed or copied out of its folder can still be identified from the file itself.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { MODEL_LETTERS, modelLetterOf } from './catalog.mjs';

const LICENSE_URL = 'https://github.com/CodeWithCJ/SparkyFitnessExerciseLibrary/blob/main/LICENSE';

/** The credit entry in exercise.json (sources.media) that covers a file, if it is not our own work. */
export const creditFor = (exercise, fileName) => (exercise.sources?.media ?? []).find((m) => m.files?.includes(fileName));

export function videoTags(exercise, fileName) {
  const model = MODEL_LETTERS[modelLetterOf(fileName)];
  const credit = creditFor(exercise, fileName);
  if (credit) {
    return {
      title: exercise.name,
      comment: `${exercise.id} | ${model} model | ${credit.author} ${credit.url}`,
      copyright: `© ${credit.author}. ${credit.license}`,
    };
  }
  return {
    title: exercise.name,
    comment: `${exercise.id} | ${model} model | SparkyFitness Exercise Library`,
    copyright: `© codewithcj. Free for non-commercial use only: ${LICENSE_URL}`,
  };
}

function readTags(videoPath) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format_tags=title,comment,copyright', '-of', 'json', videoPath],
    { encoding: 'utf8' }
  );
  return JSON.parse(out).format?.tags ?? {};
}

/** Rewrites the tags without re-encoding. Returns true when the file changed. */
export function ensureVideoTags(videoPath, tags) {
  const current = readTags(videoPath);
  if (Object.entries(tags).every(([key, value]) => current[key] === value)) return false;

  const temp = path.join(path.dirname(videoPath), `_temp_tag_${path.basename(videoPath)}`);
  const args = ['-y', '-i', videoPath, '-map', '0', '-c', 'copy', '-movflags', '+faststart'];
  for (const [key, value] of Object.entries(tags)) args.push('-metadata', `${key}=${value}`);
  args.push(temp);
  execFileSync('ffmpeg', args, { stdio: 'ignore' });
  fs.renameSync(temp, videoPath);
  return true;
}
