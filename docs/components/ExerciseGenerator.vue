<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import BodyMap from './BodyMap.vue';
import ListEditor from './ListEditor.vue';
import ChoiceButtons from './ChoiceButtons.vue';
import CopyText from './CopyText.vue';
import { copyText } from './clipboard';
import { equipmentIconSvg } from './equipmentIcons';
import codes from '../../taxonomy/catalog-codes.json';
import muscleList from '../../taxonomy/muscles.json';
import equipmentList from '../../taxonomy/equipment.json';
import modalityList from '../../taxonomy/modalities.json';
import { createCatalogRules, slugFromName, mediaFileNames, SLUG_MAX_LENGTH } from '../../scripts/lib/catalog-rules.mjs';
import {
  validateExercise,
  emptyForm,
  exerciseToForm,
  applyForm,
  toJsonText,
  MECHANICS,
  FORCES,
  LEVELS,
  LATERALITIES,
  MOVEMENT_PLANES,
  REHAB_JOINTS,
  SCHEMA_REF,
} from '../../scripts/lib/exercise-form.mjs';

/**
 * Builds a valid exercise.json: it computes the ID, folder and media file names from the same rules
 * the repository's `pnpm validate` uses (scripts/lib), shows what is wrong, and hands the result to
 * GitHub. `?edit=<id>` opens an existing exercise for editing.
 */
interface MediaSet {
  video_vertical_path?: string | null;
  video_horizontal_path?: string | null;
  animation_vertical_path?: string | null;
  animation_horizontal_path?: string | null;
  thumbnail_path?: string | null;
}
interface CatalogEntry {
  id: string;
  slug: string;
  folder: string;
  name: string;
  taxonomy: { category: string; body_part: string; primary_muscles: string[] };
  media?: MediaSet & { male?: MediaSet; female?: MediaSet };
}

const REPO = 'https://github.com/CodeWithCJ/SparkyFitnessExerciseLibrary';
const rules = createCatalogRules(codes);
const checkContext = {
  idPattern: rules.ID_PATTERN,
  validMuscles: new Set<string>(muscleList),
  validEquipment: new Set<string>(equipmentList),
  validModalities: new Set<string>(modalityList),
};
const label = (v: string) => v.replace(/_/g, ' ');
const asOptions = (list: string[]) => list.map((v) => ({ value: v, label: label(v) }));
const MODALITY_OPTIONS = asOptions(modalityList as string[]);
const LEVEL_OPTIONS = asOptions(LEVELS);
const MECHANIC_OPTIONS = asOptions(MECHANICS);
const FORCE_OPTIONS = [{ value: '', label: 'none' }, ...asOptions(FORCES)];
const LATERALITY_OPTIONS = asOptions(LATERALITIES);
const PLANE_OPTIONS = [{ value: '', label: 'not set' }, ...asOptions(MOVEMENT_PLANES)];

const catalog = ref<CatalogEntry[]>([]);
const loading = ref(true);
const loadError = ref('');
const form = reactive(emptyForm());
const editing = ref<CatalogEntry | null>(null);
const base = ref<Record<string, unknown>>({ $schema: SCHEMA_REF });
const slugEdited = ref('');
const picking = ref<'primary' | 'secondary'>('primary');
const figure = ref<'male' | 'female'>('male');
const showRehab = ref(true);
const copied = ref(false);
const editCopied = ref<boolean | null>(null); // null: not tried, true: copied, false: could not copy

/* ---------- derived ---------- */
const categories = computed(() => [...new Set(catalog.value.map((e) => e.taxonomy.category))].sort());
const bodyParts = computed(() => [...new Set(catalog.value.map((e) => e.taxonomy.body_part))].sort());

const prefix = computed(() => {
  if (!form.equipment || form.primary.length === 0) return '';
  try {
    return rules.idPrefixFor({ category: form.category, equipment: form.equipment, primary_muscles: form.primary });
  } catch {
    return '';
  }
});
const id = computed(() => {
  if (editing.value) return editing.value.id;
  if (!prefix.value) return '';
  try {
    return rules.nextCatalogId(prefix.value, catalog.value.map((e) => e.id));
  } catch {
    return '';
  }
});
const slug = computed(() => (editing.value ? editing.value.slug : slugEdited.value || slugFromName(form.name)));
const folder = computed(() => (id.value && slug.value ? `${id.value}_${slug.value}` : ''));

