<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import BodyMap from './BodyMap.vue';
import { equipmentIconSvg } from './equipmentIcons';

interface Media {
  video_path?: string | null;
  video_vertical_path?: string | null;
  video_horizontal_path?: string | null;
  animation_path?: string | null;
  animation_vertical_path?: string | null;
  animation_horizontal_path?: string | null;
  thumbnail_path?: string | null;
  image_path?: string | null;
}
interface Exercise {
  id: string;
  folder: string;
  name: string;
  aliases?: string[];
  taxonomy: {
    modality: string;
    category: string;
    body_part: string;
    mechanic: string;
    force: string | null;
    level: string;
    equipment: string;
    primary_muscles: string[];
    secondary_muscles: string[];
  };
  biomechanics?: { laterality?: string; movement_plane?: string; default_tempo?: string };
  steps?: string[];
  coaching_cues?: string[];
  media?: Media;
}
interface LocaleEntry {
  name?: string;
  steps?: string[];
  coaching_cues?: string[];
}

const LANGS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  pl: 'Polski',
  tr: 'Türkçe',
  hi: 'हिन्दी',
  zh: '中文',
  ko: '한국어',
};
const MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms', 'glutes',
  'hamstrings', 'lats', 'lower back', 'middle back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
];
const DRAWN = new Set([
  'abdominals', 'biceps', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
  'lower back', 'quadriceps', 'shoulders', 'traps', 'triceps',
]);
const SELECTS = [
  { key: 'category', label: 'Category', get: (e: Exercise) => e.taxonomy.category },
  { key: 'body_part', label: 'Body part', get: (e: Exercise) => e.taxonomy.body_part },
  { key: 'level', label: 'Level', get: (e: Exercise) => e.taxonomy.level },
  { key: 'mechanic', label: 'Mechanic', get: (e: Exercise) => e.taxonomy.mechanic },
  { key: 'force', label: 'Force', get: (e: Exercise) => e.taxonomy.force },
  { key: 'modality', label: 'Tracking', get: (e: Exercise) => e.taxonomy.modality },
  { key: 'laterality', label: 'Laterality', get: (e: Exercise) => e.biomechanics?.laterality },
] as const;
type SelectKey = (typeof SELECTS)[number]['key'];
const PAGE = 48;

const all = ref<Exercise[]>([]);
const loading = ref(true);
const error = ref('');
const locale = ref<Record<string, LocaleEntry>>({});

const state = reactive({
  q: '',
  lang: 'en',
  media: '' as '' | 'video' | 'none',
  equipment: [] as string[],
  muscles: [] as string[],
  role: 'primary' as 'primary' | 'any',
  figure: 'male' as 'male' | 'female',
  selects: Object.fromEntries(SELECTS.map((s) => [s.key, ''])) as Record<SelectKey, string>,
});
const limit = ref(PAGE);
const showFilters = ref(false);

