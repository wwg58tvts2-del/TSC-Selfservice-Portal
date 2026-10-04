<script>
import { onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePortalStore } from "../js/state.js";
import PortalCard from "./components/PortalCard.vue";
import PortalSection from "./components/PortalSection.vue";
import MemberLoginStep from "./components/MemberLoginStep.vue";
import SiteFooter from "./components/SiteFooter.vue";
import SiteHeader from "./components/SiteHeader.vue";

const FORMULAR_RUECKKEHR_KEY = "tsc-serviceportal.form-return-route";

export default {
  components: {
    MemberLoginStep,
    PortalCard,
    PortalSection,
    SiteFooter,
    SiteHeader
  },
  setup() {
    const state = usePortalStore();
    const route = useRoute();
    const router = useRouter();

    watch(
      () => [state.view, state.selectedForm?.id],
      ([view, formId]) => {
        if (view === "login" && route.name !== "login") {
          void router.replace({ name: "login" });
        } else if (
          view === "formular" &&
          formId &&
          (route.name !== "formular" || route.params.formId !== formId)
        ) {
          void router.replace({ name: "formular", params: { formId } });
        } else if (view === "auswahl" && route.name !== "portal") {
          void router.replace({ name: "portal" });
        }
      },
      { flush: "post" }
    );

    watch(
      () => [route.name, route.params.formId, state.config, state.person, state.memberStatusChecked],
      ([routeName, routeFormId, config, person]) => {
        if (!config || !state.memberStatusChecked) {
          return;
        }

        if (!person) {
          if (routeName === "formular") {
            window.sessionStorage.setItem(FORMULAR_RUECKKEHR_KEY, route.fullPath);
          }
          state.oeffneLogin();
          return;
        }

        const rueckkehr = window.sessionStorage.getItem(FORMULAR_RUECKKEHR_KEY);
        if (rueckkehr?.startsWith("/") && !rueckkehr.startsWith("//")) {
          window.sessionStorage.removeItem(FORMULAR_RUECKKEHR_KEY);
          void router.replace(rueckkehr);
          return;
        }

        if (routeName === "login") {
          void router.replace({ name: "portal" });
          return;
        }

        if (routeName === "formular") {
          const form = state.sichtbareFormulare.find(
            (item) => item.id === String(routeFormId)
          );
          if (!form) {
            state.warnung = "Das angeforderte Formular wurde nicht gefunden.";
            state.zurueck();
            return;
          }
          if (state.selectedForm?.id !== form.id) {
            state.zerstoereFormio();
            state.selectedForm = form;
          }
          state.view = "formular";
          return;
        }

        if (routeName === "portal") {
          state.zerstoereFormio();
          state.selectedForm = null;
          state.view = "auswahl";
        }
      },
      { immediate: true }
    );

    watch(
      () => [state.view, state.selectedForm?.id],
      ([view, formId]) => {
        if (view === "formular" && formId) {
          void state.ladeFormioEffect();
        }
      },
      { flush: "post", immediate: true }
    );

    onMounted(() => {
      void state.init();
    });

    onBeforeUnmount(() => {
      state.zurueck();
    });

    return state;
  }
};
</script>

