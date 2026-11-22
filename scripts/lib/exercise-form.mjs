// Pure helpers for exercise.json shared by validate.mjs and the browser-based exercise generator:
// the field checks, and converting between an exercise and the generator's form state.
// No file system or Node APIs, so it runs in the browser too.
import { SLUG_PATTERN, SLUG_MAX_LENGTH } from './catalog-rules.mjs';
import { parseYouTube, parseTime, formatTime, buildYouTubeUrl, validateYouTubeUrl } from './youtube.mjs';

export const MECHANICS = ['compound', 'isolation'];
export const FORCES = ['push', 'pull', 'static'];
export const LEVELS = ['beginner', 'intermediate', 'expert'];
export const LATERALITIES = ['bilateral', 'unilateral_left', 'unilateral_right', 'alternating'];
export const MOVEMENT_PLANES = ['sagittal', 'frontal', 'transverse', 'multiplanar'];
export const REHAB_JOINTS = ['neck', 'shoulder', 'elbow_wrist', 'thoracic_spine', 'lumbar_spine', 'hip', 'knee', 'ankle_foot'];

export const SCHEMA_REF = '../../schema/exercise.schema.json';

/**
 * Checks one exercise.json. Returns a list of problems, empty when it is fine.
 * Folder and file-system checks stay in validate.mjs.
 *
 * @param {object} exercise
 * @param {{idPattern: RegExp, validMuscles: Set<string>, validEquipment: Set<string>, validModalities: Set<string>}} ctx
 * @returns {string[]}
 */
export function validateExercise(exercise, ctx) {
  const errors = [];
  const t = exercise.taxonomy;

  if (!exercise.id) errors.push('Missing id');
  else if (!ctx.idPattern.test(exercise.id)) {
    errors.push(`id must look like 'sf-core-oth-0001' (sf-<body>-<equip>-<number>). Got: '${exercise.id}'`);
  }
  if (typeof exercise.slug !== 'string' || !SLUG_PATTERN.test(exercise.slug) || exercise.slug.length > SLUG_MAX_LENGTH) {
    errors.push(`slug must be lowercase letters, digits and underscores, at most ${SLUG_MAX_LENGTH} characters. Got: '${exercise.slug}'`);
  }
  if ('numeric_id' in exercise) errors.push("'numeric_id' was removed. The id is the catalog ID.");

  if (!t) errors.push('Missing taxonomy object');
  else {
    if (!ctx.validModalities.has(t.modality)) errors.push(`Invalid modality: '${t.modality}'`);
    if (!ctx.validEquipment.has(t.equipment)) errors.push(`Invalid equipment: '${t.equipment}'`);
    if (typeof t.category !== 'string' || !t.category) errors.push('Missing taxonomy.category');
    if (typeof t.body_part !== 'string' || !t.body_part) errors.push('Missing taxonomy.body_part');
    if (!Array.isArray(t.primary_muscles) || t.primary_muscles.length === 0) {
      errors.push('At least one primary muscle is required');
    }
    for (const m of t.primary_muscles || []) {
      if (!ctx.validMuscles.has(m)) errors.push(`Invalid primary muscle: '${m}'`);
    }
    for (const m of t.secondary_muscles || []) {
      if (!ctx.validMuscles.has(m)) errors.push(`Invalid secondary muscle: '${m}'`);
    }
  }

  if (!LATERALITIES.includes(exercise.biomechanics?.laterality)) {
    errors.push(`biomechanics.laterality must be one of ${LATERALITIES.join(', ')}`);
  }

  if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim().length < 2) {
    errors.push("Missing or invalid 'name' (must be a string of at least 2 characters)");
  }

  if (!Array.isArray(exercise.steps) || exercise.steps.length === 0) {
    errors.push("'steps' must be a non-empty array of strings");
  } else {
    exercise.steps.forEach((step, i) => {
      if (typeof step !== 'string' || step.trim().length < 5) {
        errors.push(`steps[${i}] must be a descriptive string of at least 5 characters. Got: ${JSON.stringify(step)}`);
      }
    });
  }
  if (exercise.media?.youtube_url != null) errors.push(...validateYouTubeUrl(exercise.media.youtube_url));
  return errors;
}

export function emptyForm() {
  return {
    name: '',
    aliases: [''],
    equipment: '',
    primary: [],
    secondary: [],
    modality: 'weight_reps',
    category: '',
    bodyPart: '',
    mechanic: 'compound',
    force: '',
    level: 'intermediate',
    laterality: 'bilateral',
    movementPlane: 'sagittal',
    tempo: '2-0-2-0',
    reps: 2,
    steps: [''],
    cues: [''],
    youtube: { url: '', start: '', end: '' },
    rehab: { joint: '', conditions: [''], contraindications: [''], protocol: '' },
  };
}

/** Trimmed, non-empty items. */
const clean = (list) => (list || []).map((l) => String(l).trim()).filter(Boolean);
/** A list for the editor: always at least one (possibly empty) row. */
const rows = (list) => (list && list.length ? [...list] : ['']);

