import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTime, formatTime, parseYouTube, buildYouTubeUrl, validateYouTubeUrl, youtubeEmbedUrl, youtubeWatchUrl } from './youtube.mjs';

test('parseTime reads seconds, m:ss, h:mm:ss and 1m2s', () => {
  assert.equal(parseTime('62'), 62);
  assert.equal(parseTime('1:02'), 62);
  assert.equal(parseTime('1:02:03'), 3723);
  assert.equal(parseTime('1m2s'), 62);
  assert.equal(parseTime('2m'), 120);
  assert.equal(parseTime('1h2m3s'), 3723);
  assert.equal(parseTime(''), null);
  assert.equal(parseTime('abc'), null);
});

test('formatTime writes m:ss', () => {
  assert.equal(formatTime(62), '1:02');
  assert.equal(formatTime(121), '2:01');
  assert.equal(formatTime(3723), '1:02:03');
});

test('parseYouTube reads the common address forms and a start time', () => {
  const id = 'dQw4w9WgXcQ';
  assert.deepEqual(parseYouTube(`https://www.youtube.com/watch?v=${id}`), { id });
  assert.deepEqual(parseYouTube(`https://www.youtube.com/watch?v=${id}&t=1m2s`), { id, start: 62 });
  assert.deepEqual(parseYouTube(`https://youtu.be/${id}?t=62`), { id, start: 62 });
  assert.deepEqual(parseYouTube(`https://www.youtube.com/embed/${id}?start=62`), { id, start: 62 });
  assert.deepEqual(parseYouTube(`https://m.youtube.com/shorts/${id}`), { id });
  assert.deepEqual(parseYouTube(`youtu.be/${id}`), { id });
  assert.deepEqual(parseYouTube(id), { id });
  assert.equal(parseYouTube('https://example.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(parseYouTube('https://www.youtube.com/watch?v=short'), null);
  assert.equal(parseYouTube('not a link'), null);
});

test('the stored link keeps id, start and end in one address', () => {
  const link = buildYouTubeUrl({ id: 'dQw4w9WgXcQ', start: 62, end: 121 });
  assert.equal(link, 'https://youtu.be/dQw4w9WgXcQ?t=62&end=121');
  assert.deepEqual(parseYouTube(link), { id: 'dQw4w9WgXcQ', start: 62, end: 121 });
  assert.equal(buildYouTubeUrl({ id: 'dQw4w9WgXcQ' }), 'https://youtu.be/dQw4w9WgXcQ');
  assert.deepEqual(parseYouTube('https://www.youtube.com/embed/dQw4w9WgXcQ?start=62&end=121'), { id: 'dQw4w9WgXcQ', start: 62, end: 121 });
});

test('validateYouTubeUrl needs a YouTube address and an end after the start', () => {
  assert.deepEqual(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=62&end=121'), []);
  assert.deepEqual(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'), []);
  assert.equal(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=121&end=62').length, 1);
  assert.equal(validateYouTubeUrl('https://example.com/video').length, 1);
});

test('embed and watch addresses carry the clip times', () => {
  const embed = youtubeEmbedUrl({ id: 'dQw4w9WgXcQ', start: 62, end: 121 });
  assert.ok(embed.startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?'));
  assert.ok(embed.includes('start=62') && embed.includes('end=121'));
  assert.equal(youtubeWatchUrl({ id: 'dQw4w9WgXcQ', start: 62 }), 'https://youtu.be/dQw4w9WgXcQ?t=62');
  assert.equal(youtubeWatchUrl({ id: 'dQw4w9WgXcQ' }), 'https://youtu.be/dQw4w9WgXcQ');
});