/* ---------- helpers ---------- */
const media = (p?: string | null) => (p ? withBase('/' + p) : '');
const label = (v?: string | null) => (v ? v.replace(/_/g, ' ') : '—');
const tName = (e: Exercise) => locale.value[e.id]?.name || e.name;
const hasVideo = (e: Exercise) => !!(e.media?.video_path || e.media?.video_vertical_path || e.media?.video_horizontal_path);
const hasMedia = (e: Exercise) => hasVideo(e) || !!(e.media?.thumbnail_path || e.media?.animation_path || e.media?.image_path);
const icon = (eq: string, size = 20) => equipmentIconSvg(eq, size);
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/* ---------- filtering ---------- */
function matches(e: Exercise, skip?: string): boolean {
  const t = e.taxonomy;
  if (state.q) {
    const q = norm(state.q.trim());
    const hay = norm([e.name, tName(e), e.id, ...(e.aliases ?? [])].join(' '));
    if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  if (state.media === 'video' && !hasVideo(e)) return false;
  if (state.media === 'none' && hasMedia(e)) return false;
  if (skip !== 'equipment' && state.equipment.length && !state.equipment.includes(t.equipment)) return false;
  if (skip !== 'muscles' && state.muscles.length) {
    const pool = state.role === 'any' ? [...t.primary_muscles, ...t.secondary_muscles] : t.primary_muscles;
    if (!state.muscles.some((m) => pool.includes(m))) return false;
  }
  for (const s of SELECTS) {
    if (s.key !== skip && state.selects[s.key] && s.get(e) !== state.selects[s.key]) return false;
  }
  return true;
}
// Exercises with a video come first so they are easy to find; the rest keep catalog order.
const filtered = computed(() =>
  all.value
    .filter((e) => matches(e))
    .sort((a, b) => Number(hasVideo(b)) - Number(hasVideo(a)))
);
const visible = computed(() => filtered.value.slice(0, limit.value));

function countsFor(key: string, get: (e: Exercise) => string | string[] | null | undefined) {
  const c = new Map<string, number>();
  for (const e of all.value) {
    if (!matches(e, key)) continue;
    const v = get(e);
    for (const x of Array.isArray(v) ? v : [v]) if (x) c.set(x, (c.get(x) ?? 0) + 1);
  }
  return c;
}
const selectOptions = computed(() =>
  Object.fromEntries(
    SELECTS.map((s) => {
      const counts = countsFor(s.key, s.get);
      const values = [...new Set(all.value.map(s.get).filter(Boolean) as string[])].sort();
      return [s.key, values.map((v) => ({ value: v, count: counts.get(v) ?? 0 }))];
    })
  ) as Record<SelectKey, { value: string; count: number }[]>
);
const equipmentOptions = computed(() => {
  const counts = countsFor('equipment', (e) => e.taxonomy.equipment);
  const values = [...new Set(all.value.map((e) => e.taxonomy.equipment))].sort();
  return values.map((v) => ({ value: v, count: counts.get(v) ?? 0 }));
});
const muscleCounts = computed(() =>
  countsFor('muscles', (e) =>
    state.role === 'any' ? [...e.taxonomy.primary_muscles, ...e.taxonomy.secondary_muscles] : e.taxonomy.primary_muscles
  )
);
const availableMuscles = computed(() => MUSCLES.filter((m) => (muscleCounts.value.get(m) ?? 0) > 0));
const undrawnMuscles = MUSCLES.filter((m) => !DRAWN.has(m));
const activeCount = computed(
  () =>
    state.equipment.length +
    state.muscles.length +
    (state.media ? 1 : 0) +
    Object.values(state.selects).filter(Boolean).length
);

function toggle(list: string[], v: string) {
  const i = list.indexOf(v);
  if (i >= 0) list.splice(i, 1);
  else list.push(v);
}
function reset() {
  state.q = '';
  state.media = '';
  state.equipment.splice(0);
  state.muscles.splice(0);
  for (const s of SELECTS) state.selects[s.key] = '';
}

/* ---------- detail ---------- */
const dialog = ref<HTMLDialogElement | null>(null);
const current = ref<Exercise | null>(null);
const view = reactive({ kind: 'video' as 'video' | 'animation' | 'image', orient: 'vertical' as 'vertical' | 'horizontal' });

const sources = computed(() => {
  const m = current.value?.media ?? {};
  return {
    video: {
      vertical: m.video_vertical_path || m.video_path || '',
      horizontal: m.video_horizontal_path || '',
    },
    animation: {
      vertical: m.animation_vertical_path || m.animation_path || '',
      horizontal: m.animation_horizontal_path || '',
    },
    image: { vertical: m.image_path || m.thumbnail_path || '', horizontal: '' },
  };
});
const kinds = computed(() =>
  (['video', 'animation', 'image'] as const).filter((k) => sources.value[k].vertical || sources.value[k].horizontal)
);
const orients = computed(() =>
  (['vertical', 'horizontal'] as const).filter((o) => sources.value[view.kind]?.[o])
);
const src = computed(() => media(sources.value[view.kind]?.[view.orient] || ''));
const tSteps = computed(() => (current.value && locale.value[current.value.id]?.steps) || current.value?.steps || []);
const tCues = computed(
  () => (current.value && locale.value[current.value.id]?.coaching_cues) || current.value?.coaching_cues || []
);

function open(e: Exercise) {
  current.value = e;
  view.kind = kinds.value[0] ?? 'video';
  view.orient = orients.value[0] ?? 'vertical';
  if (!dialog.value?.open) dialog.value?.showModal();
  syncUrl();
}
function close() {
  current.value = null;
  syncUrl();
}
watch(
  () => view.kind,
  () => {
    if (!orients.value.includes(view.orient)) view.orient = orients.value[0] ?? 'vertical';
  }
);

/* ---------- language ---------- */
async function loadLocale(lang: string) {
  if (lang === 'en') {
    locale.value = {};
    return;
  }
  try {
    locale.value = await (await fetch(withBase(`/locales/${lang}/exercises.json`))).json();
  } catch {
    locale.value = {};
  }
}
watch(() => state.lang, loadLocale);

/* ---------- URL state ---------- */
function syncUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.lang !== 'en') p.set('lang', state.lang);
  if (state.media) p.set('media', state.media);
  if (state.equipment.length) p.set('equipment', state.equipment.join(','));
  if (state.muscles.length) p.set('muscles', state.muscles.join(','));
  if (state.role !== 'primary') p.set('role', state.role);
  if (state.figure !== 'male') p.set('figure', state.figure);
  for (const s of SELECTS) if (state.selects[s.key]) p.set(s.key, state.selects[s.key]);
  if (current.value) p.set('ex', current.value.id);
  const qs = p.toString();
  history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : ''));
}
function readUrl() {
  const p = new URLSearchParams(location.search);
  state.q = p.get('q') ?? '';
  state.lang = LANGS[p.get('lang') ?? ''] ? p.get('lang')! : 'en';
  const m = p.get('media');
  state.media = m === 'video' || m === 'none' ? m : '';
  state.equipment = (p.get('equipment') ?? '').split(',').filter(Boolean);
  state.muscles = (p.get('muscles') ?? '').split(',').filter(Boolean);
  state.role = p.get('role') === 'any' ? 'any' : 'primary';
  state.figure = p.get('figure') === 'female' ? 'female' : 'male';
  for (const s of SELECTS) state.selects[s.key] = p.get(s.key) ?? '';
  return p.get('ex');
}
watch(
  () => [state.q, state.lang, state.media, state.equipment, state.muscles, state.role, state.figure, state.selects],
  () => {
    limit.value = PAGE;
    syncUrl();
  },
  { deep: true }
);