/** Reads an existing exercise.json into form state. Unknown fields stay in the base object. */
export function exerciseToForm(exercise) {
  const f = emptyForm();
  const t = exercise.taxonomy || {};
  const b = exercise.biomechanics || {};
  const r = exercise.rehabilitation || {};
  return {
    ...f,
    name: exercise.name || '',
    aliases: rows(exercise.aliases),
    equipment: t.equipment || '',
    primary: [...(t.primary_muscles || [])],
    secondary: [...(t.secondary_muscles || [])],
    modality: t.modality || f.modality,
    category: t.category || '',
    bodyPart: t.body_part || '',
    mechanic: t.mechanic ?? '',
    force: t.force ?? '',
    level: t.level ?? '',
    laterality: b.laterality || f.laterality,
    movementPlane: b.movement_plane || '',
    tempo: b.default_tempo || '',
    reps: b.demonstration_reps ?? f.reps,
    steps: rows(exercise.steps),
    cues: rows(exercise.coaching_cues),
    youtube: youtubeToForm(exercise.media?.youtube_url),
    rehab: {
      joint: r.joint || '',
      conditions: rows(r.target_conditions),
      contraindications: rows(r.contraindications),
      protocol: r.clinical_protocol || '',
    },
  };
}

/**
 * Writes form state onto a base exercise and returns the new exercise.json object. Existing keys
 * keep their position and unknown fields (sources, media, ...) are kept; new keys are appended.
 */
export function applyForm(base, form) {
  const out = { ...base };
  out.name = form.name.trim();
  out.aliases = clean(form.aliases);
  out.taxonomy = {
    ...(base.taxonomy || {}),
    modality: form.modality,
    category: form.category,
    body_part: form.bodyPart,
    mechanic: form.mechanic || null,
    force: form.force || null,
    level: form.level || null,
    equipment: form.equipment,
    primary_muscles: [...form.primary],
    secondary_muscles: [...form.secondary],
  };
  const biomechanics = {
    ...(base.biomechanics || {}),
    laterality: form.laterality,
    default_tempo: form.tempo.trim(),
    demonstration_reps: Number(form.reps) || 2,
  };
  if (form.movementPlane) biomechanics.movement_plane = form.movementPlane;
  else delete biomechanics.movement_plane;
  if (!biomechanics.default_tempo) delete biomechanics.default_tempo;
  out.biomechanics = biomechanics;
  out.steps = clean(form.steps);
  out.coaching_cues = clean(form.cues);

  const rehab = {
    ...(base.rehabilitation || {}),
    ...(form.rehab.joint ? { joint: form.rehab.joint } : {}),
    ...(clean(form.rehab.conditions).length ? { target_conditions: clean(form.rehab.conditions) } : {}),
    ...(clean(form.rehab.contraindications).length ? { contraindications: clean(form.rehab.contraindications) } : {}),
    ...(form.rehab.protocol.trim() ? { clinical_protocol: form.rehab.protocol.trim() } : {}),
  };
  if (Object.keys(rehab).length) out.rehabilitation = rehab;
  else delete out.rehabilitation;

  const link = youtubeFromForm(form.youtube);

  const media = { ...(base.media || {}) };
  if (link) media.youtube_url = link;
  else delete media.youtube_url;
  if (Object.keys(media).length) out.media = media;
  else delete out.media;
  return out;
}

/** The form's three boxes for a stored link: the pasted address, and the start and end as m:ss. */
function youtubeToForm(link) {
  const parsed = link ? parseYouTube(link) : null;
  if (!parsed) return { url: link || '', start: '', end: '' };
  return { url: `https://youtu.be/${parsed.id}`, start: parsed.start != null ? formatTime(parsed.start) : '', end: parsed.end != null ? formatTime(parsed.end) : '' };
}

/**
 * The one address to store. A time typed in the start or end box wins over a time inside the pasted
 * address. Returns '' when there is no usable link (youtubeProblems says why).
 */
function youtubeFromForm(youtube) {
  const parsed = parseYouTube(youtube.url);
  if (!parsed) return '';
  const start = parseTime(youtube.start) ?? parsed.start;
  const end = parseTime(youtube.end) ?? parsed.end;
  return buildYouTubeUrl({ id: parsed.id, start, end });
}

/** Problems in the YouTube boxes that applyForm would otherwise drop without saying so. */
export function youtubeProblems(form) {
  const y = form.youtube;
  const problems = [];
  if (!y.url.trim()) return problems;
  if (!parseYouTube(y.url)) return ['The video link is not a YouTube address.'];
  for (const [label, value] of [['start', y.start], ['end', y.end]]) {
    if (value.trim() && parseTime(value) == null) problems.push(`The ${label} time '${value}' is not a time. Use 1:02 or 62.`);
  }
  return problems;
}

/** The text of exercise.json: 2-space indent and a trailing newline, like the files in the repo. */
export const toJsonText = (exercise) => `${JSON.stringify(exercise, null, 2)}\n`;
