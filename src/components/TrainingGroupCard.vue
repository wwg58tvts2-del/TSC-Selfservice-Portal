<script setup>
defineProps({
  gruppe: { type: Object, required: true }
});
</script>

<template>
  <article class="training-card">
    <div class="training-card-heading">
      <div>
        <p v-if="gruppe.bereich" class="training-card-eyebrow">{{ gruppe.bereich }}</p>
        <h2>{{ gruppe.name }}</h2>
      </div>
    </div>
    <p v-if="gruppe.beschreibung" class="training-description">{{ gruppe.beschreibung }}</p>
    <p v-if="gruppe.notiz" class="training-note"><i class="bi bi-info-circle" aria-hidden="true"></i>{{ gruppe.notiz }}</p>
    <dl class="training-details">
      <div v-if="gruppe.stufe"><dt>Leistungsstufe</dt><dd>{{ gruppe.stufe }}</dd></div>
      <div v-if="gruppe.alter"><dt>Alter</dt><dd>{{ gruppe.alter }}</dd></div>
      <div><dt>Beitrag</dt><dd>{{ gruppe.beitrag }}</dd></div>
      <div v-if="gruppe.trainer"><dt>Trainer*in</dt><dd>{{ gruppe.trainer }}</dd></div>
      <div v-if="gruppe.termine.length">
        <dt>Trainingszeit</dt>
        <dd class="training-time-values">
          <span v-for="termin in gruppe.termine" :key="termin.id">
            <strong>{{ termin.tag }}</strong>
            {{ termin.start }} - {{ termin.ende }}
          </span>
        </dd>
      </div>
    </dl>
  </article>
</template>