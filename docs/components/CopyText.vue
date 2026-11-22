<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { copyText } from './clipboard';

/** A piece of text (an ID, a folder or file name) with a copy button next to it. */
const props = defineProps<{ text: string; what?: string }>();

const copied = ref(false);
const failed = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  const ok = await copyText(props.text);
  copied.value = ok;
  failed.value = !ok;
  clearTimeout(timer);
  timer = setTimeout(() => {
    copied.value = false;
    failed.value = false;
  }, 1600);
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <span class="ct">
    <span class="text">{{ text }}</span>
    <button type="button" class="copy" :class="{ done: copied }" :aria-label="`Copy ${what ?? text}`" :title="copied ? 'Copied' : 'Copy'" @click="copy">
      <svg v-if="!copied" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h8" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </button>
    <span class="sr" role="status">{{ copied ? 'Copied' : failed ? 'Could not copy' : '' }}</span>
    <span v-if="failed" class="fail" aria-hidden="true">Could not copy</span>
  </span>
</template>

<style scoped>
.ct {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}
.text {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  word-break: break-all;
}
.copy {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  cursor: pointer;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  transition: color 0.15s, border-color 0.15s;
}
.copy:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.copy.done {
  color: var(--vp-c-success-1);
  border-color: var(--vp-c-success-1);
}
.fail {
  font-size: 12px;
  color: var(--vp-c-danger-1);
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
