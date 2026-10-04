<script setup>
defineProps({
  title: { type: String, default: "" }
});

defineEmits(["back"]);
</script>

<template>
  <section class="form-modal">
    <div class="form-modal-backdrop" aria-hidden="true"></div>
    <div class="form-modal-dialog" role="dialog" aria-modal="true">
      <div class="form-modal-header">
        <button id="back-button" class="btn btn-outline-secondary" type="button" @click="$emit('back')">
          <i class="bi bi-arrow-left" aria-hidden="true"></i>
          Zurück
        </button>
      </div>
      <h1 class="visually-hidden">{{ title }}</h1>
      <slot />
    </div>
  </section>
</template>