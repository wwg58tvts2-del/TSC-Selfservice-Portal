<script>
import { onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePortalStore } from "../js/state.js";
import AreaModal from "./components/AreaModal.vue";
import PortalCard from "./components/PortalCard.vue";
import PortalAreaSection from "./components/PortalAreaSection.vue";
import PortalSection from "./components/PortalSection.vue";
import MemberLoginStep from "./components/MemberLoginStep.vue";
import SiteFooter from "./components/SiteFooter.vue";
import SiteHeader from "./components/SiteHeader.vue";

export default {
  components: {
    AreaModal,
    MemberLoginStep,
    PortalAreaSection,
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
      () => [state.view, state.selectedForm?.id, state.selectedPage?.id],
      ([view, formId, pageId]) => {
        if (view === "login" && route.name !== "login") {
          void router.replace({ name: "login" });
        } else if (
          view === "formular" &&
          formId &&
          (route.name !== "formular" || route.params.formId !== formId)
        ) {
          void router.replace({ name: "formular", params: { formId } });
        } else if (
          view === "seite" &&
          pageId &&
          (route.name !== "seite" || route.params.pageId !== pageId)
        ) {
          void router.replace({ name: "seite", params: { pageId } });
        } else if (view === "auswahl" && route.name !== "portal") {
          void router.replace({ name: "portal" });
        }
      },
      { flush: "post" }
    );

    watch(
      () => [route.name, route.params.formId, route.params.pageId, state.config, state.person, state.memberStatusChecked],
      ([routeName, routeFormId, routePageId, config, person]) => {
        if (!config || !state.memberStatusChecked) {
          return;
        }

        if (routeName === "login") {
          if (person) {
            void router.replace({ name: "portal" });
          } else {
            state.oeffneLogin();
          }
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

        if (routeName === "seite") {
          const page = state.sichtbareSeiten.find(
            (item) => item.id === String(routePageId)
          );
          if (!page) {
            state.warnung = "Die angeforderte Seite wurde nicht gefunden.";
            state.zurueck();
            return;
          }
          if (state.selectedPage?.id !== page.id) {
            state.oeffneSeite(page);
          }
          return;
        }

        if (routeName === "portal") {
          state.zerstoereFormio();
          state.selectedForm = null;
          state.selectedPage = null;
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

      <PortalAreaSection
        v-for="area in sichtbarePortalAreas"
        :key="area.id"
        :area="area"
        @open-form="oeffneFormular"
        @open-page="oeffneSeite"
      />
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

    <AreaModal v-else-if="view === 'seite'" :title="selectedPage?.title || selectedPage?.titel" @back="zurueck">
      <div class="bereich-inhalt" v-html="selectedPage?.content || selectedPage?.inhalt"></div>
    </AreaModal>

    <section v-else class="form-page" :class="{ 'form-page--wide': Number(selectedForm?.width) === 2 }" aria-label="Formular">
      <div class="form-page-header">
        <button id="back-button" class="btn btn-outline-secondary subpage-back" type="button" @click="zurueck()">
          <i class="bi bi-arrow-left" aria-hidden="true"></i>
          Zurück
        </button>
      </div>
      <div id="formio" class="form-page-content"></div>
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