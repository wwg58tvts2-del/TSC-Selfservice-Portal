<script setup>
defineProps({
  id: { type: String, required: true },
  section: { type: Object, default: () => ({}) },
  fallbackTitle: { type: String, default: "" },
  items: { type: Array, default: () => [] },
  optionsClass: { type: String, default: "" }
});
</script>

<template>
  <section v-if="items.length" :id="id">
    <div class="section-divider" aria-hidden="true"></div>
    <p class="section-kicker">{{ section?.kicker }}</p>
    <h2 class="section-title">{{ section?.title || fallbackTitle }}</h2>
    <p class="section-intro">{{ section?.intro }}</p>
    <div class="form-options" :class="optionsClass" aria-live="polite">
      <slot :items="items" />
    </div>
  </section>
</template>