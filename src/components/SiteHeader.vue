<script setup>
defineProps({
  config: { type: Object, default: () => ({}) },
  person: { type: Object, default: null },
  view: { type: String, default: "auswahl" },
  query: { type: String, default: "" },
  hasSearchItems: { type: Boolean, default: false },
  variant: { type: String, default: "portal" }
});

defineEmits(["search", "clear-search", "login", "logout"]);
</script>

<template>
  <header class="site-header">
    <div v-if="variant === 'portal'" class="site-header-inner">
      <img
        id="header-logo"
        class="site-logo"
        src="/img/Logo_ohne_Noten_transparenter_Hintergrund-1.png"
        :src="config?.header?.logo || '/img/Logo_ohne_Noten_transparenter_Hintergrund-1.png'"
        alt="Tanzsportclub Dortmund"
        :alt="config?.header?.logoAlt || 'Tanzsportclub Dortmund'"
      >
      <div v-if="view === 'auswahl' && hasSearchItems" class="header-search">
        <label class="visually-hidden" for="serviceportal-search">Suche</label>
        <div class="header-search-field">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input id="serviceportal-search" :value="query" @input="$emit('search', $event.target.value)" type="search" placeholder="Suche" autocomplete="off">
          <button v-if="query" class="header-search-clear" type="button" aria-label="Suche löschen" title="Suche löschen" @mousedown.prevent @click="$emit('clear-search')">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="header-right">
        <div class="header-copy">
          <span class="header-kicker">{{ config?.header?.kicker }}</span>
          <span class="header-caption">{{ config?.header?.caption }}</span>
        </div>
        <div class="header-actions" aria-label="Mitgliederbereich" v-if="config?.memberLogin">
          <button v-if="!person" class="header-login-button" type="button" @click="$emit('login')">
            <i class="bi bi-person-circle" aria-hidden="true"></i>
            <span>{{ config.memberLogin.title }}</span>
          </button>
          <button v-else class="header-login-button member-logout-button" type="button" @click="$emit('logout')">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
            <span>{{ (person.vorname || 'Mitglied') + ' abmelden' }}</span>
          </button>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="site-header-inner site-header-inner--subpage">
        <img
          class="site-logo"
          src="/img/Logo_ohne_Noten_transparenter_Hintergrund-1.png"
          :src="config?.header?.logo || '/img/Logo_ohne_Noten_transparenter_Hintergrund-1.png'"
          :alt="config?.header?.logoAlt || 'Tanzsportclub Dortmund'"
        >
        <div class="header-right header-right--subpage">
          <div class="header-copy">
            <span class="header-kicker">{{ config?.header?.kicker }}</span>
            <span class="header-caption">{{ config?.header?.caption }}</span>
          </div>
        </div>
      </div>
    </template>
  </header>
</template>