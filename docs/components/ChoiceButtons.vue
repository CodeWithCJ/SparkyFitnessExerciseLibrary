<script setup lang="ts">
/** One-click choice between a few options, instead of a dropdown that hides them. */
defineProps<{
  modelValue: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="choices" role="group" :aria-label="ariaLabel">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      :aria-pressed="modelValue === o.value"
      @click="emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
button {
  font: inherit;
  font-size: 13px;
  color: var(--vp-c-text-1);
  cursor: pointer;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 6px 12px;
  text-transform: capitalize;
  transition: border-color 0.15s, background 0.15s;
}
button:hover {
  border-color: var(--vp-c-brand-1);
}
button[aria-pressed='true'] {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
</style>
