// Catalog ID rules as pure functions: no file system, no Node APIs, so both the Node scripts
// (through catalog.mjs) and the browser-based exercise generator use exactly the same rules.
// The rules themselves are data in taxonomy/catalog-codes.json.

/** Longest allowed slug. Keeps the longest media path under Windows' 260 character limit. */
export const SLUG_MAX_LENGTH = 50;

/** Letter in media file names: which SparkyFitness model demonstrates the exercise. */
export const MODEL_LETTERS = { m: 'male', f: 'female' };

export const SLUG_PATTERN = /^[a-z0-9_]+$/;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Shortens a slug to SLUG_MAX_LENGTH at a word boundary. */
export function capSlug(slug) {
  if (slug.length <= SLUG_MAX_LENGTH) return slug;
  const cut = slug.slice(0, SLUG_MAX_LENGTH + 1);
  const boundary = cut.lastIndexOf('_');
  return boundary > 0 ? cut.slice(0, boundary) : slug.slice(0, SLUG_MAX_LENGTH);
}

/** "Squat (Band)" -> "squat_band". Accents are dropped, anything else becomes one underscore. */
export function slugFromName(name) {
  const plain = String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return capSlug(plain);
}

/** Model letter ('m' or 'f') from a media file name, 'm' when there is none. */
export function modelLetterOf(fileName) {
  const match = /_(m|f)_(9_16|16_9|thumb)\./.exec(fileName);
  return match ? match[1] : 'm';
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

/** The media files an exercise with videos has, for one model letter. */
export function mediaFileNames(folder, model = 'm') {
  return {
    video_vertical: `${folder}_${model}_9_16.mp4`,
    video_horizontal: `${folder}_${model}_16_9.mp4`,
    animation_vertical: `${folder}_${model}_9_16.webp`,
    animation_horizontal: `${folder}_${model}_16_9.webp`,
    thumbnail: `${folder}_${model}_thumb.webp`,
  };
}

/** Binds the rules to a codes object (the contents of taxonomy/catalog-codes.json). */
export function createCatalogRules(codes) {
  const BODY_CODES = Object.keys(codes.body);
  const EQUIPMENT_CODES = Object.keys(codes.equipment);
  const CODE_PART = `(${BODY_CODES.join('|')})-(${EQUIPMENT_CODES.join('|')})-[0-9]{4}`;

  /** e.g. sf-core-oth-0001 */
  const ID_PATTERN = new RegExp(`^sf-${CODE_PART}$`);
  /** e.g. sf-core-oth-0001_ab_wheel_rollout */
  const FOLDER_PATTERN = new RegExp(`^(sf-${CODE_PART})_([a-z0-9_]+)$`);

  function bodyCodeFor(taxonomy) {
    if (taxonomy.category === 'cardio') return 'card';
    const muscle = (taxonomy.primary_muscles || [])[0];
    const code = codes.muscle_to_body[muscle];
    if (!code) throw new Error(`No body code for primary muscle '${muscle}'`);
    return code;
  }

  function equipmentCodeFor(equipment) {
    const code = EQUIPMENT_CODES.find((c) => codes.equipment[c].includes(equipment));
    if (!code) throw new Error(`No equipment code for '${equipment}'`);
    return code;
  }

  /** The "sf-<body>-<equip>" part for a taxonomy, e.g. "sf-core-oth". */
  function idPrefixFor(taxonomy) {
    return `sf-${bodyCodeFor(taxonomy)}-${equipmentCodeFor(taxonomy.equipment)}`;
  }

  /** The next free ID for a prefix, given every existing ID. Numbers are never reused. */
  function nextCatalogId(prefix, existingIds) {
    let highest = 0;
    for (const id of existingIds) {
      if (id.startsWith(`${prefix}-`)) highest = Math.max(highest, Number(id.slice(prefix.length + 1)) || 0);
    }
    if (highest >= 9999) throw new Error(`${prefix} is full`);
    return `${prefix}-${String(highest + 1).padStart(4, '0')}`;
  }

  return {
    BODY_CODES,
    EQUIPMENT_CODES,
    ID_PATTERN,
    FOLDER_PATTERN,
    bodyCodeFor,
    equipmentCodeFor,
    idPrefixFor,
    nextCatalogId,
  };
}
