// Shared PR-policy rules for .github/workflows/pr-validation.yml.
//
// Loaded from actions/github-script via:
//   const policy = require(`${process.env.GITHUB_WORKSPACE}/.github/scripts/pr-policy.cjs`);
//
// The workflow checks out the BASE branch (never the PR head), so a pull request cannot change
// the rules that judge it. The template in .github/pull_request_template.md must contain every
// checklist item, PR type and AI option below; pr-policy.test.cjs fails when they drift apart.

const LICENSE_ITEM = '[MANDATORY - ALL] Integrity & License';
const LICENSE_ITEM_TEXT =
  '**[MANDATORY - ALL] Integrity & License**: I certify this is my own work or properly licensed, free of malicious code, and I agree to the [License terms](https://github.com/CodeWithCJ/SparkyFitnessExerciseLibrary/blob/main/LICENSE).';

const MEDIA_ITEM = '[MANDATORY for media] Rights & consent';
const MEDIA_ITEM_TEXT =
  '**[MANDATORY for media] Rights & consent**: I have the rights to the new or changed images and videos, and anyone shown, or used as source footage, agreed to this use.';

// Deliberately owner-only: on a user-owned repo `OWNER` is exactly one person, the maintainer.
// Other collaborators tick the boxes like everyone else.
const EXEMPT_ASSOCIATIONS = ['OWNER'];

// Head-branch prefixes used by automation. Only consulted for branches pushed directly to this
// repo (see getExemption), so a fork cannot claim the exemption by naming its branch `ci/x`.
const AUTOMATION_BRANCH_PREFIXES = ['ci/', 'i18n/', 'dependabot/', 'renovate/'];

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "- [x] **<item>" / "- [X] **<item>"
const isChecked = (body, item) =>
  new RegExp(`-\\s*\\[[xX]\\]\\s*\\*\\*${escapeRegex(item)}`, 'i').test(body || '');

// Same line, ticked or not. A missing box means the template was deleted and we add it back;
// an unticked box is the contributor's job.
const isPresent = (body, item) =>
  new RegExp(`-\\s*\\[[ xX]\\]\\s*\\*\\*${escapeRegex(item)}`, 'i').test(body || '');

const isSameRepoAutomationBranch = pr => {
  const headRepo = pr.head && pr.head.repo && pr.head.repo.full_name;
  const baseRepo = pr.base && pr.base.repo && pr.base.repo.full_name;
  const headRef = (pr.head && pr.head.ref) || '';
  return Boolean(
    headRepo &&
      baseRepo &&
      headRepo === baseRepo &&
      AUTOMATION_BRANCH_PREFIXES.some(prefix => headRef.startsWith(prefix))
  );
};

/**
 * Is this PR exempt from the license, media and AI-assistance boxes?
 * Accepts `context.payload.pull_request` or an element of `pulls.list`.
 *
 * @returns {{exempt: boolean, reason: string}}
 */
function getExemption(pr) {
  // Any bot account (Dependabot, Renovate, workflows using GITHUB_TOKEN): future automation is
  // exempt without an edit here.
  if (pr.user && pr.user.type === 'Bot') {
    return { exempt: true, reason: `bot account (${pr.user.login})` };
  }
  if (EXEMPT_ASSOCIATIONS.includes(pr.author_association)) {
    return { exempt: true, reason: `repo ${String(pr.author_association).toLowerCase()}` };
  }
  if (isSameRepoAutomationBranch(pr)) {
    return { exempt: true, reason: `automation branch (${pr.head.ref})` };
  }
  return { exempt: false, reason: '' };
}

/**
 * Is this PR machine-generated? Narrower than getExemption: a human collaborator is exempt from
 * nothing but the owner rule above, while automation is held to no contributor rules at all
 * (a Weblate sync legitimately rewrites non-English locale files and cannot tick a box).
 */
const isAutomation = pr => Boolean((pr.user && pr.user.type === 'Bot') || isSameRepoAutomationBranch(pr));

// Conventional-commit prefixes. Labels and the changelog key off the title.
const TITLE_PREFIX_RE =
  /^(feat|fix|docs|refactor|security|perf|test|chore|ci|build|style|revert)(\([^)]+\))?!?:\s+\S/i;

const hasValidTitlePrefix = title => TITLE_PREFIX_RE.test(title || '');