const exercise = computed(() => applyForm({ ...base.value, id: id.value, slug: slug.value }, form));
const jsonText = computed(() => toJsonText(exercise.value));

// Plain-language messages first; the raw validate messages only for what they do not cover.
const problems = computed(() => {
  const list: string[] = [];
  const named = form.name.trim().length >= 2;
  const stepsOk = form.steps.some((t) => t.trim());
  if (!named) list.push('Enter the exercise name.');
  if (!form.equipment) list.push('Pick the equipment.');
  if (form.primary.length === 0) list.push('Pick at least one primary muscle.');
  if (!stepsOk) list.push('Write at least one step (5 or more characters).');
  const covered =
    /^(Missing id|id must look like|Invalid equipment|Missing or invalid 'name'|'steps' must be|At least one primary muscle)/;
  for (const p of validateExercise(exercise.value, checkContext)) {
    if (covered.test(p)) continue;
    if (!slug.value && p.startsWith('slug must be')) continue; // follows from the missing name
    if (p === 'Missing taxonomy.category') list.push('Choose a category.');
    else if (p === 'Missing taxonomy.body_part') list.push('Choose a body part.');
    else list.push(p);
  }
  return list;
});
const warnings = computed(() => {
  const list: string[] = [];
  const others = catalog.value.filter((e) => e.id !== editing.value?.id);
  const name = form.name.trim().toLowerCase();
  if (name && others.some((e) => e.name.toLowerCase() === name)) {
    list.push('An exercise with this name already exists. Check that you are not adding a duplicate.');
  }
  if (!editing.value && slug.value && others.some((e) => e.slug === slug.value)) {
    list.push('Another exercise has the same slug. The ID keeps the folders apart, but consider a more specific name.');
  }
  if (!editing.value && slug.value.length >= SLUG_MAX_LENGTH - 3) list.push(`The slug is capped at ${SLUG_MAX_LENGTH} characters.`);
  return list;
});
const ready = computed(() => problems.value.length === 0 && !!folder.value);

const mediaM = computed(() => (folder.value ? mediaFileNames(folder.value, 'm') : null));
const mediaF = computed(() => (folder.value ? mediaFileNames(folder.value, 'f') : null));

// Media this exercise already has (edit mode), so a contributor can see what is missing.
const setNames = (set?: MediaSet) =>
  [set?.video_vertical_path, set?.video_horizontal_path, set?.animation_vertical_path, set?.animation_horizontal_path, set?.thumbnail_path]
    .filter((p): p is string => !!p)
    .map((p) => p.split('/').pop() as string);
const existingMedia = computed(() => {
  const m = editing.value?.media;
  return [...new Set([...setNames(m), ...setNames(m?.male), ...setNames(m?.female)])];
});
const folderUrl = computed(() => (folder.value ? `${REPO}/tree/main/exercises/${folder.value}` : ''));
const have = (name: string) => existingMedia.value.includes(name);

const githubUrl = computed(() => {
  if (!folder.value) return '';
  if (editing.value) return `${REPO}/edit/main/exercises/${folder.value}/exercise.json`;
  return `${REPO}/new/main?filename=${encodeURI(`exercises/${folder.value}/exercise.json`)}&value=${encodeURIComponent(jsonText.value)}`;
});
const urlTooLong = computed(() => githubUrl.value.length > 7500);

/* ---------- muscles ---------- */
function toggleMuscle(m: string) {
  const target = picking.value === 'primary' ? form.primary : form.secondary;
  const other = picking.value === 'primary' ? form.secondary : form.primary;
  const o = other.indexOf(m);
  if (o >= 0) other.splice(o, 1);
  const i = target.indexOf(m);
  if (i >= 0) target.splice(i, 1);
  else target.push(m);
}
const muscleState = (m: string) => (form.primary.includes(m) ? 'primary' : form.secondary.includes(m) ? 'secondary' : 'none');
function removeMuscle(list: string[], m: string) {
  list.splice(list.indexOf(m), 1);
}
function makeFirst(m: string) {
  form.primary.splice(form.primary.indexOf(m), 1);
  form.primary.unshift(m);
}

