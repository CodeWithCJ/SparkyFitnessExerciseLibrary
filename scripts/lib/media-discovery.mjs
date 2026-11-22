// Finds an exercise's media files by their names. Used by build.mjs to fill the "media" block of
// dist/exercises.json.
//
// Files are named <folder>_<m|f>_<9_16|16_9|thumb>.<ext>, where m or f says whether a male or a
// female model is shown. Each model is discovered on its own, so a female file can never become the
// default by sorting before a male one. The flat keys of the result are the default (male when it
// has any media, otherwise female); `male` and `female` list each model's own files, and each is
// only present when that model has media.
import fs from 'node:fs';
import path from 'node:path';

const KEYS = [
  'video_path',
  'video_vertical_path',
  'video_horizontal_path',
  'animation_path',
  'animation_vertical_path',
  'animation_horizontal_path',
  'thumbnail_path',
  'image_path',
];

const isImage = (f) => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png');

/** The media of one model. `files` is every file name in the folder. */
function discoverModel(folder, files, letter) {
  const own = files.filter((f) => f.includes(`_${letter}_`) && !f.startsWith('_temp_'));
  const pick = (test) => own.find(test) || null;
  const toRelative = (f) => (f ? path.posix.join('exercises', folder, f) : null);

  const videoVertical = pick((f) => f.endsWith('.mp4') && (f.includes('_9_16') || f.includes('_vertical')));
  const videoHorizontal = pick((f) => f.endsWith('.mp4') && (f.includes('_16_9') || f.includes('_horizontal')));

  const mp4s = own.filter((f) => f.endsWith('.mp4'));
  const videoDefault = mp4s.length === 1 ? mp4s[0] : videoVertical || videoHorizontal;

  // Static card thumbnail: <folder>_<m|f>_thumb.<webp|jpg|png>, or any single still image.
  const thumbnail =
    pick((f) => f.includes('_thumb.') && isImage(f)) ||
    pick((f) => isImage(f) && !f.includes('_9_16') && !f.includes('_16_9'));

  const animVertical =
    pick((f) => f.includes('_9_16.webp') || f.includes('_9_16.gif')) ||
    (videoVertical ? pick((f) => f.endsWith('.webp') && !f.includes('_thumb.') && !f.includes('_16_9')) : null);
  const animHorizontal = pick((f) => f.includes('_16_9.webp') || f.includes('_16_9.gif'));
  const animation =
    animVertical ||
    animHorizontal ||
    pick((f) => f.endsWith('.gif') || (f.endsWith('.webp') && !f.includes('_thumb.')));

  // A still image stands in for exercises that have no video.
  const image = videoDefault ? null : thumbnail;

  return {
    video_path: toRelative(videoDefault),
    video_vertical_path: toRelative(videoVertical),
    video_horizontal_path: toRelative(videoHorizontal),
    animation_path: toRelative(animation),
    animation_vertical_path: toRelative(animVertical),
    animation_horizontal_path: toRelative(animHorizontal),
    thumbnail_path: toRelative(thumbnail),
    image_path: toRelative(image),
  };
}

const hasMedia = (model) => KEYS.some((k) => model[k]);

/**
 * @param {string} folder exercise folder name
 * @param {string} exercisePath absolute path of that folder
 */
export function discoverMedia(folder, exercisePath) {
  // Sorted so the result never depends on the order the file system lists files in.
  const files = fs.readdirSync(exercisePath).sort();
  const male = discoverModel(folder, files, 'm');
  const female = discoverModel(folder, files, 'f');
  const primary = hasMedia(male) || !hasMedia(female) ? male : female;
  // `male` and `female` are only present when that model has media, so most exercises stay unchanged.
  return { ...primary, ...(hasMedia(male) ? { male } : {}), ...(hasMedia(female) ? { female } : {}) };
}

/** Every media path in a discovered block, including the male and female sets. */
export function mediaPaths(media) {
  const out = new Set();
  const walk = (block) => {
    if (!block) return;
    for (const value of Object.values(block)) {
      if (typeof value === 'string' && value.startsWith('exercises/')) out.add(value);
      else if (value && typeof value === 'object') walk(value);
    }
  };
  walk(media);
  return [...out];
}
