<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import { EXTRA_REGIONS, SVG_CLASS_TO_MUSCLE, nextUid } from './bodyMapData';

/**
 * Front/back muscle figure from the SparkyFitness web app (muscle-male.svg,
 * muscle-female.svg). Each region's class maps to a catalog muscle name through
 * the same table as @workspace/shared's svgClassToSchemaName.
 *
 * mode "filter": regions are clickable and show the selection.
 * mode "display": primary muscles red, secondary yellow, like the videos.
 * mode "select": like display, but every muscle is clickable (used to build an exercise).
 */

const props = withDefaults(
  defineProps<{
    figure: 'male' | 'female';
    mode?: 'filter' | 'display' | 'select';
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
  addExtraRegions();
  paint();
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag: string, attrs: Record<string, string> = {}) => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

/**
 * Adds the regions the original figure does not draw (neck, middle back, abductors, adductors).
 * They are clipped to the figure's own muscle shapes, so they cannot spill outside the body and they
 * follow the muscle edges, and primary/secondary use diagonal stripes so a region laid over a colored
 * muscle never blends into a third color.
 */
function addExtraRegions() {
  const svg = host.value?.querySelector('svg');
  if (!svg) return;
  const uid = nextUid();

  const defs = svgEl('defs');
  const clip = svgEl('clipPath', { id: `bm-clip-${uid}` });
  svg.querySelectorAll('path').forEach((orig) => {
    if (orig.getAttribute('fill') === '#f5f5f5') return; // the white outline behind the figure
    const copy = svgEl('path', { d: orig.getAttribute('d') ?? '' });
    clip.appendChild(copy);
  });
  defs.appendChild(clip);
  for (const [name, color] of [['primary', '#e5484d'], ['secondary', '#f5b83d']]) {
    const pattern = svgEl('pattern', {
      id: `bm-hatch-${name}-${uid}`,
      patternUnits: 'userSpaceOnUse',
      width: '5',
      height: '5',
      patternTransform: 'rotate(45)',
    });
    pattern.appendChild(svgEl('rect', { width: '5', height: '5', fill: color, 'fill-opacity': '0.28' }));
    pattern.appendChild(svgEl('rect', { width: '2.4', height: '5', fill: color, 'fill-opacity': '0.95' }));
    defs.appendChild(pattern);
    svg.style.setProperty(`--bm-hatch-${name}`, `url(#bm-hatch-${name}-${uid})`);
  }
  svg.insertBefore(defs, svg.firstChild);

  const group = svgEl('g', { 'clip-path': `url(#bm-clip-${uid})` });
  for (const r of EXTRA_REGIONS[props.figure]) {
    const path = svgEl('path', { d: r.d, class: `${r.cls} extra` });
    path.dataset.muscle = SVG_CLASS_TO_MUSCLE[r.cls];
    group.appendChild(path);
  }
  svg.appendChild(group);
}

function paint() {
  if (!host.value) return;
  host.value.querySelectorAll<SVGPathElement>('path[data-muscle]').forEach((p) => {
    const m = p.dataset.muscle!;
    const cls = p.classList;
    if (props.mode !== 'filter') {
      cls.toggle('is-primary', props.primary.includes(m));
      cls.toggle('is-secondary', !props.primary.includes(m) && props.secondary.includes(m));
      cls.toggle('is-hover', props.mode === 'select' && hovered.value === m);
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
  if (props.mode === 'display') return;
  const m = muscleAt(e);
  if (m && (props.mode === 'select' || props.available.includes(m))) emit('toggle', m);
}
function onMove(e: Event) {
  if (props.mode === 'display') return;
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
    :aria-label="mode === 'filter' ? 'Muscle map: click a muscle to filter' : mode === 'select' ? 'Muscle map: click a muscle to select it' : 'Muscles worked'"
    @click="onClick"
    @mousemove="onMove"
    @mouseleave="hovered = ''; paint()"
  />
  <p v-if="mode !== 'display'" class="hover-label" :class="{ named: hovered }">
    {{ hovered || (mode === 'select' ? 'Click a muscle to select it' : 'Click a muscle to filter') }}
  </p>
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
.body-map.display :deep(path.is-primary),
.body-map.select :deep(path.is-primary) {
  fill: #e5484d;
}
.body-map.display :deep(path.is-secondary),
.body-map.select :deep(path.is-secondary) {
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
.body-map.select :deep(path[data-muscle]) {
  cursor: pointer;
}
.body-map.select :deep(path.is-hover:not(.is-primary):not(.is-secondary)) {
  fill: var(--bm-hover);
}

/* Regions the original figure does not draw (neck, middle back, abductors, adductors): invisible at rest so the
   figure looks exactly like the original. Faint guides appear while the pointer is over the map, and the
   highlight is see-through so the anatomy underneath still shows. */
.body-map :deep(path.extra[data-muscle]) {
  fill: transparent;
  stroke: none;
  pointer-events: all;
}
.body-map.filter:hover :deep(path.extra[data-muscle]),
.body-map.select:hover :deep(path.extra[data-muscle]) {
  stroke: var(--bm-stroke);
  stroke-width: 0.8;
  stroke-dasharray: 3 2;
  stroke-opacity: 0.45;
}
.body-map.filter :deep(path.extra.is-hover),
.body-map.select :deep(path.extra.is-hover) {
  fill: var(--bm-hover);
  fill-opacity: 0.6;
}
.body-map.filter :deep(path.extra.is-selected) {
  fill: var(--vp-c-brand-1);
  fill-opacity: 0.7;
  stroke: none;
}
.body-map.display :deep(path.extra.is-primary),
.body-map.select :deep(path.extra.is-primary) {
  fill: var(--bm-hatch-primary, #e5484d);
  fill-opacity: 1;
  stroke: none;
}
.body-map.display :deep(path.extra.is-secondary),
.body-map.select :deep(path.extra.is-secondary) {
  fill: var(--bm-hatch-secondary, #f5b83d);
  fill-opacity: 1;
  stroke: none;
}
</style>