// Suggest the category and body part that exercises with the same first primary muscle use most.
// Suggestions follow the first muscle until the user picks a value themselves.
function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}
const categoryTouched = ref(false);
const bodyPartTouched = ref(false);
const customCategory = ref(false);
const customBodyPart = ref(false);
const bodyPartOpen = ref(false); // the body part is shown as its own dropdown
const showBodyPart = computed(() => bodyPartOpen.value || form.bodyPart !== form.category);
watch(
  () => form.primary[0],
  (m) => {
    if (editing.value) return;
    const same = m ? catalog.value.filter((e) => e.taxonomy.primary_muscles[0] === m) : [];
    if (!categoryTouched.value) form.category = mostCommon(same.map((e) => e.taxonomy.category));
    if (!bodyPartTouched.value) form.bodyPart = mostCommon(same.map((e) => e.taxonomy.body_part));
  }
);

const NEW_VALUE = '__new__';
function optionsWith(list: string[], current: string) {
  return current && !list.includes(current) ? [current, ...list] : list;
}
const categoryOptions = computed(() => optionsWith(categories.value, form.category));
const bodyPartOptions = computed(() => optionsWith(bodyParts.value, form.bodyPart));
const categoryChoice = computed({
  get: () => form.category,
  set: (v: string) => {
    categoryTouched.value = true;
    const followed = form.bodyPart === form.category && !bodyPartTouched.value;
    if (v === NEW_VALUE) {
      customCategory.value = true;
      form.category = '';
    } else {
      form.category = v;
      // A body part that was the same as the category stays the same when that is a body area.
      if (followed && bodyParts.value.includes(v)) form.bodyPart = v;
    }
  },
});
const bodyPartChoice = computed({
  get: () => form.bodyPart,
  set: (v: string) => {
    bodyPartTouched.value = true;
    if (v === NEW_VALUE) {
      customBodyPart.value = true;
      form.bodyPart = '';
    } else form.bodyPart = v;
  },
});

