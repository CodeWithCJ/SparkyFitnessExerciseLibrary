// Catalog ID rules shared by validate, build, the media optimizer and the exercise inspector.
// The rules themselves live in taxonomy/catalog-codes.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const codes = JSON.parse(fs.readFileSync(path.join(rootDir, 'taxonomy/catalog-codes.json'), 'utf8'));

export const BODY_CODES = Object.keys(codes.body);
export const EQUIPMENT_CODES = Object.keys(codes.equipment);

/** Longest allowed slug. Keeps the longest media path under Windows' 260 character limit. */
export const SLUG_MAX_LENGTH = 50;

/** Letter in media file names: which SparkyFitness model demonstrates the exercise. */
export const MODEL_LETTERS = { m: 'male', f: 'female' };

const CODE_PART = `(${BODY_CODES.join('|')})-(${EQUIPMENT_CODES.join('|')})-[0-9]{4}`;

/** e.g. sf-core-oth-0001 */
export const ID_PATTERN = new RegExp(`^sf-${CODE_PART}$`);
/** e.g. sf-core-oth-0001_ab_wheel_rollout */
export const FOLDER_PATTERN = new RegExp(`^(sf-${CODE_PART})_([a-z0-9_]+)$`);
export const SLUG_PATTERN = /^[a-z0-9_]+$/;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Every file in an exercise folder (besides exercise.json) is named
 * <folder>_<m|f>_<9_16|16_9>.<mp4|webp|gif> or <folder>_<m|f>_thumb.<webp|jpg|png>.
 */
export function mediaNamePattern(folder) {
  return new RegExp(
    `^${escapeRegExp(folder)}_(m|f)_((9_16|16_9)\\.(mp4|webp|gif)|thumb\\.(webp|jpg|png))$`
  );
}

/** Model letter ('m' or 'f') from a media file name, 'm' when there is none. */
export function modelLetterOf(fileName) {
  const match = /_(m|f)_(9_16|16_9|thumb)\./.exec(fileName);
  return match ? match[1] : 'm';
}

export function bodyCodeFor(taxonomy) {
  if (taxonomy.category === 'cardio') return 'card';
  const muscle = (taxonomy.primary_muscles || [])[0];
  const code = codes.muscle_to_body[muscle];
  if (!code) throw new Error(`No body code for primary muscle '${muscle}'`);
  return code;
}

export function equipmentCodeFor(equipment) {
  const code = EQUIPMENT_CODES.find((c) => codes.equipment[c].includes(equipment));
  if (!code) throw new Error(`No equipment code for '${equipment}'`);
  return code;
}

/** Shortens a slug to SLUG_MAX_LENGTH at a word boundary. */
export function capSlug(slug) {
  if (slug.length <= SLUG_MAX_LENGTH) return slug;
  const cut = slug.slice(0, SLUG_MAX_LENGTH + 1);
  const boundary = cut.lastIndexOf('_');
  return boundary > 0 ? cut.slice(0, boundary) : slug.slice(0, SLUG_MAX_LENGTH);
}
