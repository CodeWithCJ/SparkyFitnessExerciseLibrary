<script setup lang="ts">
import { nextTick, ref } from 'vue';

/**
 * A list of text items, one box per item with its own remove button, so a person never has to know
 * that "one per line" means a line break. Used for names, steps, cues and the rehabilitation lists.
 * The list always shows at least one (possibly empty) row.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string[];
    itemLabel: string;
    addLabel?: string;
    placeholder?: string;
    /** Number of text lines per item; 1 uses a single-line box where Enter adds the next item. */
    rows?: number;
    numbered?: boolean;
    reorder?: boolean;
  }>(),
  { addLabel: '+ Add', placeholder: '', rows: 1, numbered: false, reorder: false }
);
const emit = defineEmits<{ 'update:modelValue': [items: string[]] }>();

const boxes = ref<HTMLElement[]>([]);
const items = () => (props.modelValue.length ? props.modelValue : ['']);

function set(i: number, value: string) {
  const next = [...items()];
  next[i] = value;
  emit('update:modelValue', next);
}
async function add() {
  emit('update:modelValue', [...items(), '']);
  await nextTick();
  boxes.value[boxes.value.length - 1]?.focus();
}
function remove(i: number) {
  const next = items().filter((_, j) => j !== i);
  emit('update:modelValue', next.length ? next : ['']);
}
function move(i: number, d: number) {
  const j = i + d;
  const next = [...items()];
  if (j < 0 || j >= next.length) return;
  [next[i], next[j]] = [next[j], next[i]];
  emit('update:modelValue', next);
}
</script>

<template>
  <div class="le">
    <div v-for="(item, i) in items()" :key="i" class="row">
      <span class="num" aria-hidden="true">{{ numbered ? i + 1 : '•' }}</span>
      <input
        v-if="rows === 1"
        ref="boxes"
        type="text"
        :value="item"
        :placeholder="placeholder"
        :aria-label="`${itemLabel} ${i + 1}`"
        @input="set(i, ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="add"
      />
      <textarea
        v-else
        ref="boxes"
        :rows="rows"
        :value="item"
        :placeholder="placeholder"
        :aria-label="`${itemLabel} ${i + 1}`"
        @input="set(i, ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="btns">
        <template v-if="reorder">
          <button type="button" aria-label="Move up" :disabled="i === 0" @click="move(i, -1)">↑</button>
          <button type="button" aria-label="Move down" :disabled="i === items().length - 1" @click="move(i, 1)">↓</button>
        </template>
        <button type="button" :aria-label="`Remove ${itemLabel.toLowerCase()} ${i + 1}`" :disabled="items().length === 1 && !item" @click="remove(i)">
          ✕
        </button>
      </div>
    </div>
    <button type="button" class="add" @click="add">{{ addLabel }}</button>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
  margin-bottom: 8px;
}
.num {
  color: var(--vp-c-text-2);
  padding-top: 8px;
  text-align: center;
}
input,
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
textarea:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
.btns {
  display: flex;
  gap: 4px;
}
.btns button {
  font: inherit;
  color: inherit;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: 6px;
  width: 28px;
  height: 36px;
}
.btns button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.add {
  font: inherit;
  color: var(--vp-c-text-1);
  cursor: pointer;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 14px;
}
</style>