/* ---------- output ---------- */
// Opening GitHub's editor: copy the JSON in the same click so it can be pasted straight in.
function onOpenGithub() {
  if (!editing.value) return;
  void copyText(jsonText.value).then((ok) => (editCopied.value = ok));
}
async function copy() {
  if (await copyText(jsonText.value)) {
    copied.value = true;
    setTimeout(() => (copied.value = false), 1800);
  } else {
    window.prompt('Copy the JSON:', jsonText.value);
  }
}
function download() {
  const url = URL.createObjectURL(new Blob([jsonText.value], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exercise.json';
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- load ---------- */
onMounted(async () => {
  try {
    const res = await fetch(withBase('/data/exercises.json'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    catalog.value = await res.json();
  } catch (err) {
    loadError.value = `Could not load the catalog (${(err as Error).message}). IDs cannot be computed.`;
  } finally {
    loading.value = false;
  }

  const editId = new URLSearchParams(location.search).get('edit');
  if (!editId) return;
  const entry = catalog.value.find((e) => e.id === editId);
  if (!entry) {
    loadError.value = `No exercise with the ID "${editId}" was found, so this is a new exercise instead.`;
    return;
  }
  editing.value = entry;
  // The file on GitHub is the source of truth (it keeps fields the catalog leaves out).
  let source: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`https://raw.githubusercontent.com/CodeWithCJ/SparkyFitnessExerciseLibrary/main/exercises/${entry.folder}/exercise.json`);
    if (res.ok) source = await res.json();
  } catch {
    /* fall back to the catalog entry below */
  }
  if (!source) {
    const { instructions, folder: _folder, media: _media, ...rest } = entry as Record<string, unknown>;
    void instructions;
    source = { $schema: SCHEMA_REF, ...rest };
  }
  base.value = source;
  Object.assign(form, exerciseToForm(source));
});
</script>

<template>
  <div class="eg">
    <header class="eg-head">
      <h1>{{ editing ? 'Suggest an edit' : 'Add an exercise' }}</h1>
      <p class="muted">
        {{
          editing
            ? `Editing ${editing.name}. Its ID and folder never change. Change what is wrong, then open the file on GitHub.`
            : 'Fill this in and we build a valid exercise.json for you: the ID, folder and file names follow the repository rules automatically. When it is ready, open it on GitHub to send it as a pull request.'
        }}
      </p>
      <p v-if="loadError" class="notice warn">{{ loadError }}</p>
      <p v-if="editing" class="muted small">
        <a :href="withBase('/contribute')">Add a new exercise instead</a>
      </p>
    </header>

    <div class="eg-body">
      <form class="eg-form" @submit.prevent>
        <section>
          <h2>1. Name</h2>
          <label class="field">
            <span>Exercise name</span>
            <input v-model="form.name" type="text" placeholder="e.g. Band Lateral Walk" autocomplete="off" />
          </label>
          <div class="field">
            <span>Other names (optional)</span>
            <ListEditor v-model="form.aliases" item-label="Other name" add-label="+ Add another name" placeholder="e.g. Resistance Band Side Step" />
          </div>
        </section>

        <section>
          <h2>2. Equipment</h2>
          <div class="equip">
            <button
              v-for="e in equipmentList"
              :key="e"
              type="button"
              class="equip-tile"
              :aria-pressed="form.equipment === e"
              @click="form.equipment = e"
            >
              <span class="equip-icon" v-html="equipmentIconSvg(e, 24)" />
              <span class="equip-name">{{ e }}</span>
            </button>
          </div>
        </section>

        <section>
          <h2>3. Muscles</h2>
          <div class="muscle-tools">
            <div class="seg small" role="group" aria-label="Selecting">
              <button type="button" :aria-pressed="picking === 'primary'" @click="picking = 'primary'">Primary</button>
              <button type="button" :aria-pressed="picking === 'secondary'" @click="picking = 'secondary'">Secondary</button>
            </div>
            <div class="seg small" role="group" aria-label="Figure">
              <button type="button" :aria-pressed="figure === 'male'" @click="figure = 'male'">Male</button>
              <button type="button" :aria-pressed="figure === 'female'" @click="figure = 'female'">Female</button>
            </div>
          </div>
          <p class="muted small">Click the body to add or remove a muscle in the group selected above.</p>
          <div class="muscle-body">
            <div class="map-wrap">
              <BodyMap :figure="figure" mode="select" :primary="form.primary" :secondary="form.secondary" @toggle="toggleMuscle" />
            </div>
            <div class="muscle-side">
              <p class="muted small">Or tap a muscle here. The group selected above is used.</p>
              <div class="chips">
                <button
                  v-for="m in muscleList"
                  :key="m"
                  type="button"
                  class="chip-btn"
                  :class="muscleState(m)"
                  :aria-pressed="muscleState(m) !== 'none'"
                  @click="toggleMuscle(m)"
                >{{ m }}</button>
              </div>
            </div>
          </div>
          <div class="picked">
            <div>
              <h3>Primary <span class="muted small">(the first one sets the ID)</span></h3>
              <p v-if="!form.primary.length" class="muted small">None yet</p>
              <span v-for="(m, i) in form.primary" :key="m" class="tag primary">
                <b v-if="i === 0" title="Sets the ID's body code">①</b>{{ m }}
                <button v-if="i > 0" type="button" aria-label="Make first" title="Make this the first muscle" @click="makeFirst(m)">↑</button>
                <button type="button" :aria-label="`Remove ${m}`" @click="removeMuscle(form.primary, m)">✕</button>
              </span>
            </div>
            <div>
              <h3>Secondary</h3>
              <p v-if="!form.secondary.length" class="muted small">None</p>
              <span v-for="m in form.secondary" :key="m" class="tag secondary">
                {{ m }}
                <button type="button" :aria-label="`Remove ${m}`" @click="removeMuscle(form.secondary, m)">✕</button>
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2>4. Classification</h2>
          <div class="field">
            <span>Tracking</span>
            <ChoiceButtons v-model="form.modality" :options="MODALITY_OPTIONS" aria-label="Tracking" />
          </div>
          <div class="grid2">
            <div class="field">
              <span>Level</span>
              <ChoiceButtons v-model="form.level" :options="LEVEL_OPTIONS" aria-label="Level" />
            </div>
            <div class="field">
              <span>Mechanic</span>
              <ChoiceButtons v-model="form.mechanic" :options="MECHANIC_OPTIONS" aria-label="Mechanic" />
            </div>
            <div class="field">
              <span>Force</span>
              <ChoiceButtons v-model="form.force" :options="FORCE_OPTIONS" aria-label="Force" />
            </div>
            <div class="field">
              <span>Sides</span>
              <ChoiceButtons v-model="form.laterality" :options="LATERALITY_OPTIONS" aria-label="Sides" />
            </div>
          </div>
          <div class="field">
            <span>Movement plane</span>
            <ChoiceButtons v-model="form.movementPlane" :options="PLANE_OPTIONS" aria-label="Movement plane" />
          </div>
          <div class="grid2">
            <label class="field">
              <span>Category</span>
              <input v-if="customCategory" v-model="form.category" type="text" placeholder="Type a new category" @input="categoryTouched = true" />
              <select v-else v-model="categoryChoice">
                <option value="" disabled>Choose…</option>
                <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
                <option :value="NEW_VALUE">Other (type a new one)…</option>
              </select>
            </label>
            <label v-if="showBodyPart" class="field">
              <span>Body part</span>
              <input v-if="customBodyPart" v-model="form.bodyPart" type="text" placeholder="Type a new body part" @input="bodyPartTouched = true" />
              <select v-else v-model="bodyPartChoice">
                <option value="" disabled>Choose…</option>
                <option v-for="c in bodyPartOptions" :key="c" :value="c">{{ c }}</option>
                <option :value="NEW_VALUE">Other (type a new one)…</option>
              </select>
            </label>
            <p v-else class="field same-body">
              <span>Body part</span>
              <b>{{ form.bodyPart || '…' }}</b> <span class="muted small">(same as the category)</span>
              <button type="button" class="link-btn small" @click="bodyPartOpen = true">Change</button>
            </p>
          </div>
          <div class="grid2">
            <label class="field">
              <span>Tempo</span>
              <input v-model="form.tempo" type="text" placeholder="2-0-2-0" />
            </label>
            <label class="field">
              <span>Reps shown in the video</span>
              <input v-model.number="form.reps" type="number" min="1" max="10" />
            </label>
          </div>
        </section>

        <section>
          <h2>5. Steps</h2>
          <p class="muted small">One clear sentence per step. These are also what gets translated.</p>
          <ListEditor v-model="form.steps" item-label="Step" add-label="+ Add step" :rows="2" numbered reorder />
        </section>

        <section>
          <h2>6. Coaching cues <span class="muted small">(optional)</span></h2>
          <p class="muted small">Short form tips, for example "Keep your chest up". The steps say what to do; cues say how to do it well or what to avoid.</p>
          <ListEditor v-model="form.cues" item-label="Cue" add-label="+ Add cue" :rows="2" />
        </section>

        <section v-if="mediaM && mediaF">
          <h2>7. Videos and images <span class="muted small">(optional)</span></h2>
          <p>
            A video is the best demonstration; without one, a still image is fine. Add the files to the exercise folder, next to
            <code>exercise.json</code>, with exactly these names. Add the version you have: the letter in each name says who is shown,
            <b>m</b> for a male model and <b>f</b> for a female model, and apps use it to show the right one.
          </p>
          <p class="muted small">
            <template v-if="editing">
              Open <a :href="folderUrl" target="_blank" rel="noopener">the exercise folder on GitHub ↗</a>, choose <b>Add file → Upload files</b>
              and drop the files in.
            </template>
            <template v-else>
              After GitHub opens your pull request, click your branch name at the top of it, open <code>exercises/{{ folder }}</code>, choose
              <b>Add file → Upload files</b> and drop the files in.
            </template>
          </p>

          <dl class="media-files">
            <div>
              <dt>Vertical video <span class="badge you">you add</span></dt>
              <dd>
                <ul class="by-model">
                <li>
                  <span class="who">Male (m)</span>
                  <CopyText :text="mediaM.video_vertical" what="file name" />
                  <span v-if="have(mediaM.video_vertical)" class="have">✓ in library</span>
                </li>
                <li>
                  <span class="who">Female (f)</span>
                  <CopyText :text="mediaF.video_vertical" what="file name" />
                  <span v-if="have(mediaF.video_vertical)" class="have">✓ in library</span>
                </li>
                </ul>
              </dd>
              <dd class="muted small">9:16, 720×1280. Made for phones. Recommended.</dd>
            </div>
            <div>
              <dt>Horizontal video <span class="badge you">you add, optional</span></dt>
              <dd>
                <ul class="by-model">
                <li>
                  <span class="who">Male (m)</span>
                  <CopyText :text="mediaM.video_horizontal" what="file name" />
                  <span v-if="have(mediaM.video_horizontal)" class="have">✓ in library</span>
                </li>
                <li>
                  <span class="who">Female (f)</span>
                  <CopyText :text="mediaF.video_horizontal" what="file name" />
                  <span v-if="have(mediaF.video_horizontal)" class="have">✓ in library</span>
                </li>
                </ul>
              </dd>
              <dd class="muted small">16:9, 1280×720. Made for the web and desktop.</dd>
            </div>
            <div>
              <dt>Animated preview <span class="badge auto">made from the video</span></dt>
              <dd>
                <ul class="by-model">
                <li>
                  <span class="who">Male (m)</span>
                  <CopyText :text="mediaM.animation_vertical" what="file name" />
                  <span v-if="have(mediaM.animation_vertical)" class="have">✓ in library</span>
                </li>
                <li>
                  <span class="who">Male (m)</span>
                  <CopyText :text="mediaM.animation_horizontal" what="file name" />
                  <span v-if="have(mediaM.animation_horizontal)" class="have">✓ in library</span>
                </li>
                <li>
                  <span class="who">Female (f)</span>
                  <CopyText :text="mediaF.animation_vertical" what="file name" />
                  <span v-if="have(mediaF.animation_vertical)" class="have">✓ in library</span>
                </li>
                <li>
                  <span class="who">Female (f)</span>
                  <CopyText :text="mediaF.animation_horizontal" what="file name" />
                  <span v-if="have(mediaF.animation_horizontal)" class="have">✓ in library</span>
                </li>
                </ul>
              </dd>
              <dd class="muted small">A short loop shown in exercise lists. Created by <code>pnpm media</code>.</dd>
            </div>
            <div>
              <dt>Thumbnail / still image <span class="badge auto">made from the video</span></dt>
              <dd>
                <ul class="by-model">
                <li>
                  <span class="who">Male (m)</span>
                  <CopyText :text="mediaM.thumbnail" what="file name" />
                  <span v-if="have(mediaM.thumbnail)" class="have">✓ in library</span>
                </li>
                <li>
                  <span class="who">Female (f)</span>
                  <CopyText :text="mediaF.thumbnail" what="file name" />
                  <span v-if="have(mediaF.thumbnail)" class="have">✓ in library</span>
                </li>
                </ul>
              </dd>
              <dd class="muted small">
                The still picture on the card, created from the video by <code>pnpm media</code>. No video? Add your own picture instead, as
                <code>.webp</code>, <code>.jpg</code> or <code>.png</code> with this name.
              </dd>
            </div>
          </dl>

          <p class="muted small">
            Videos: MP4 (H.264) without sound, 5 to 15 seconds, one or two clean repetitions that start and end in the same position so they
            loop, up to 2.5 MB. You only need to supply the videos: the previews and the thumbnail are created from your video automatically after the merge (or with <code>pnpm media</code> if you work locally).
          </p>
          <p v-if="editing" class="muted small">
            <template v-if="existingMedia.length">A file with the same name as one marked "in library" replaces it.</template>
            <template v-else>This exercise has no videos or images yet.</template>
          </p>
          <p class="muted small">
            See the <a :href="withBase('/guide/contributing')">contributing guide</a> and the
            <a :href="withBase('/guide/media')">media standards</a>.
          </p>
        </section>

        <section>
          <h2>
            <button type="button" class="link-btn" :aria-expanded="showRehab" @click="showRehab = !showRehab">
              {{ showRehab ? '▾' : '▸' }} Rehabilitation details <span class="muted small">(optional)</span>
            </button>
          </h2>
          <div v-if="showRehab" class="grid2">
            <label class="field">
              <span>Joint</span>
              <select v-model="form.rehab.joint">
                <option value="">not set</option>
                <option v-for="j in REHAB_JOINTS" :key="j" :value="j">{{ label(j) }}</option>
              </select>
            </label>
            <div class="field">
              <span>Target conditions</span>
              <ListEditor v-model="form.rehab.conditions" item-label="Condition" add-label="+ Add condition" />
            </div>
            <div class="field">
              <span>Contraindications</span>
              <ListEditor v-model="form.rehab.contraindications" item-label="Contraindication" add-label="+ Add contraindication" />
            </div>
            <label class="field">
              <span>Clinical protocol</span>
              <textarea v-model="form.rehab.protocol" rows="2" />
            </label>
          </div>
        </section>
      </form>

      <aside class="eg-out" aria-label="Result">
        <div class="card">
          <h2>Result</h2>
          <dl class="ids">
            <dt>ID</dt>
            <dd><CopyText v-if="id" :text="id" what="ID" /><span v-else class="mono">…</span></dd>
            <dt>Folder</dt>
            <dd>
              <template v-if="folder"><span class="mono muted">exercises/</span><CopyText :text="folder" what="folder name" /></template>
              <span v-else class="mono">…</span>
            </dd>
          </dl>
          <p v-if="!editing && prefix" class="muted small">
            <b>{{ prefix }}</b> comes from <b>{{ form.primary[0] }}</b> and <b>{{ form.equipment }}</b>; the number is the next free one.
          </p>
          <label v-if="!editing" class="field">
            <span>Slug (used in the folder and file names)</span>
            <input v-model="slugEdited" type="text" :placeholder="slugFromName(form.name) || 'from the name'" :maxlength="SLUG_MAX_LENGTH" />
          </label>

          <ul v-if="problems.length" class="problems">
            <li v-for="p in problems" :key="p">{{ p }}</li>
          </ul>
          <p v-else class="notice ok">✓ Passes the same checks as <code>pnpm validate</code>.</p>
          <ul v-if="warnings.length" class="warnings">
            <li v-for="w in warnings" :key="w">{{ w }}</li>
          </ul>

          <pre class="json" tabindex="0">{{ jsonText }}</pre>

          <div class="actions">
            <button type="button" class="btn" @click="copy">{{ copied ? 'Copied ✓' : 'Copy JSON' }}</button>
            <button type="button" class="btn" @click="download">Download</button>
            <a v-if="ready && !(urlTooLong && !editing)" class="btn primary" :href="githubUrl" target="_blank" rel="noopener" @click="onOpenGithub">
              {{ editing ? 'Edit on GitHub' : 'Create on GitHub' }} ↗
            </a>
            <span v-else class="btn primary disabled" aria-disabled="true">{{ editing ? 'Edit on GitHub' : 'Create on GitHub' }} ↗</span>
          </div>
          <p v-if="urlTooLong && !editing" class="notice warn">
            This is too long for a prefilled link. Copy the JSON, then create the file on GitHub yourself.
          </p>
          <p v-if="editCopied === true" class="notice ok">✓ JSON copied. In GitHub's editor, select all (Ctrl/Cmd + A), paste, then propose the change.</p>
          <p v-else-if="editCopied === false" class="notice warn">Could not copy automatically. Use Copy JSON, then paste it over the file in GitHub's editor.</p>
          <p v-else-if="editing" class="muted small">Clicking Edit on GitHub copies the JSON. In GitHub's editor, select all (Ctrl/Cmd + A), paste, then propose the change.</p>
          <p v-else class="muted small">GitHub forks the repository and opens the pull request for you. Then fill in its checklist; for media, confirm you have the rights.</p>
        </div>

      </aside>
    </div>
  </div>
</template>

<style scoped>
.eg {
  --r: 12px;
  --pad: 24px;
  padding: 16px var(--pad) 48px;
}
.muted {
  color: var(--vp-c-text-2);
}
.small {
  font-size: 13px;
}
.mono {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  word-break: break-all;
}
.eg-head h1 {
  font-size: 28px;
  margin: 0 0 6px;
  border: 0;
  padding: 0;
}
.eg-head p {
  margin: 4px 0;
  max-width: 760px;
}
.eg-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 540px);
  gap: 28px;
  align-items: start;
  margin-top: 16px;
}
.eg-form section {
  padding: 18px 0;
  border-top: 1px solid var(--vp-c-divider);
}
/* On wide screens the form flows into two columns next to the result, instead of one narrow column in the middle. */
@media (min-width: 1500px) {
  .eg-form {
    column-count: 2;
    column-gap: 48px;
  }
  .eg-form section {
    break-inside: avoid;
  }
}
.eg-form section:first-child {
  border-top: 0;
  padding-top: 0;
}
h2 {
  font-size: 17px;
  margin: 0 0 10px;
  border: 0;
  padding: 0;
  letter-spacing: 0;
}
h3 {
  font-size: 13px;
  margin: 0 0 6px;
}
button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
input,
select,
textarea {
  font: inherit;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 10px;
  width: 100%;
}
textarea {
  resize: vertical;
}
input:focus,
select:focus,
textarea:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
.field {
  display: block;
  margin-bottom: 12px;
}
.field > span {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}
.grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}
.btn {
  display: inline-block;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 14px;
  text-decoration: none;
  color: var(--vp-c-text-1);
}
.btn.primary {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}
.btn.primary.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.link-btn {
  background: none;
  border: 0;
  padding: 0;
  font-size: 17px;
  font-weight: 600;
}
.link-btn.small {
  font-size: 13px;
  font-weight: 400;
  color: var(--vp-c-brand-1);
  margin-left: 6px;
}
.same-body {
  margin: 0 0 12px;
}
.same-body > span:first-child {
  display: block;
}

