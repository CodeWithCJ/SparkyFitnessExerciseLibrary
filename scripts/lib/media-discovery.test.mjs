// Run with: node --test "scripts/lib/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverMedia, mediaPaths } from './media-discovery.mjs';

const FOLDER = 'sf-legs-bnd-0010_squat_band';

/** A temporary exercise folder containing empty files with the given names. */
function exerciseDir(names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-discovery-'));
  for (const name of names) fs.writeFileSync(path.join(dir, name), '');
  return dir;
}
const rel = (name) => `exercises/${FOLDER}/${name}`;

test('with male and female files, the male one is the default whatever order they were created in', () => {
  for (const order of [['m', 'f'], ['f', 'm']]) {
    const dir = exerciseDir([...order.map((l) => `${FOLDER}_${l}_9_16.mp4`), 'exercise.json']);
    const media = discoverMedia(FOLDER, dir);
    assert.equal(media.video_vertical_path, rel(`${FOLDER}_m_9_16.mp4`), `order ${order}`);
    assert.equal(media.male.video_vertical_path, rel(`${FOLDER}_m_9_16.mp4`));
    assert.equal(media.female.video_vertical_path, rel(`${FOLDER}_f_9_16.mp4`));
  }
});

test('a female-only exercise uses the female files as its default and has no male set', () => {
  const dir = exerciseDir([`${FOLDER}_f_9_16.mp4`, `${FOLDER}_f_thumb.webp`, 'exercise.json']);
  const media = discoverMedia(FOLDER, dir);
  assert.equal(media.video_path, rel(`${FOLDER}_f_9_16.mp4`));
  assert.equal(media.thumbnail_path, rel(`${FOLDER}_f_thumb.webp`));
  assert.ok(!('male' in media), 'no male set');
  assert.ok(media.female);
});

test('each model keeps its own previews and thumbnail', () => {
  const dir = exerciseDir([
    `${FOLDER}_m_9_16.mp4`, `${FOLDER}_m_16_9.mp4`, `${FOLDER}_m_9_16.webp`, `${FOLDER}_m_16_9.webp`, `${FOLDER}_m_thumb.webp`,
    `${FOLDER}_f_9_16.mp4`, `${FOLDER}_f_9_16.webp`, `${FOLDER}_f_thumb.webp`,
    'exercise.json',
  ]);
  const media = discoverMedia(FOLDER, dir);
  assert.equal(media.male.video_horizontal_path, rel(`${FOLDER}_m_16_9.mp4`));
  assert.equal(media.male.animation_horizontal_path, rel(`${FOLDER}_m_16_9.webp`));
  assert.equal(media.female.video_horizontal_path, null, 'the female set has no horizontal video');
  assert.equal(media.female.thumbnail_path, rel(`${FOLDER}_f_thumb.webp`));
  assert.equal(media.thumbnail_path, rel(`${FOLDER}_m_thumb.webp`));
});

test('an exercise with only a still image has an image and no video', () => {
  const dir = exerciseDir([`${FOLDER}_m_thumb.png`, 'exercise.json']);
  const media = discoverMedia(FOLDER, dir);
  assert.equal(media.video_path, null);
  assert.equal(media.image_path, rel(`${FOLDER}_m_thumb.png`));
  assert.ok(media.male, 'the still image belongs to the male set');
});

test('no media at all gives all nulls and no male or female set', () => {
  const media = discoverMedia(FOLDER, exerciseDir(['exercise.json']));
  assert.equal(Object.values(media).filter(Boolean).length, 0);
  assert.deepEqual(Object.keys(media).filter((k) => k === 'male' || k === 'female'), []);
});

test('temporary files are ignored and mediaPaths lists the male and female files once', () => {
  const dir = exerciseDir([`${FOLDER}_m_9_16.mp4`, `${FOLDER}_f_9_16.mp4`, `_temp_${FOLDER}_m_9_16.mp4`, 'exercise.json']);
  const paths = mediaPaths(discoverMedia(FOLDER, dir)).sort();
  assert.deepEqual(paths, [rel(`${FOLDER}_f_9_16.mp4`), rel(`${FOLDER}_m_9_16.mp4`)]);
});