/* ---------- infinite scroll ---------- */
const sentinel = ref<HTMLElement | null>(null);
let io: IntersectionObserver | null = null;

onMounted(async () => {
  const ex = readUrl();
  try {
    const res = await fetch(withBase('/data/exercises.json'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    all.value = await res.json();
  } catch (err) {
    error.value = `Could not load the catalog (${(err as Error).message}).`;
  } finally {
    loading.value = false;
  }
  await loadLocale(state.lang);
  await nextTick();
  if (ex) {
    const found = all.value.find((e) => e.id === ex);
    if (found) open(found);
  }
  io = new IntersectionObserver((entries) => {
    if (entries.some((x) => x.isIntersecting) && limit.value < filtered.value.length) limit.value += PAGE;
  }, { rootMargin: '600px' });
  if (sentinel.value) io.observe(sentinel.value);
});
onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <div class="xb">
    <div class="xb-top">
      <div class="search">
        <input v-model="state.q" type="search" placeholder="Search 1,900+ exercises by name, alias or ID" aria-label="Search exercises" />
      </div>
      <select v-model="state.lang" aria-label="Language" class="lang">
        <option v-for="(name, code) in LANGS" :key="code" :value="code">{{ name }}</option>
      </select>
      <button type="button" class="btn only-mobile" :aria-expanded="showFilters" @click="showFilters = !showFilters">
        Filters<span v-if="activeCount"> ({{ activeCount }})</span>
      </button>
    </div>

    <div class="xb-body">
      <aside class="xb-filters" :class="{ open: showFilters }" aria-label="Filters">
        <div class="fhead">
          <strong>Filters</strong>
          <button v-if="activeCount" type="button" class="link" @click="reset">Reset ({{ activeCount }})</button>
        </div>

        <section>
          <div class="sec-head">
            <h4>Muscles</h4>
            <div class="seg small" role="group" aria-label="Figure">
              <button type="button" :aria-pressed="state.figure === 'male'" @click="state.figure = 'male'">Male</button>
              <button type="button" :aria-pressed="state.figure === 'female'" @click="state.figure = 'female'">Female</button>
            </div>
          </div>
          <BodyMap
            :figure="state.figure"
            mode="filter"
            :selected="state.muscles"
            :available="availableMuscles"
            @toggle="(m) => toggle(state.muscles, m)"
          />
          <div class="chips">
            <button
              v-for="m in undrawnMuscles"
              :key="m"
              type="button"
              class="chip-btn"
              :aria-pressed="state.muscles.includes(m)"
              :disabled="!muscleCounts.get(m)"
              @click="toggle(state.muscles, m)"
            >
              {{ m }}
            </button>
          </div>
          <div v-if="state.muscles.length" class="chips selected">
            <button v-for="m in state.muscles" :key="m" type="button" class="chip-btn on" @click="toggle(state.muscles, m)">
              {{ m }} ✕
            </button>
          </div>
          <div class="seg small full" role="group" aria-label="Muscle role">
            <button type="button" :aria-pressed="state.role === 'primary'" @click="state.role = 'primary'">Primary only</button>
            <button type="button" :aria-pressed="state.role === 'any'" @click="state.role = 'any'">Primary + secondary</button>
          </div>
        </section>

        <section>
          <h4>Equipment</h4>
          <div class="equip">
            <button
              v-for="o in equipmentOptions"
              :key="o.value"
              type="button"
              class="equip-tile"
              :aria-pressed="state.equipment.includes(o.value)"
              :disabled="!o.count && !state.equipment.includes(o.value)"
              :title="`${o.value} (${o.count})`"
              @click="toggle(state.equipment, o.value)"
            >
              <span class="equip-icon" v-html="icon(o.value, 26)" />
              <span class="equip-name">{{ o.value }}</span>
              <span class="equip-count">{{ o.count }}</span>
            </button>
          </div>
        </section>

        <section>
          <h4>Media</h4>
          <div class="seg small full" role="group" aria-label="Media">
            <button type="button" :aria-pressed="state.media === ''" @click="state.media = ''">All</button>
            <button type="button" :aria-pressed="state.media === 'video'" @click="state.media = 'video'">With video</button>
            <button type="button" :aria-pressed="state.media === 'none'" @click="state.media = 'none'">No media</button>
          </div>
        </section>

        <section class="selects">
          <label v-for="s in SELECTS" :key="s.key">
            <span>{{ s.label }}</span>
            <select v-model="state.selects[s.key]">
              <option value="">Any</option>
              <option v-for="o in selectOptions[s.key]" :key="o.value" :value="o.value" :disabled="!o.count">
                {{ label(o.value) }} ({{ o.count }})
              </option>
            </select>
          </label>
        </section>
      </aside>

      <section class="xb-results" aria-live="polite">
        <p v-if="loading" class="muted">Loading exercises…</p>
        <p v-else-if="error" class="muted">{{ error }}</p>
        <template v-else>
          <p class="muted count">{{ filtered.length.toLocaleString() }} of {{ all.length.toLocaleString() }} exercises</p>
          <ul class="grid">
            <li v-for="e in visible" :key="e.id" class="card">
              <button type="button" @click="open(e)">
                <div class="thumb">
                  <img v-if="e.media?.thumbnail_path" :src="media(e.media.thumbnail_path)" :alt="tName(e)" loading="lazy" />
                  <div v-else class="ph">
                    <span class="ph-icon" v-html="icon(e.taxonomy.equipment, 40)" />
                    <span>{{ e.taxonomy.primary_muscles.join(', ') }}</span>
                  </div>
                  <span v-if="hasVideo(e)" class="badge">▶ Video</span>
                </div>
                <div class="card-body">
                  <h3>{{ tName(e) }}</h3>
                  <p class="meta">
                    <span class="mini-icon" v-html="icon(e.taxonomy.equipment, 14)" />
                    {{ e.taxonomy.equipment }} · {{ e.taxonomy.level }}
                  </p>
                </div>
              </button>
            </li>
          </ul>
          <p v-if="!filtered.length" class="muted empty">No exercises match these filters.</p>
        </template>
        <div ref="sentinel" class="sentinel" aria-hidden="true" />
      </section>
    </div>

    <dialog ref="dialog" class="xb-dialog" aria-labelledby="xb-title" @close="close" @click.self="dialog?.close()">
      <div v-if="current" class="detail">
        <button type="button" class="close" aria-label="Close" @click="dialog?.close()">✕</button>
        <div class="viewer">
          <div class="media-box" :class="view.orient">
            <video
              v-if="view.kind === 'video' && src"
              :key="src"
              :src="src"
              controls
              autoplay
              muted
              loop
              playsinline
            />
            <img v-else-if="src" :key="src" :src="src" :alt="tName(current)" />
            <div v-else class="ph big">
              <span class="ph-icon" v-html="icon(current.taxonomy.equipment, 64)" />
              <span>No video yet</span>
            </div>
          </div>
          <div v-if="kinds.length" class="controls">
            <div class="seg small" role="group" aria-label="Media type">
              <button v-for="k in kinds" :key="k" type="button" :aria-pressed="view.kind === k" @click="view.kind = k">
                {{ k === 'video' ? 'Video' : k === 'animation' ? 'Animation' : 'Image' }}
              </button>
            </div>
            <div v-if="orients.length > 1" class="seg small" role="group" aria-label="Orientation">
              <button v-for="o in orients" :key="o" type="button" :aria-pressed="view.orient === o" @click="view.orient = o">
                {{ o === 'vertical' ? '9:16' : '16:9' }}
              </button>
            </div>
          </div>
          <div class="detail-map">
            <div class="detail-map-header">
              <span class="detail-map-title">Target muscles</span>
              <div class="seg small" role="group" aria-label="Body model">
                <button type="button" :aria-pressed="state.figure === 'male'" @click="state.figure = 'male'">Male</button>
                <button type="button" :aria-pressed="state.figure === 'female'" @click="state.figure = 'female'">Female</button>
              </div>
            </div>
            <BodyMap
              :figure="state.figure"
              mode="display"
              :primary="current.taxonomy.primary_muscles"
              :secondary="current.taxonomy.secondary_muscles"
            />
            <p class="legend"><span class="dot p" /> Primary <span class="dot s" /> Secondary</p>
          </div>
        </div>

        <div class="info">
          <p class="muted mono">{{ current.id }}</p>
          <h2 id="xb-title">{{ tName(current) }}</h2>
          <p v-if="current.aliases?.length" class="muted">Also: {{ current.aliases.join(', ') }}</p>

          <div class="tags">
            <span class="tag equip-tag"><span v-html="icon(current.taxonomy.equipment, 16)" /> {{ current.taxonomy.equipment }}</span>
            <span v-for="m in current.taxonomy.primary_muscles" :key="'p' + m" class="tag primary">{{ m }}</span>
            <span v-for="m in current.taxonomy.secondary_muscles" :key="'s' + m" class="tag secondary">{{ m }}</span>
          </div>

          <dl class="attrs">
            <dt>Category</dt><dd>{{ label(current.taxonomy.category) }}</dd>
            <dt>Body part</dt><dd>{{ label(current.taxonomy.body_part) }}</dd>
            <dt>Level</dt><dd>{{ label(current.taxonomy.level) }}</dd>
            <dt>Mechanic</dt><dd>{{ label(current.taxonomy.mechanic) }}</dd>
            <dt>Force</dt><dd>{{ label(current.taxonomy.force) }}</dd>
            <dt>Tracking</dt><dd>{{ label(current.taxonomy.modality) }}</dd>
            <template v-if="current.biomechanics">
              <dt>Laterality</dt><dd>{{ label(current.biomechanics.laterality) }}</dd>
              <dt>Plane</dt><dd>{{ label(current.biomechanics.movement_plane) }}</dd>
              <dt>Tempo</dt><dd>{{ current.biomechanics.default_tempo || '—' }}</dd>
            </template>
          </dl>

          <h3>Steps</h3>
          <ol>
            <li v-for="(s, i) in tSteps" :key="i">{{ s }}</li>
          </ol>
          <template v-if="tCues.length">
            <h3>Coaching cues</h3>
            <ul>
              <li v-for="(c, i) in tCues" :key="i">{{ c }}</li>
            </ul>
          </template>
          <p class="muted small">
            <a :href="`https://github.com/CodeWithCJ/SparkyFitnessExerciseLibrary/tree/main/exercises/${current.folder}`" target="_blank" rel="noopener">
              View on GitHub
            </a>
          </p>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.xb {
  --r: 12px;
  margin-top: 8px;
}
.muted {
  color: var(--vp-c-text-2);
}
.small {
  font-size: 13px;
}
.mono {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  margin: 0;
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
select {
  font: inherit;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 10px;
}
input:focus,
select:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}

/* top bar */
.xb-top {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}
.search {
  flex: 1;
}
.search input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  border-radius: 10px;
}
.btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: 8px;
  padding: 8px 12px;
}
.link {
  background: none;
  border: 0;
  padding: 0;
  color: var(--vp-c-brand-1);
  font-size: 13px;
}
.only-mobile {
  display: none;
}