/* equipment */
.equip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}
.equip-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  text-align: center;
}
.equip-tile:hover {
  border-color: var(--vp-c-brand-1);
}
.equip-tile[aria-pressed='true'] {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.equip-icon {
  display: grid;
  place-items: center;
  height: 26px;
}
.equip-name {
  font-size: 11px;
  line-height: 1.2;
  text-transform: capitalize;
}

/* muscles */
.muscle-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.map-wrap {
  max-width: 440px;
  margin: 8px 0;
}
.seg {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}
.seg button {
  border: 0;
  background: transparent;
  padding: 4px 10px;
  font-size: 12px;
}
.seg button + button {
  border-left: 1px solid var(--vp-c-divider);
}
.seg button[aria-pressed='true'] {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 12px;
}
.chip-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  text-transform: capitalize;
}
.picked {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 4px 2px 10px;
  margin: 0 6px 6px 0;
  text-transform: capitalize;
}
.tag button {
  border: 0;
  background: none;
  padding: 0 4px;
  font-size: 12px;
}
.tag.primary {
  background: rgb(229 72 77 / 16%);
  color: #c9343a;
}
.tag.secondary {
  background: rgb(245 184 61 / 20%);
  color: #9a6b00;
}
:global(.dark) .tag.primary {
  color: #ff8a8e;
}
:global(.dark) .tag.secondary {
  color: #f5c86a;
}