// How much of the change the author understands. Pick exactly one; the options are descriptive
// and carry no judgement. `needsExtraReview` flags the answers where a maintainer should look
// harder. The trailing `**` keeps one label from prefix-matching another.
const AI_ASSISTANCE_OPTIONS = [
  {
    key: 'none',
    label: 'No AI**',
    text: '**No AI**: I wrote this change without AI tools.',
    needsExtraReview: false,
  },
  {
    key: 'reviewed',
    label: 'AI, reviewed line by line**',
    text: '**AI, reviewed line by line**: AI wrote part of this. I read every generated line and edited it before accepting.',
    needsExtraReview: false,
  },
  {
    key: 'partly-understood',
    label: 'AI, tested and partly understood**',
    text: '**AI, tested and partly understood**: AI wrote most of this. I tested the behavior, but I only partly understand the generated code.',
    needsExtraReview: true,
  },
  {
    key: 'tested-only',
    label: 'AI, tested only**',
    text: '**AI, tested only**: AI wrote this and I did not review the code myself. I tested the behavior only.',
    needsExtraReview: true,
  },
];
const NEEDS_EXTRA_REVIEW_LABEL = 'needs-extra-review';

/** Which AI-assistance options are ticked, and which are present at all. */
function getAiAssistance(body) {
  const selected = AI_ASSISTANCE_OPTIONS.filter(o => isChecked(body, o.label));
  const present = AI_ASSISTANCE_OPTIONS.filter(o => isPresent(body, o.label));
  return { selected, present, needsExtraReview: selected.some(o => o.needsExtraReview) };
}

// PR Type group. Plain boxes (no bold prefix), matched on their own line.
const PR_TYPE_OPTIONS = [
  { re: /-\s*\[[ xX]\]\s*New or changed exercises/i, text: 'New or changed exercises' },
  { re: /-\s*\[[ xX]\]\s*Media/i, text: 'Media' },
  { re: /-\s*\[[ xX]\]\s*Tooling \/ schema/i, text: 'Tooling / schema' },
  { re: /-\s*\[[ xX]\]\s*Documentation/i, text: 'Documentation' },
];

/** PR Type options that are no longer in the body (the template was edited or replaced). */
const getMissingPrTypes = body => PR_TYPE_OPTIONS.filter(o => !o.re.test(body || ''));

const isPrTypeChecked = (body, option) =>
  new RegExp(option.re.source.replace('[ xX]', '[xX]'), 'i').test(body || '');

// Exercise images and videos. Deleted files need no rights statement.
const MEDIA_FILE_RE = /^exercises\/[^/]+\/[^/]+\.(mp4|webp|gif|jpe?g|png|mov|webm)$/i;

/** Media files a PR adds, changes or renames. @param {Array<{filename: string, status?: string}>} files */
const getMediaFiles = files =>
  (files || []).filter(f => f.status !== 'removed' && MEDIA_FILE_RE.test(f.filename)).map(f => f.filename);

// Only locales/en/ is hand-edited; every other language is owned by Weblate.
const getNonEnglishLocaleFiles = changedFiles =>
  (changedFiles || []).filter(f => f.startsWith('locales/') && !f.startsWith('locales/en/'));

/** Which areas of the repository a PR touches, for labels. */
function getChangeAreas(changedFiles) {
  const files = changedFiles || [];
  const starts = (...prefixes) => files.some(f => prefixes.some(p => f.startsWith(p)));
  return {
    exercises: starts('exercises/', 'locales/', 'dist/'),
    tooling: starts('scripts/', 'schema/', 'taxonomy/', '.github/') || files.includes('package.json'),
    site: starts('docs/'),
  };
}

module.exports = {
  LICENSE_ITEM,
  LICENSE_ITEM_TEXT,
  MEDIA_ITEM,
  MEDIA_ITEM_TEXT,
  EXEMPT_ASSOCIATIONS,
  AUTOMATION_BRANCH_PREFIXES,
  escapeRegex,
  isChecked,
  isPresent,
  getExemption,
  isAutomation,
  hasValidTitlePrefix,
  AI_ASSISTANCE_OPTIONS,
  NEEDS_EXTRA_REVIEW_LABEL,
  getAiAssistance,
  PR_TYPE_OPTIONS,
  getMissingPrTypes,
  isPrTypeChecked,
  getMediaFiles,
  getNonEnglishLocaleFiles,
  getChangeAreas,
};