/* layout */
.xb-body {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.xb-filters {
  position: sticky;
  top: calc(var(--vp-nav-height) + 16px);
  max-height: calc(100vh - var(--vp-nav-height) - 32px);
  overflow: auto;
  background: var(--vp-c-bg-soft);
  border-radius: var(--r);
  padding: 16px;
}
.fhead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.xb-filters section {
  padding: 12px 0;
  border-top: 1px solid var(--vp-c-divider);
}
.xb-filters section:first-of-type {
  border-top: 0;
}
.xb-filters h4 {
  margin: 0 0 8px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
}
.sec-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sec-head h4 {
  margin: 0;
}

/* segmented */
.seg {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}
.seg.full {
  display: flex;
  margin-top: 8px;
}
.seg.full button {
  flex: 1;
}
.seg button {
  border: 0;
  background: transparent;
  padding: 6px 10px;
  font-size: 13px;
}
.seg.small button {
  padding: 4px 8px;
  font-size: 12px;
}
.seg button + button {
  border-left: 1px solid var(--vp-c-divider);
}
.seg button[aria-pressed='true'] {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

/* chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.chip-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  text-transform: capitalize;
}
.chip-btn[aria-pressed='true'],
.chip-btn.on {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* equipment tiles */
.equip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  transition: border-color 0.15s, background 0.15s;
}
.equip-tile:hover:not(:disabled) {
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
  height: 28px;
}
.equip-name {
  font-size: 11px;
  line-height: 1.2;
  text-transform: capitalize;
}
.equip-count {
  font-size: 10px;
  color: var(--vp-c-text-3);
}

.selects label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
}
.selects span {
  display: block;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}