/* result */
.eg-out,
.card {
  min-width: 0;
}
.eg-out {
  position: sticky;
  top: calc(var(--vp-nav-height) + 12px);
  max-height: calc(100vh - var(--vp-nav-height) - 24px);
  overflow: auto;
  display: grid;
  gap: 14px;
}
.card {
  background: var(--vp-c-bg-soft);
  border-radius: var(--r);
  padding: 16px;
}
.ids {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  margin: 0 0 8px;
}
.ids dt {
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.ids dd {
  margin: 0;
}
.json {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 10px;
  font-size: 12px;
  line-height: 1.5;
  max-height: min(340px, 34vh);
  overflow: auto;
  margin: 10px 0;
  white-space: pre;
  max-width: 100%;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.problems,
.warnings {
  margin: 8px 0;
  padding-left: 18px;
  font-size: 13px;
}
.problems {
  color: var(--vp-c-danger-1);
}
.warnings {
  color: var(--vp-c-warning-1);
}
.notice {
  font-size: 13px;
  margin: 8px 0;
  padding: 6px 10px;
  border-radius: 8px;
}
.notice.ok {
  background: var(--vp-c-success-soft);
  color: var(--vp-c-success-1);
}
.notice.warn {
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}
.steps {
  padding-left: 18px;
  margin: 0 0 8px;
  font-size: 14px;
}
.steps li + li {
  margin-top: 8px;
}
.media-files {
  margin: 10px 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.media-files > div {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 10px;
}
.media-files dt {
  font-weight: 600;
  font-size: 13px;
}
.media-files dd {
  margin: 2px 0 0;
}
.by-model {
  list-style: none;
  padding: 0;
  margin: 6px 0 2px;
  display: grid;
  gap: 6px;
}
.by-model li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}
.who {
  flex: none;
  width: 76px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}
.have {
  font-size: 11px;
  color: var(--vp-c-success-1);
}
.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  border-radius: 999px;
  padding: 0 8px;
  margin-left: 6px;
  vertical-align: 1px;
}
.badge.you {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.badge.auto {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

@media (max-width: 900px) {
  .eg {
    --pad: 12px;
  }
  .eg-body {
    grid-template-columns: 1fr;
  }
  .eg-out {
    position: static;
    max-height: none;
  }
  .equip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .grid2,
  .picked,
  .media-files {
    grid-template-columns: 1fr;
  }
}

.muscle-body {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  margin: 8px 0;
}
.muscle-body .map-wrap {
  flex: 1 1 320px;
  max-width: 440px;
  margin: 0;
}
.muscle-side {
  flex: 1 1 200px;
  min-width: 0;
}
.muscle-side .chips {
  margin: 6px 0 0;
}
.chip-btn.primary {
  background: rgb(229 72 77 / 16%);
  border-color: #c9343a;
  color: #c9343a;
}
.chip-btn.secondary {
  background: rgb(245 184 61 / 20%);
  border-color: #9a6b00;
  color: #9a6b00;
}
</style>
