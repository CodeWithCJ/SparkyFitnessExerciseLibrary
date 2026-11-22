// Run with: node --test "scripts/lib/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyForm, exerciseToForm, applyForm, toJsonText, validateExercise } from './exercise-form.mjs';
import { createCatalogRules } from './catalog-rules.mjs';
import { codes, ID_PATTERN } from './catalog.mjs';

const ctx = {
  idPattern: ID_PATTERN,
  validMuscles: new Set(['glutes', 'quadriceps', 'abdominals']),
  validEquipment: new Set(['bands', 'other']),
  validModalities: new Set(['reps_only', 'weight_reps']),
};

const sample = () => ({
  $schema: '../../schema/exercise.schema.json',
  id: 'sf-legs-bnd-0010',
  slug: 'squat_band',
  name: 'Squat (Band)',
  aliases: ['Band Squat', 'Resistance Band Squat'],
  taxonomy: {
    modality: 'reps_only',
    category: 'upper legs',
    body_part: 'upper legs',
    mechanic: 'compound',
    force: 'push',
    level: 'intermediate',
    equipment: 'bands',
    primary_muscles: ['glutes', 'quadriceps'],
    secondary_muscles: [],
  },
  biomechanics: { laterality: 'bilateral', movement_plane: 'sagittal', default_tempo: '2-0-2-0', demonstration_reps: 2 },
  steps: ['Stand with your feet shoulder-width apart.', 'Push your hips back and lower down.'],
  coaching_cues: ['Keep your chest upright.'],
  sources: { hasan_id: '1004' },
  media: { thumbnail_timestamp: 3 },
});

test('reading an exercise into the form and writing it back changes nothing', () => {
  const original = sample();
  const written = applyForm(original, exerciseToForm(original));
  assert.equal(toJsonText(written), toJsonText(original));
  assert.deepEqual(Object.keys(written), Object.keys(original), 'key order is kept');
});

test('lists keep at least one empty row for the editor, and blank rows are dropped on the way out', () => {
  const form = emptyForm();
  assert.deepEqual([form.aliases, form.steps, form.cues, form.rehab.conditions], [[''], [''], [''], ['']]);
  form.aliases = ['  Band Squat  ', '', '   ', 'Resistance Band Squat'];
  form.steps = ['', 'Stand tall.', ''];
  form.cues = [''];
  const out = applyForm({}, form);
  assert.deepEqual(out.aliases, ['Band Squat', 'Resistance Band Squat']);
  assert.deepEqual(out.steps, ['Stand tall.']);
  assert.deepEqual(out.coaching_cues, []);
  assert.ok(!('rehabilitation' in out), 'an empty rehabilitation block is omitted');
});

test('rehabilitation lists are written only when they have items', () => {
  const form = emptyForm();
  form.rehab.joint = 'knee';
  form.rehab.conditions = ['Patellar tendinopathy', ''];
  const out = applyForm({}, form);
  assert.deepEqual(out.rehabilitation, { joint: 'knee', target_conditions: ['Patellar tendinopathy'] });
});

test('the checks accept a good exercise and name what is missing otherwise', () => {
  assert.deepEqual(validateExercise(sample(), ctx), []);
  const empty = applyForm({ id: '', slug: '' }, emptyForm());
  const problems = validateExercise(empty, ctx).join(' | ');
  for (const part of ['Missing id', 'slug must be', 'Invalid equipment', 'Missing or invalid', 'steps']) {
    assert.ok(problems.includes(part), `expected "${part}" in: ${problems}`);
  }
  const noMuscle = sample();
  noMuscle.taxonomy.primary_muscles = [];
  assert.ok(validateExercise(noMuscle, ctx).some((p) => p.includes('primary muscle')));
});

test('a generated ID for a new exercise comes out valid', () => {
  const rules = createCatalogRules(codes);
  const taxonomy = { category: 'waist', equipment: 'other', primary_muscles: ['abdominals'] };
  const id = rules.nextCatalogId(rules.idPrefixFor(taxonomy), ['sf-core-oth-0002']);
  assert.equal(id, 'sf-core-oth-0003');
  assert.deepEqual(validateExercise({ ...sample(), id }, ctx), []);
});
