<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';

/**
 * Front/back muscle figure from the SparkyFitness web app (muscle-male.svg,
 * muscle-female.svg). Each region's class maps to a catalog muscle name through
 * the same table as @workspace/shared's svgClassToSchemaName.
 *
 * mode "filter": regions are clickable and show the selection.
 * mode "display": primary muscles red, secondary yellow, like the videos.
 */
const SVG_CLASS_TO_MUSCLE: Record<string, string> = {
  abdominal: 'abdominals',
  obliques: 'abdominals',
  lowerback: 'lower back',
  quads: 'quadriceps',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  shoulders: 'shoulders',
  traps: 'traps',
  triceps: 'triceps',
};

const props = withDefaults(
  defineProps<{
    figure: 'male' | 'female';
    mode?: 'filter' | 'display';
    selected?: string[];
    available?: string[];
    primary?: string[];
    secondary?: string[];
  }>(),
  { mode: 'filter', selected: () => [], available: () => [], primary: () => [], secondary: () => [] }
);
const emit = defineEmits<{ toggle: [muscle: string] }>();

const host = ref<HTMLDivElement | null>(null);
const hovered = ref('');
const svgCache: Record<string, string> = {};

async function load() {
  const url = withBase(`/images/muscle-${props.figure}.svg`);
  if (!svgCache[props.figure]) {
    svgCache[props.figure] = await (await fetch(url)).text();
  }
  if (!host.value) return;
  host.value.innerHTML = svgCache[props.figure];
  host.value.querySelectorAll<SVGPathElement>('path[class]').forEach((p) => {
    const muscle = SVG_CLASS_TO_MUSCLE[p.getAttribute('class') ?? ''];
    if (muscle) p.dataset.muscle = muscle;
  });
  paint();
}

function paint() {
  if (!host.value) return;
  host.value.querySelectorAll<SVGPathElement>('path[data-muscle]').forEach((p) => {
    const m = p.dataset.muscle!;
    const cls = p.classList;
    if (props.mode === 'display') {
      cls.toggle('is-primary', props.primary.includes(m));
      cls.toggle('is-secondary', !props.primary.includes(m) && props.secondary.includes(m));
    } else {
      cls.toggle('is-available', props.available.includes(m));
      cls.toggle('is-selected', props.selected.includes(m));
      cls.toggle('is-hover', hovered.value === m);
    }
  });
}

function muscleAt(e: Event): string | null {
  const t = (e.target as Element | null)?.closest?.('path[data-muscle]') as SVGPathElement | null;
  return t?.dataset.muscle ?? null;
}
function onClick(e: Event) {
  if (props.mode !== 'filter') return;
  const m = muscleAt(e);
  if (m && props.available.includes(m)) emit('toggle', m);
}
function onMove(e: Event) {
  if (props.mode !== 'filter') return;
  const m = muscleAt(e) ?? '';
  if (m !== hovered.value) {
    hovered.value = m;
    paint();
  }
}

onMounted(load);
watch(() => props.figure, load);
watch(() => [props.selected, props.available, props.primary, props.secondary], paint, { deep: true });
</script>

<template>
  <div
    ref="host"
    class="body-map"
    :class="mode"
    role="img"
    :aria-label="mode === 'filter' ? 'Muscle map: click a muscle to filter' : 'Muscles worked'"
    @click="onClick"
    @mousemove="onMove"
    @mouseleave="hovered = ''; paint()"
  />
  <p v-if="mode === 'filter'" class="hover-label" :class="{ named: hovered }">{{ hovered || 'Click a muscle to filter' }}</p>
</template>

<style scoped>
.body-map :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}
.body-map :deep(path[data-muscle]) {
  fill: var(--bm-idle);
  stroke: var(--bm-stroke);
  stroke-width: 0.5;
  transition: fill 0.15s ease;
}
.body-map.filter :deep(path.is-available) {
  fill: var(--bm-available);
  cursor: pointer;
}
.body-map.filter :deep(path.is-available.is-hover) {
  fill: var(--bm-hover);
}
.body-map.filter :deep(path.is-selected) {
  fill: var(--vp-c-brand-1);
}
.body-map.display :deep(path.is-primary) {
  fill: #e5484d;
}
.body-map.display :deep(path.is-secondary) {
  fill: #f5b83d;
}
.body-map {
  --bm-idle: #c8ccd3;
  --bm-available: #a9b0bb;
  --bm-hover: #7fb2f0;
  --bm-stroke: #4b5260;
}
:global(.dark) .body-map {
  --bm-idle: #3a3f4a;
  --bm-available: #5c6372;
  --bm-hover: #4f7fc0;
  --bm-stroke: #12151a;
}
.hover-label {
  text-align: center;
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin: 4px 0 0;
  min-height: 18px;
}
.hover-label.named {
  text-transform: capitalize;
}
</style>
