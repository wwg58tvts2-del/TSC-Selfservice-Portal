<script>
import { onMounted } from "vue";
import { useTrainingPlanStore } from "../js/trainingsplan.js";
import SiteFooter from "./components/SiteFooter.vue";
import SiteHeader from "./components/SiteHeader.vue";
import TrainingGroupCard from "./components/TrainingGroupCard.vue";

export default {
  setup() {
    const state = useTrainingPlanStore();
    onMounted(() => {
      void state.load();
    });
    return state;
  }
};
</script>

<template>
  <SiteHeader variant="subpage" :config="config" />

  <main id="training-app">
    <RouterLink id="back-button" class="btn btn-outline-secondary subpage-back" to="/">
      <i class="bi bi-arrow-left" aria-hidden="true"></i>
      Zurück
    </RouterLink>

    <section id="body-section">
      <p class="section-kicker">Trainingsangebot</p>
      <h1>Trainingsplan</h1>
      <p class="section-intro">Finde die passende Trainingsgruppe für dich.</p>
    </section>

    <div v-if="loading" class="lade-overlay" role="status" aria-live="polite">
      <div class="lade-box">
        <div class="lade-spinner" aria-hidden="true"></div>
        <div class="lade-text">Trainingsplan wird geladen ...</div>
      </div>
    </div>
    <div v-if="error" class="calendar-state calendar-error" role="alert">{{ error }}</div>

    <div v-if="!loading && !error" class="training-content">
      <section class="training-filters" aria-label="Trainingsplan filtern">
        <label class="training-search">
          <span class="visually-hidden">Gruppen suchen</span>
          <i class="bi bi-search" aria-hidden="true"></i>
          <input v-model="search" @input="logFilterChange('Suche', search)" type="search" placeholder="Gruppe suchen ...">
        </label>
        <label>
          <span>Tag</span>
          <select v-model="tagFilter" @change="logFilterChange('Tag', tagFilter)">
            <option value="alle">Alle Tage</option>
            <option v-for="tag in tageFilter" :key="tag" :value="tag">{{ tag }}</option>
          </select>
        </label>
        <label>
          <span>Trainer*in</span>
          <select v-model="trainerFilter" @change="logFilterChange('Trainer*in', trainerFilter)">
            <option value="alle">Alle Trainer*innen</option>
            <option v-for="trainer in trainerNamen" :key="trainer" :value="trainer">{{ trainer }}</option>
          </select>
        </label>
      </section>

      <p v-if="!gefilterteGruppen.length" class="calendar-state">Keine passenden Gruppen gefunden.</p>
      <section v-else class="training-list" aria-label="Trainingsgruppen">
        <TrainingGroupCard v-for="gruppe in gefilterteGruppen" :key="gruppe.id" :gruppe="gruppe" />
      </section>
    </div>
  </main>

  <SiteFooter :links="sichtbareFooterLinks" />
</template>