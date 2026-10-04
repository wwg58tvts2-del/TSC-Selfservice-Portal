<script setup>
defineProps({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  variant: { type: String, default: "" }
});
</script>

<template>
  <article class="form-option" :class="variant ? `${variant}-option` : null">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <slot name="action" />
  </article>
</template>