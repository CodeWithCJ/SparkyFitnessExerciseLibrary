// Run with: node --test .github/scripts
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('./pr-policy.cjs');

const template = fs.readFileSync(path.join(__dirname, '..', 'pull_request_template.md'), 'utf8');

const prFrom = (overrides = {}) => ({
  user: { login: 'someone', type: 'User' },
  author_association: 'NONE',
  head: { ref: 'fix/thing', repo: { full_name: 'fork/repo' } },
  base: { repo: { full_name: 'CodeWithCJ/SparkyFitnessExerciseLibrary' } },
  ...overrides,
});

test('the template contains every checklist item, PR type and AI option the policy restores', () => {
  for (const item of [policy.LICENSE_ITEM, policy.MEDIA_ITEM]) {
    assert.ok(policy.isPresent(template, item), `template is missing "${item}"`);
  }
  assert.ok(template.includes(policy.LICENSE_ITEM_TEXT), 'license text differs from the policy');
  assert.ok(template.includes(policy.MEDIA_ITEM_TEXT.split(' Skip this')[0]), 'media text differs from the policy');
  for (const option of policy.AI_ASSISTANCE_OPTIONS) {
    assert.ok(template.includes(`- [ ] ${option.text}`), `template is missing AI option "${option.key}"`);
  }
  assert.deepEqual(policy.getMissingPrTypes(template), []);
});

test('a ticked box is checked and present; an unticked box is only present', () => {
  const body = `- [x] **${policy.LICENSE_ITEM}**: ok\n- [ ] **${policy.MEDIA_ITEM}**: later`;
  assert.equal(policy.isChecked(body, policy.LICENSE_ITEM), true);
  assert.equal(policy.isChecked(body, policy.MEDIA_ITEM), false);
  assert.equal(policy.isPresent(body, policy.MEDIA_ITEM), true);
  assert.equal(policy.isPresent('my own summary', policy.LICENSE_ITEM), false);
  assert.equal(policy.isChecked(null, policy.LICENSE_ITEM), false);
});

test('AI options do not match each other by prefix and flag the risky answers', () => {
  const some = `- [x] **AI, tested only**: x\n- [ ] **AI, reviewed line by line**: y`;
  const ai = policy.getAiAssistance(some);
  assert.deepEqual(ai.selected.map(o => o.key), ['tested-only']);
  assert.equal(ai.present.length, 2);
  assert.equal(ai.needsExtraReview, true);
  assert.equal(policy.getAiAssistance('- [x] **No AI**: x').needsExtraReview, false);
});

test('PR types: missing ones are reported, ticked ones detected', () => {
  assert.equal(policy.getMissingPrTypes('nothing here').length, 4);
  const body = '- [x] Documentation\n- [ ] Media';
  assert.equal(policy.getMissingPrTypes(body).map(o => o.text).includes('Documentation'), false);
  assert.equal(policy.isPrTypeChecked(body, policy.PR_TYPE_OPTIONS[3]), true);
  assert.equal(policy.isPrTypeChecked(body, policy.PR_TYPE_OPTIONS[1]), false);
});

test('exemptions: owner, bots and same-repo automation branches, but not forks', () => {
  assert.equal(policy.getExemption(prFrom()).exempt, false);
  assert.equal(policy.getExemption(prFrom({ author_association: 'OWNER' })).exempt, true);
  assert.equal(policy.getExemption(prFrom({ author_association: 'COLLABORATOR' })).exempt, false);
  assert.equal(policy.getExemption(prFrom({ user: { login: 'dependabot[bot]', type: 'Bot' } })).exempt, true);
  const sameRepo = repo => ({ head: { ref: 'i18n/sync', repo: { full_name: repo } }, base: { repo: { full_name: 'a/b' } } });
  assert.equal(policy.getExemption(prFrom(sameRepo('a/b'))).exempt, true);
  assert.equal(policy.getExemption(prFrom(sameRepo('fork/b'))).exempt, false);
});

test('only bots and same-repo automation branches count as automation', () => {
  assert.equal(policy.isAutomation(prFrom({ author_association: 'OWNER' })), false);
  assert.equal(policy.isAutomation(prFrom({ user: { login: 'x', type: 'Bot' } })), true);
});

test('title prefixes', () => {
  for (const ok of ['feat: add x', 'fix(site): y', 'chore!: z', 'docs(readme): w']) {
    assert.equal(policy.hasValidTitlePrefix(ok), true, ok);
  }
  for (const bad of ['Add x', 'feat:', 'feature: x', '', null]) {
    assert.equal(policy.hasValidTitlePrefix(bad), false, String(bad));
  }
});

test('media files: exercise media counts, removals and other paths do not', () => {
  const files = [
    { filename: 'exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4', status: 'added' },
    { filename: 'exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_thumb.webp', status: 'renamed' },
    { filename: 'exercises/sf-core-oth-0001_x/old_m_9_16.mp4', status: 'removed' },
    { filename: 'exercises/sf-core-oth-0002_ab_wheel_rollout/exercise.json', status: 'modified' },
    { filename: 'docs/src/public/logo.png', status: 'modified' },
  ];
  assert.equal(policy.getMediaFiles(files).length, 2);
  assert.deepEqual(policy.getMediaFiles(undefined), []);
});

test('only locales/en may change', () => {
  const changed = ['locales/en/exercises.json', 'locales/es/exercises.json', 'locales/zh/exercises.json', 'README.md'];
  assert.deepEqual(policy.getNonEnglishLocaleFiles(changed), ['locales/es/exercises.json', 'locales/zh/exercises.json']);
});

test('change areas for labels', () => {
  assert.deepEqual(policy.getChangeAreas(['exercises/a/exercise.json']), { exercises: true, tooling: false, site: false });
  assert.deepEqual(policy.getChangeAreas(['scripts/build.mjs', 'docs/x.md']), { exercises: false, tooling: true, site: true });
  assert.equal(policy.getChangeAreas(['package.json']).tooling, true);
});
