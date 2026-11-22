// Run with: node --test "scripts/lib/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ID_PATTERN,
  FOLDER_PATTERN,
  bodyCodeFor,
  equipmentCodeFor,
  idPrefixFor,
  nextCatalogId,
  capSlug,
  slugFromName,
  mediaNamePattern,
  mediaFileNames,
  modelLetterOf,
} from './catalog.mjs';

test('body code comes from the first primary muscle, cardio category wins', () => {
  assert.equal(bodyCodeFor({ category: 'waist', primary_muscles: ['abdominals', 'lower back'] }), 'core');
  assert.equal(bodyCodeFor({ category: 'strength', primary_muscles: ['lats'] }), 'back');
  assert.equal(bodyCodeFor({ category: 'upper arms', primary_muscles: ['triceps', 'chest'] }), 'arms');
  assert.equal(bodyCodeFor({ category: 'cardio', primary_muscles: ['quadriceps'] }), 'card');
  assert.equal(bodyCodeFor({ category: 'x', primary_muscles: ['neck'] }), 'shld');
  assert.throws(() => bodyCodeFor({ category: 'x', primary_muscles: [] }));
  assert.throws(() => bodyCodeFor({ category: 'x', primary_muscles: ['elbows'] }));
});

test('equipment code comes from taxonomy.equipment', () => {
  const cases = { barbell: 'bb', dumbbell: 'db', kettlebells: 'kb', 'body only': 'bw', cable: 'cbl', machine: 'mch', bands: 'bnd', 'medicine ball': 'bal', 'exercise ball': 'bal', 'e-z curl bar': 'ez', 'foam roll': 'oth', other: 'oth' };
  for (const [equipment, code] of Object.entries(cases)) assert.equal(equipmentCodeFor(equipment), code, equipment);
  assert.throws(() => equipmentCodeFor('rope'));
});

test('the next ID is the highest number for the prefix plus one, never reusing a number', () => {
  const taxonomy = { category: 'waist', equipment: 'other', primary_muscles: ['abdominals'] };
  const prefix = idPrefixFor(taxonomy);
  assert.equal(prefix, 'sf-core-oth');
  assert.equal(nextCatalogId(prefix, []), 'sf-core-oth-0001');
  assert.equal(nextCatalogId(prefix, ['sf-core-oth-0001', 'sf-core-oth-0007', 'sf-core-bw-0099']), 'sf-core-oth-0008');
  // a gap is not filled: IDs are never reused
  assert.equal(nextCatalogId(prefix, ['sf-core-oth-0002']), 'sf-core-oth-0003');
  assert.throws(() => nextCatalogId(prefix, ['sf-core-oth-9999']));
});

test('generated IDs and folders match the patterns', () => {
  assert.ok(ID_PATTERN.test('sf-core-oth-0002'));
  assert.ok(!ID_PATTERN.test('sf-core-xx-0002'));
  assert.ok(!ID_PATTERN.test('00857_ab_wheel_rollout'));
  assert.ok(FOLDER_PATTERN.test('sf-core-oth-0002_ab_wheel_rollout'));
  assert.ok(!FOLDER_PATTERN.test('sf-core-oth-0002'));
});

test('slugs: from names, capped at a word boundary', () => {
  assert.equal(slugFromName('Squat (Band)'), 'squat_band');
  assert.equal(slugFromName('  3/4 Sit-up '), '3_4_sit_up');
  assert.equal(slugFromName('Crème brûlée Curl'), 'creme_brulee_curl');
  assert.equal(slugFromName('***'), '');
  const long = 'exercise_ball_on_the_wall_calf_raise_tennis_ball_between_knees';
  const capped = capSlug(long);
  assert.ok(capped.length <= 50 && long.startsWith(capped) && !capped.endsWith('_'));
  assert.equal(capped, 'exercise_ball_on_the_wall_calf_raise_tennis_ball');
});

test('media names follow <folder>_<m|f>_<shape>.<ext>', () => {
  const folder = 'sf-core-oth-0002_ab_wheel_rollout';
  const names = mediaFileNames(folder, 'f');
  const pattern = mediaNamePattern(folder);
  for (const name of Object.values(names)) assert.ok(pattern.test(name), name);
  assert.equal(names.video_vertical, 'sf-core-oth-0002_ab_wheel_rollout_f_9_16.mp4');
  assert.ok(!pattern.test('ab_wheel_9_16.mp4'));
  assert.equal(modelLetterOf(names.thumbnail), 'f');
  assert.equal(modelLetterOf('plain.mp4'), 'm');
});
