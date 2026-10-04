<script setup>
defineProps({
  event: { type: Object, required: true }
});

defineEmits(["close"]);
</script>

<template>
  <div class="msgbox-overlay calendar-event-modal" @click="$emit('close')">
    <div class="msgbox-backdrop" aria-hidden="true"></div>
    <div class="msgbox-dialog calendar-event-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-event-title" @click.stop>
      <button type="button" class="calendar-detail-close" @click="$emit('close')" aria-label="Details schließen">&times;</button>
      <p class="section-kicker">Termindetails</p>
      <h2 id="calendar-event-title">{{ event.title }}</h2>
      <p class="calendar-detail-time">{{ event.start }} - {{ event.end }}</p>
      <dl>
        <div v-if="event.beschreibung"><dt>Beschreibung</dt><dd>{{ event.beschreibung }}</dd></div>
        <div v-if="event.notiz"><dt>Notiz</dt><dd>{{ event.notiz }}</dd></div>
        <div v-if="event.saal"><dt>Saal</dt><dd>{{ event.saal }}</dd></div>
        <div v-if="event.trainer"><dt>Trainer*in</dt><dd>{{ event.trainer }}</dd></div>
        <div v-if="event.niveau"><dt>Leistungsniveau</dt><dd>{{ event.niveau }}</dd></div>
        <div v-if="event.altersstufe"><dt>Altersgruppe</dt><dd>{{ event.altersstufe }}</dd></div>
        <div v-if="event.bereich"><dt>Bereich</dt><dd>{{ event.bereich }}</dd></div>
      </dl>
      <button type="button" class="msgbox-close-btn calendar-detail-button" @click="$emit('close')">Schließen</button>
    </div>
  </div>
</template>