.selects select {
  width: 100%;
  text-transform: capitalize;
}

/* results */
.count {
  margin: 0 0 12px;
}
.grid {
  list-style: none;
  margin: 0 !important;
  padding: 0 !important;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
}
.grid li {
  margin: 0 !important;
}
.card {
  background: var(--vp-c-bg-soft);
  border-radius: var(--r);
  overflow: hidden;
  border: 1px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
}
.card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
.card > button {
  all: unset;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.card > button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -2px;
}
.thumb {
  position: relative;
  aspect-ratio: 1;
  background: var(--vp-c-bg-alt);
  display: grid;
  place-items: center;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ph {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  text-align: center;
  padding: 12px;
  text-transform: capitalize;
}
.ph-icon {
  color: var(--vp-c-text-2);
  opacity: 0.6;
}
.badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  padding: 2px 8px;
}
.card-body {
  padding: 10px 12px 12px;
}
.card-body h3 {
  margin: 0 0 4px !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: 14px !important;
  line-height: 1.3 !important;
  letter-spacing: 0 !important;
}
.meta {
  margin: 0 !important;
  font-size: 12px !important;
  line-height: 1.4 !important;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  gap: 4px;
  text-transform: capitalize;
}
.mini-icon {
  display: inline-grid;
}
.empty {
  text-align: center;
  padding: 48px 0;
}
.sentinel {
  height: 1px;
}