<template>
  <SiteHeader
    :config="config"
    :person="person"
    :view="view"
    :query="suchtext"
    :has-search-items="hatDurchsuchbareEintraege"
    @search="setzeSuchtext"
    @clear-search="leereSuche"
    @login="oeffneLogin"
    @logout="logout"
  />

  <main id="app">
    <section v-if="view === 'auswahl'" id="form-selection">
      <section id="body-section">
        <p class="section-kicker">{{ config?.body?.kicker }}</p>
        <h1>{{ config?.body?.title }}</h1>
        <p class="section-intro">{{ config?.body?.intro }}</p>
      </section>

      <p v-if="warnung" class="alert alert-warning" role="alert">{{ warnung }}</p>
      <p v-if="keineSuchergebnisse" class="portal-search-empty" role="status">Keine Ergebnisse gefunden</p>

      <PortalSection id="forms-section" :section="config?.forms?.section" :items="sichtbareFormulare">
        <template #default="{ items }">
          <PortalCard v-for="form in items" :key="form.id" :title="form.titel" :description="form.beschreibung">
            <template #action>
            <button class="form-button-label" type="button" @click="oeffneFormular(form)">
              Formular öffnen
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
            </template>
          </PortalCard>
        </template>
      </PortalSection>

      <PortalSection id="services-section" :section="config?.onlineServices?.section" :items="sichtbareServices" options-class="service-options">
        <template #default="{ items }">
          <PortalCard v-for="service in items" :key="service.url" variant="service" :title="service.titel" :description="service.beschreibung">
            <template #action>
            <a
              class="service-button"
              :href="service.url"
              :target="service.neuesFenster ? '_blank' : '_self'"
              :rel="service.neuesFenster ? 'noopener noreferrer' : null"
            >
              Öffnen
              <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
            </a>
            </template>
          </PortalCard>
        </template>
      </PortalSection>

      <PortalSection id="downloads-section" :section="config?.downloads?.section" :items="sichtbareDownloads" options-class="download-options">
        <template #default="{ items }">
          <PortalCard v-for="download in items" :key="download.url" variant="download" :title="download.titel" :description="download.beschreibung">
            <template #action>
            <a class="download-button" :href="download.url" target="_blank" rel="noopener noreferrer">
              <i class="bi bi-download" aria-hidden="true"></i>
              Download
            </a>
            </template>
          </PortalCard>
        </template>
      </PortalSection>
    </section>

    <section v-else-if="view === 'login'" id="member-login-container" class="member-login-page" aria-labelledby="member-login-title">
      <div class="member-login-page-header">
        <button id="back-button" class="btn btn-outline-secondary" type="button" @click="zurueck()">
          <i class="bi bi-arrow-left" aria-hidden="true"></i>
          Zurück
        </button>
        <p class="section-kicker">{{ config?.memberLogin?.kicker }}</p>
        <h1 id="member-login-title" class="member-login-title">{{ config?.memberLogin?.title }}</h1>
      </div>
      <p class="member-login-intro">{{ config?.memberLogin?.intro }}</p>

      <div class="member-login-controls">
        <MemberLoginStep :number="config?.memberLogin?.steps?.chooseStatus?.label" :title="config?.memberLogin?.steps?.chooseStatus?.title">
          <fieldset class="member-login-status-group" :disabled="memberLoginBusy">
            <legend class="visually-hidden">{{ config?.memberLogin?.steps?.chooseStatus?.statusGroupsLabel }}</legend>
            <label v-for="gruppe in memberLoginStatusgruppen" :key="gruppe.value" class="member-login-status-option" :class="{ 'is-selected': memberLoginDaten.statusGruppe === gruppe.value }">
              <input type="radio" name="memberStatusGroup" :value="gruppe.value" :checked="memberLoginDaten.statusGruppe === gruppe.value" @change="waehleMemberStatusgruppe(gruppe.value)">
              {{ gruppe.label }}
            </label>
          </fieldset>
        </MemberLoginStep>

        <MemberLoginStep v-if="memberLoginDaten.statusGruppe" :number="config?.memberLogin?.steps?.requestOtp?.label" :title="config?.memberLogin?.steps?.requestOtp?.title">
          <p class="member-login-step-copy">{{ config?.memberLogin?.steps?.requestOtp?.description }}</p>
          <div v-if="memberLoginKennungFeld" class="member-login-field">
            <label class="form-label" for="member-login-identifier">{{ memberLoginKennungLabel }}</label>
            <input id="member-login-identifier" v-model="memberLoginDaten[memberLoginKennungFeld]" class="form-control" type="text" autocomplete="username" :disabled="memberLoginBusy" @input="aendereMemberLoginKennung()">
          </div>
          <button class="form-button-label member-login-action" type="button" :disabled="!memberLoginKennungGueltig || memberLoginBusy" @click="fordereEinmalpasswortAn()">
            <i class="bi bi-envelope-fill" aria-hidden="true"></i>
            {{ memberLoginOtpAngefordert ? config?.memberLogin?.steps?.requestOtp?.resendLabel : config?.memberLogin?.steps?.requestOtp?.buttonLabel }}
          </button>
        </MemberLoginStep>

        <MemberLoginStep v-if="memberLoginOtpAngefordert" :number="config?.memberLogin?.steps?.authenticate?.label" :title="config?.memberLogin?.steps?.authenticate?.title">
          <p class="member-login-step-copy">{{ config?.memberLogin?.steps?.authenticate?.description }}</p>
          <div class="member-login-field">
            <label class="form-label" for="member-otp">{{ config?.memberLogin?.steps?.authenticate?.passwordLabel }}</label>
            <input id="member-otp" v-model="memberLoginDaten.passwort" class="form-control" type="password" autocomplete="one-time-code" :disabled="memberLoginBusy">
          </div>
          <button class="form-button-label member-login-action" type="button" :disabled="!memberLoginDaten.passwort.trim() || memberLoginBusy" @click="meldeMitEinmalpasswortAn()">
            <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
            {{ config?.memberLogin?.steps?.authenticate?.buttonLabel }}
          </button>
        </MemberLoginStep>
      </div>
      <p class="member-login-note">{{ config?.memberLogin?.securityNote }}</p>
      <p class="member-login-note">{{ config?.memberLogin?.rememberedIdentifierNote }}</p>
    </section>

    <section v-else id="form-container" class="form-modal">
      <div class="form-modal-backdrop" aria-hidden="true"></div>
      <div class="form-modal-dialog" role="dialog" aria-modal="true">
        <div class="form-modal-header">
          <button id="back-button" class="btn btn-outline-secondary" type="button" @click="zurueck()">
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
            Zurück
          </button>
        </div>
        <h1 class="visually-hidden">{{ selectedForm?.titel }}</h1>
        <div id="formio"></div>
      </div>
    </section>
  </main>

  <SiteFooter :links="sichtbareFooterLinks" />

  <div class="msgbox-overlay" v-if="msgbox.visible">
    <div class="msgbox-backdrop" aria-hidden="true" @click="schliesseMeldung()"></div>
    <div class="msgbox-dialog" role="alertdialog" aria-modal="true">
      <h3 class="msgbox-title">{{ msgbox.titel }}</h3>
      <div class="msgbox-content" style="white-space: pre-line">{{ msgbox.inhalt }}</div>
      <button class="msgbox-close-btn" type="button" @click="schliesseMeldung()">{{ msgbox.buttonText }}</button>
    </div>
  </div>

  <div class="lade-overlay" v-cloak v-if="loading.visible" role="status" aria-live="polite">
    <div class="lade-box">
      <div class="lade-spinner" aria-hidden="true"></div>
      <div class="lade-text">{{ loading.text }}</div>
    </div>
  </div>
</template>