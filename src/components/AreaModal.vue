<script setup>
defineProps({
  title: { type: String, default: "" },
  wide: { type: Boolean, default: false }
});

defineEmits(["back"]);
</script>

<template>
  <section class="form-modal">
    <div class="form-modal-backdrop" aria-hidden="true"></div>
    <div class="form-modal-dialog" :class="{ 'form-modal-dialog--wide': wide }" role="dialog" aria-modal="true">
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

<style scoped>
.form-modal {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  padding: 24px;
}

.form-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(23 23 23 / 48%);
}

.form-modal-dialog {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  margin: 0 auto;
  padding: 24px;
  overflow: auto;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 6px;
  box-shadow: 0 18px 48px rgb(0 0 0 / 22%);
}

.form-modal-dialog--wide {
  max-width: 1040px;
}

.form-modal-header {
  margin-bottom: 20px;
}

@media (max-width: 600px) {
  .form-modal {
    padding: 10px;
  }

  .form-modal-dialog {
    max-height: calc(100vh - 20px);
    max-height: calc(100dvh - 20px);
    padding: 16px;
  }

  .form-modal-dialog--wide {
    max-width: none;
  }
}
</style>