/* dialog */
.xb-dialog {
  width: min(1100px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  padding: 0;
  border: 0;
  border-radius: 16px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: var(--vp-shadow-5);
}
.xb-dialog::backdrop {
  background: rgb(0 0 0 / 60%);
}
.detail {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 28px;
  padding: 24px;
}
.close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 0;
  background: var(--vp-c-bg-soft);
  z-index: 2;
}
.media-box {
  background: #000;
  border-radius: var(--r);
  overflow: hidden;
  display: grid;
  place-items: center;
  min-height: 280px;
}
.media-box video,
.media-box img {
  display: block;
  max-width: 100%;
  max-height: 62vh;
}
.ph.big {
  color: #9aa3b2;
  padding: 48px;
}
.ph.big .ph-icon {
  color: #9aa3b2;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.detail-map {
  max-width: 320px;
  margin: 20px auto 0;
}
.detail-map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.detail-map-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
}
.legend {
  text-align: center;
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin: 4px 0 0;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin: 0 4px 0 10px;
  vertical-align: -1px;
}
.dot.p {
  background: #e5484d;
}
.dot.s {
  background: #f5b83d;
}
.info h2 {
  margin: 4px 0 4px !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: 26px !important;
  line-height: 1.25 !important;
}
.info h3 {
  margin: 20px 0 8px !important;
  font-size: 16px !important;
}
.info p {
  margin: 0;
}
.info ol,
.info ul {
  padding-left: 22px;
  margin: 0;
}
.info ol {
  list-style: decimal;
}
.info ul {
  list-style: disc;
}
.info li + li {
  margin-top: 6px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  border-radius: 999px;
  padding: 3px 10px;
  background: var(--vp-c-bg-soft);
  text-transform: capitalize;
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
.attrs {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 20px;
  margin: 8px 0 0;
  font-size: 14px;
}
.attrs dt {
  color: var(--vp-c-text-2);
}
.attrs dd {
  margin: 0;
  text-transform: capitalize;
}

@media (max-width: 860px) {
  .only-mobile {
    display: inline-block;
  }
  .lang {
    max-width: 110px;
  }
  .xb-body {
    grid-template-columns: 1fr;
  }
  .xb-filters {
    position: static;
    max-height: none;
    display: none;
  }
  .xb-filters.open {
    display: block;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .detail {
    grid-template-columns: 1fr;
    padding: 16px;
  }
}
</style>
