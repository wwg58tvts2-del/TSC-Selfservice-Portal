<script>
import { onBeforeUnmount, onMounted } from "vue";
import { useCalendarStore } from "../js/kalender.js";

export default {
  setup() {
    const state = useCalendarStore();
    onMounted(() => {
      void state.load();
    });
    onBeforeUnmount(() => {
      state.calendarInstance?.destroy();
      state.calendarInstance = null;
    });
    return state;
  }
};
</script>

<template>
  <header class="site-header">
    <img
      class="site-logo"
      src="/img/Logo_ohne_Noten_transparenter_Hintergrund-1.png"
      :src="config?.header?.logo || '/img/Logo_ohne_Noten_transparenter_Hintergrund-1.png'"
      :alt="config?.header?.logoAlt || 'Tanzsportclub Dortmund'"
    >
    <div class="header-copy">
      <span class="header-kicker">{{ config?.header?.kicker }}</span>
      <span class="header-caption">{{ config?.header?.caption }}</span>
    </div>
  </header>

  <main id="calendar-app">
    <RouterLink id="back-button" class="btn btn-outline-secondary subpage-back" to="/">
      <i class="bi bi-arrow-left" aria-hidden="true"></i>
      Zurück
    </RouterLink>

    <section id="body-section">
      <p class="section-kicker">Wochenplan</p>
      <h1>Trainingskalender</h1>
      <p class="section-intro">Monats-, Wochen- und Tagesansicht der aktuellen Trainingszeiten.</p>
    </section>

    <div v-if="loading" class="lade-overlay" role="status" aria-live="polite">
      <div class="lade-box">
        <div class="lade-spinner" aria-hidden="true"></div>
        <div class="lade-text">Kalender wird geladen ...</div>
      </div>
    </div>
    <div v-if="error" class="calendar-state calendar-error" role="alert">{{ error }}</div>
    <div v-if="!loading && !error && !events.length" class="calendar-state">Es wurden keine aktiven Termine gefunden.</div>
    <div>
      <div v-if="!loading && !error && events.length" class="calendar-tools">
        <span class="calendar-tools-label">Säle</span>
        <div class="calendar-legend" aria-label="Säle ein- oder ausblenden">
          <button
            v-for="hall in halls"
            :key="hall.id"
            type="button"
            class="calendar-legend-item"
            :class="{ 'is-active': selectedHalls.includes(hall.id) }"
            @click="setHallFilter(hall.id)"
          >
            <i class="calendar-color-dot" :style="{ backgroundColor: hall.color }" aria-hidden="true"></i>
            {{ hall.name }}
          </button>
        </div>
      </div>

      <div id="calendar" class="calendar-view" v-show="!loading && !error && events.length"></div>

      <div v-if="selectedEvent" class="msgbox-overlay calendar-event-modal" @click="selectedEvent = null">
        <div class="msgbox-backdrop" aria-hidden="true"></div>
        <div class="msgbox-dialog calendar-event-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-event-title" @click.stop>
          <button type="button" class="calendar-detail-close" @click="selectedEvent = null" aria-label="Details schließen">&times;</button>
          <p class="section-kicker">Termindetails</p>
          <h2 id="calendar-event-title">{{ selectedEvent.title }}</h2>
          <p class="calendar-detail-time">{{ selectedEvent.start }} - {{ selectedEvent.end }}</p>
          <dl>
            <div v-if="selectedEvent.beschreibung"><dt>Beschreibung</dt><dd>{{ selectedEvent.beschreibung }}</dd></div>
            <div v-if="selectedEvent.notiz"><dt>Notiz</dt><dd>{{ selectedEvent.notiz }}</dd></div>
            <div v-if="selectedEvent.saal"><dt>Saal</dt><dd>{{ selectedEvent.saal }}</dd></div>
            <div v-if="selectedEvent.trainer"><dt>Trainer*in</dt><dd>{{ selectedEvent.trainer }}</dd></div>
            <div v-if="selectedEvent.niveau"><dt>Leistungsniveau</dt><dd>{{ selectedEvent.niveau }}</dd></div>
            <div v-if="selectedEvent.altersstufe"><dt>Altersgruppe</dt><dd>{{ selectedEvent.altersstufe }}</dd></div>
            <div v-if="selectedEvent.bereich"><dt>Bereich</dt><dd>{{ selectedEvent.bereich }}</dd></div>
          </dl>
          <button type="button" class="msgbox-close-btn calendar-detail-button" @click="selectedEvent = null">Schließen</button>
        </div>
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <nav class="footer-links" aria-label="Rechtliches">
      <a v-for="link in sichtbareFooterLinks" :key="link.url" class="footer-link" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.titel }}</a>
    </nav>
  </footer>
</template>