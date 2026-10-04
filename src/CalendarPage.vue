<script>
import { onBeforeUnmount, onMounted } from "vue";
import { useCalendarStore } from "../js/kalender.js";
import CalendarEventDialog from "./components/CalendarEventDialog.vue";
import SiteFooter from "./components/SiteFooter.vue";
import SiteHeader from "./components/SiteHeader.vue";

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
  <SiteHeader variant="subpage" :config="config" />

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

      <CalendarEventDialog v-if="selectedEvent" :event="selectedEvent" @close="selectedEvent = null" />
    </div>
  </main>

  <SiteFooter :links="sichtbareFooterLinks" />
</template>