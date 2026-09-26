import { reactive } from "https://unpkg.com/petite-vue?module";

import {
  hatSichtbarenCookie,
  ladeConfigDaten,
  holeMemberStatus,
  sendeLogout,
  sendeFormularRequest
} from "./api.js?v=20260926-config-login-1";

import {
  leseFormIdAusUrl,
  aktualisiereUrl
} from "./navigation.js?v=20260920-storno-3";

import {
  ladeFormular,
  zerstoereFormular
} from "./formio.js?v=20260920-storno-3";


const MEMBER_LOGIN_STORAGE_KEY = "tsc-serviceportal.member-login";

function leseGespeicherteLoginIdentitaet() {
  try {
    const gespeicherteDaten = JSON.parse(
      window.localStorage.getItem(MEMBER_LOGIN_STORAGE_KEY) || "null"
    );

    if (
      !gespeicherteDaten ||
      typeof gespeicherteDaten.statusGruppe !== "string" ||
      typeof gespeicherteDaten.identifierField !== "string" ||
      typeof gespeicherteDaten.identifierValue !== "string"
    ) {
      return null;
    }

    return gespeicherteDaten;
  } catch (error) {
    console.warn("Gespeicherte Login-Kennung konnte nicht gelesen werden:", error);
    return null;
  }
}


export const state = reactive({
  config: null,
  person: null,
  view: "auswahl",
  selectedForm: null,
  activeFormInstance: null,
  warnung: "",

  msgbox: {
    visible: false,
    titel: "",
    inhalt: "",
    buttonText: "Schließen",
    zurueckNachSchliessen: true,
    onClose: null
  },

  loading: {
    visible: false,
    text: ""
  },

  memberCheckTimer: null,
  memberLoginIdentitaet: null,
  memberLoginDaten: {
    statusGruppe: "",
    passwort: ""
  },
  memberLoginOtpAngefordert: false,
  memberLoginBusy: false,


  async init() {
    this.memberLoginIdentitaet = leseGespeicherteLoginIdentitaet();

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.msgbox.visible) {
        this.schliesseMeldung();
      }
    });

    window.addEventListener(
      "popstate",
      () => this.behandlePopState()
    );

    await this.ladeConfig();
    this.starteMemberUeberwachung();
    this.behandleUrlBeimStart();
  },


  starteMemberUeberwachung() {
    if (this.memberCheckTimer) {
      clearInterval(this.memberCheckTimer);
    }

    this.memberCheckTimer = setInterval(() => {
      this.ladeMemberDaten({ silent: true });
    }, 30000);
  },


  async ladeConfig() {
    console.log("[Serviceportal] ladeConfig() gestartet");
    try {
      const konfigurationsQuelle =
        await ladeConfigDaten(
          "config.json"
        );

      const configUrl =
        konfigurationsQuelle.configUrl;

      this.config =
        await ladeConfigDaten(
          configUrl
        );

      console.log("[Serviceportal] Konfiguration im State übernommen");

      document.title =
        this.config.page?.title ||
        "Portal";

      console.log(
        "Seitentitel gesetzt:",
        document.title
      );

      const favicon =
        document.getElementById("favicon");

      if (
        favicon &&
        this.config.page?.favicon
      ) {
        favicon.href =
          this.config.page.favicon;
      }

      console.info(
        "[Serviceportal] Sichtbarer Cookie vorhanden:",
        hatSichtbarenCookie()
      );

      // Memberstatus immer abwarten,
      // damit Login-Status vor Formular-
      // und Header-Anzeige feststeht
      await this.ladeMemberDaten({
        silent: true
      });

    } catch (error) {
      console.error(
        "Die Konfiguration konnte nicht geladen werden:",
        error
      );

      this.warnung =
        "Die Formulare konnten nicht geladen werden. Bitte versuche es später erneut.";
    } finally {
      console.log("[Serviceportal] ladeConfig() beendet");
    }
  },


  get statusgruppen() {
    if (!this.person) {
      return ["gast"];
    }

    const statusGruppe =
      String(
        this.person.statusGruppe ||
        "gast"
      )
        .trim()
        .toLowerCase();

    if (!["gast", "alle", "trainer", "mitglied"].includes(statusGruppe)) {
      return ["gast"];
    }

    if (statusGruppe === "gast") {
      return ["gast"];
    }

    if (statusGruppe === "alle") {
      return ["alle"];
    }

    return [statusGruppe];
  },


  get memberLoginStatusgruppen() {
    const statusgruppen = this.config?.memberLogin?.steps?.chooseStatus?.statusGroups;
    return Array.isArray(statusgruppen) ? statusgruppen : [];
  },


  get memberLoginAktiveStatusgruppe() {
    return this.memberLoginStatusgruppen.find(
      (gruppe) => gruppe.value === this.memberLoginDaten.statusGruppe
    );
  },


  get memberLoginKennungFeld() {
    return this.memberLoginAktiveStatusgruppe?.identifierField || "";
  },


  get memberLoginKennungLabel() {
    return this.memberLoginAktiveStatusgruppe?.identifierLabel || "";
  },


  leereMemberLoginDaten() {
    const daten = {
      statusGruppe: "",
      passwort: ""
    };

    this.memberLoginStatusgruppen.forEach((gruppe) => {
      if (gruppe.identifierField) {
        daten[gruppe.identifierField] = "";
      }
    });

    return daten;
  },


  get memberLoginKennungGueltig() {
    const feld = this.memberLoginKennungFeld;
    return Boolean(feld && String(this.memberLoginDaten[feld] || "").trim());
  },


  speichereMemberLoginIdentitaet() {
    const identifierField = this.memberLoginKennungFeld;
    const identifierValue = String(this.memberLoginDaten[identifierField] || "").trim();

    if (!identifierField || !identifierValue || !this.memberLoginDaten.statusGruppe) {
      return null;
    }

    const identitaet = {
      statusGruppe: this.memberLoginDaten.statusGruppe,
      identifierField,
      identifierValue
    };

    this.memberLoginIdentitaet = identitaet;

    try {
      window.localStorage.setItem(
        MEMBER_LOGIN_STORAGE_KEY,
        JSON.stringify(identitaet)
      );
    } catch (error) {
      console.warn("Login-Kennung konnte nicht gespeichert werden:", error);
    }

    return identitaet;
  },


  get sichtbareFormulare() {
    const forms =
      Array.isArray(
        this.config?.forms?.items
      )
        ? this.config.forms.items
        : [];

    return forms;
  },


  get sichtbareServices() {
    const services =
      Array.isArray(
        this.config?.onlineServices?.items
      )
        ? this.config.onlineServices.items
        : [];

    return services;
  },


  get sichtbareDownloads() {
    const downloads =
      Array.isArray(
        this.config?.downloads?.items
      )
        ? this.config.downloads.items
        : [];

    return downloads;
  },


  get sichtbareFooterLinks() {
    const links =
      Array.isArray(
        this.config?.footer
      )
        ? this.config.footer
        : [];

    return links;
  },


  async ladeMemberDaten(
    options = {}
  ) {
    const silent =
      options.silent === true;

    if (!silent) {
      this.zeigeLadenIntern(
        "Anmeldestatus wird geprüft ..."
      );
    }

    try {
      const person =
        await holeMemberStatus(
          this.config?.memberStatusUrl
        );

      if (person) {
        const loginIdentitaet =
          this.memberLoginIdentitaet ||
          leseGespeicherteLoginIdentitaet();

        this.memberLoginIdentitaet = loginIdentitaet;
        this.person = loginIdentitaet
          ? {
              ...person,
              statusGruppe: person.statusGruppe || loginIdentitaet.statusGruppe,
              loginStatusGruppe: loginIdentitaet.statusGruppe,
              [loginIdentitaet.identifierField]:
                person[loginIdentitaet.identifierField] || loginIdentitaet.identifierValue
            }
          : person;
      } else {
        this.person = null;
      }

      console.info(
        "[Serviceportal] Erkannte Statusgruppen:",
        this.statusgruppen
      );

      if (!silent) {
        this.zeigeMeldung(
          "Angemeldet",
          [
            `Willkommen ${person.vorname || ""} ${person.nachname || ""}`.trim(),
            `Statusgruppe: ${this.statusgruppen.join(", ")}`
          ].join("\n"),
          false
        );
      }

      return person;

    } catch (error) {
      console.error(
        "Fehler beim Aufruf des Memberstatus-Webhooks:",
        error
      );

      if (silent && (error.status === 401 || error.status === 403)) {
        this.person = null;
      }

      if (!silent) {
        this.zeigeMeldung(
          "Memberstatus fehlgeschlagen",
          error.message ||
            "Der Anmeldestatus konnte nicht geprüft werden.",
          false
        );
      }

    } finally {
      if (!silent) {
        this.versteckeLadenIntern();
      }
    }
  },


  async logout() {
    const config = this.config?.memberLogout || {};

    this.zeigeLadenIntern(config.ladeText || "Du wirst abgemeldet ...");

    try {
      const result = await sendeLogout(config);

      if (result.erfolgreich === true || result.status === "nicht_angemeldet") {
        this.person = null;
        await this.ladeConfig();
        this.zurueck();
      }

      this.zeigeServerMeldung(result, false);

    } catch (error) {
      console.error("Fehler beim Logout:", error);

      const result = error.result;

      if (result?.erfolgreich === false && result.status === "nicht_angemeldet") {
        this.person = null;
        await this.ladeConfig();
        this.zurueck();
      }

      if (result) {
        this.zeigeServerMeldung(result, false);
      }

    } finally {
      this.versteckeLadenIntern();
    }
  },


  oeffneFormular(form) {
    this.warnung = "";
    this.selectedForm = form;
    this.view = "formular";

    aktualisiereUrl(form.id);
  },


  oeffneLogin() {
    this.zerstoereFormio();
    this.selectedForm = null;
    this.memberLoginDaten = this.leereMemberLoginDaten();
    const gespeicherteIdentitaet =
      this.memberLoginIdentitaet || leseGespeicherteLoginIdentitaet();
    const konfigurierteStatusgruppe = this.memberLoginStatusgruppen.find(
      (gruppe) =>
        gruppe.value === gespeicherteIdentitaet?.statusGruppe &&
        gruppe.identifierField === gespeicherteIdentitaet?.identifierField
    );

    if (konfigurierteStatusgruppe) {
      this.memberLoginDaten.statusGruppe = konfigurierteStatusgruppe.value;
      this.memberLoginDaten[konfigurierteStatusgruppe.identifierField] =
        gespeicherteIdentitaet.identifierValue;
    }

    this.memberLoginOtpAngefordert = false;
    this.memberLoginBusy = false;
    this.warnung = "";
    this.view = "login";
    aktualisiereUrl(null);
  },


  waehleMemberStatusgruppe(statusGruppe) {
    this.memberLoginDaten = this.leereMemberLoginDaten();
    this.memberLoginDaten.statusGruppe = statusGruppe;
    this.memberLoginOtpAngefordert = false;
  },


  aendereMemberLoginKennung() {
    this.memberLoginOtpAngefordert = false;
    this.memberLoginDaten.passwort = "";
  },


  async fordereEinmalpasswortAn() {
    if (!this.memberLoginKennungGueltig || this.memberLoginBusy) {
      return;
    }

    const loginConfig = this.config?.memberLogin || {};
    const requestConfig = loginConfig.steps?.requestOtp || {};

    if (!requestConfig.webhookUrl || !requestConfig.method) {
      this.zeigeMeldung(
        loginConfig.messages?.configurationErrorTitle,
        loginConfig.messages?.configurationError,
        false
      );

      return;
    }

    const requestData = {
      statusGruppe: this.memberLoginDaten.statusGruppe,
      [this.memberLoginKennungFeld]: String(this.memberLoginDaten[this.memberLoginKennungFeld] || "").trim()
    };

    this.memberLoginBusy = true;
    this.zeigeLadenIntern(requestConfig.loadingText);

    try {
      const result = await sendeFormularRequest(
        requestConfig.webhookUrl,
        requestConfig.method,
        requestData
      );

      if (!result || typeof result.erfolgreich !== "boolean") {
        const error = new Error("Ungültige JSON-Antwort.");
        error.result = result;
        throw error;
      }

      if (result.erfolgreich) {
        this.memberLoginOtpAngefordert = true;
        this.memberLoginDaten.passwort = "";
      }

      this.zeigeServerMeldung(result, false);
    } catch (error) {
      console.error("Fehler beim Anfordern des Einmalpassworts:", error);
      if (error.result) {
        this.zeigeServerMeldung(error.result, false);
      } else {
        this.zeigeMeldung(
          loginConfig.messages?.otpRequestErrorTitle,
          loginConfig.messages?.otpRequestError,
          false
        );
      }
    } finally {
      this.memberLoginBusy = false;
      this.versteckeLadenIntern();
    }
  },


  async meldeMitEinmalpasswortAn() {
    if (!this.memberLoginOtpAngefordert || !this.memberLoginDaten.passwort.trim() || this.memberLoginBusy) {
      return;
    }

    const loginConfig = this.config?.memberLogin || {};
    const authenticationConfig = loginConfig.steps?.authenticate || {};

    if (!authenticationConfig.webhookUrl || !authenticationConfig.method) {
      this.zeigeMeldung(
        loginConfig.messages?.configurationErrorTitle,
        loginConfig.messages?.configurationError,
        false
      );

      return;
    }

    const requestData = {
      statusGruppe: this.memberLoginDaten.statusGruppe,
      [this.memberLoginKennungFeld]: String(this.memberLoginDaten[this.memberLoginKennungFeld] || "").trim(),
      passwort: this.memberLoginDaten.passwort
    };

    this.memberLoginBusy = true;
    this.zeigeLadenIntern(authenticationConfig.loadingText);

    try {
      const result = await sendeFormularRequest(
        authenticationConfig.webhookUrl,
        authenticationConfig.method,
        requestData
      );

      if (!result || typeof result.erfolgreich !== "boolean") {
        const error = new Error("Ungültige JSON-Antwort.");
        error.result = result;
        throw error;
      }

      if (!result.erfolgreich) {
        this.zeigeServerMeldung(result, false);
        return;
      }

      await this.ladeConfig();
      const person = this.person;

      if (!person) {
        this.zeigeMeldung(
          loginConfig.messages?.memberDataErrorTitle,
          loginConfig.messages?.memberDataError,
          false
        );
        return;
      }

      const loginIdentitaet = this.speichereMemberLoginIdentitaet();
      if (loginIdentitaet) {
        this.person = {
          ...this.person,
          statusGruppe: this.person.statusGruppe || loginIdentitaet.statusGruppe,
          loginStatusGruppe: loginIdentitaet.statusGruppe,
          [loginIdentitaet.identifierField]: loginIdentitaet.identifierValue
        };
      }

      this.memberLoginOtpAngefordert = false;
      this.memberLoginDaten.passwort = "";
      this.zeigeServerMeldung(result, false);
      this.zurueck();
    } catch (error) {
      console.error("Fehler bei der Mitgliederanmeldung:", error);
      if (error.result) {
        this.zeigeServerMeldung(error.result, false);
      } else {
        this.zeigeMeldung(
          loginConfig.messages?.authenticationErrorTitle,
          loginConfig.messages?.authenticationError,
          false
        );
      }
    } finally {
      this.memberLoginBusy = false;
      this.versteckeLadenIntern();
    }
  },


  zurueck() {
    this.zerstoereFormio();

    this.view = "auswahl";
    this.selectedForm = null;
    this.memberLoginOtpAngefordert = false;
    this.memberLoginDaten = this.leereMemberLoginDaten();

    aktualisiereUrl(null);
    window.scrollTo(0, 0);
  },


  zerstoereFormio() {
    zerstoereFormular(
      this.activeFormInstance
    );

    this.activeFormInstance = null;
  },


  async ladeFormioEffect() {
    const form =
      this.selectedForm;

    const baseUrl =
      this.config?.forms?.baseUrl;

    if (!form || !baseUrl) {
      return;
    }

    const formUrl =
      `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(form.id)}`;

    const container =
      document.getElementById(
        "formio"
      );

    if (!container) {
      return;
    }

    try {
      this.activeFormInstance =
        await ladeFormular(
          container,
          formUrl,
          {
            onSubmitDone: () => {
              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            }
          }
        );

    } catch (error) {
      console.error(
        "Das Formular konnte nicht geladen werden:",
        error
      );

      container.innerHTML = `
        <div
          class="alert alert-danger"
          role="alert"
        >
          Das Formular konnte nicht geladen werden.
          Bitte versuche es später erneut.
        </div>
      `;
    }
  },


  behandleUrlBeimStart() {
    const formId =
      leseFormIdAusUrl();

    if (!formId) {
      return;
    }

    const forms =
      Array.isArray(
        this.config?.forms?.items
      )
        ? this.config.forms.items
        : [];

    const form =
      forms.find(
        (item) =>
          item.id === formId
      );

    if (!form) {
      this.warnung =
        "Das angeforderte Formular wurde nicht gefunden.";

      return;
    }

    this.selectedForm = form;
    this.view = "formular";
  },


  behandlePopState() {
    const formId =
      leseFormIdAusUrl();

    if (!formId) {
      this.zerstoereFormio();

      this.view = "auswahl";
      this.selectedForm = null;

      return;
    }

    const forms =
      Array.isArray(
        this.config?.forms?.items
      )
        ? this.config.forms.items
        : [];

    const form =
      forms.find(
        (item) =>
          item.id === formId
      );

    if (!form) {
      return;
    }

    this.zerstoereFormio();

    this.selectedForm = form;
    this.view = "formular";
  },


  /*
   * Zentrale Verarbeitung für
   * Form.io-Formulare.
   */
  async sendeFormular(
    instance,
    config = {}
  ) {
    const webhookUrl =
      config.webhookUrl;

    const method =
      config.method ||
      "POST";

    const ladeText =
      config.ladeText ||
      "Deine Daten werden übermittelt …";

    const zurueckNachErfolg =
      config.zurueckNachErfolg ??
      true;

    if (!webhookUrl) {
      console.error(
        "sendeFormular: webhookUrl fehlt."
      );

      return;
    }

    try {
      // Button während des Requests sperren
      instance.disabled = true;
      instance.redraw();

      // Globale Ladeanzeige
      this.zeigeLadenIntern(
        ladeText
      );

      // Daten über api.js an n8n senden
      const result =
        await sendeFormularRequest(
          webhookUrl,
          method,
          config.data !== undefined ? config.data : instance.root.data
        );

      if (!result || typeof result.erfolgreich !== "boolean") {
        const error = new Error("Ungültige JSON-Antwort.");
        error.result = result;
        throw error;
      }

      /*
       * n8n hat den Request verarbeitet,
       * meldet aber fachlich einen Fehler.
       */
      if (
        result.erfolgreich === false
      ) {
        this.zeigeServerMeldung(result, false);

        return;
      }

      /*
       * Erfolgreiche Verarbeitung.
       */
      if (
        result.erfolgreich === true
      ) {

        /*
         * Optional:
         * n8n kann eine Datei als
         * Base64 zurückgeben.
         */
        if (
          result.datei &&
          typeof result.datei ===
            "object" &&
          result.datei.base64
        ) {
          this.ladeDateiHerunter(
            result.datei.base64,
            result.datei.dateiname,
            result.datei.mimeType ||
              "application/pdf"
          );
        }

        if (typeof config.onSuccess === "function") {
          await config.onSuccess(result);
        }

        this.zeigeServerMeldung(result, zurueckNachErfolg);

        return;
      }

      throw new Error(
        "Ungültige JSON-Antwort."
      );

    } catch (error) {
      console.error(
        "Fehler beim Absenden des Formulars:",
        error
      );

      if (error.result) {
        this.zeigeServerMeldung(error.result, false);
      }

    } finally {
      this.versteckeLadenIntern();

      instance.disabled = false;
      instance.redraw();
    }
  },


  /*
   * Optionalen Base64-Dateiinhalt
   * aus einer n8n-Antwort herunterladen.
   */
  ladeDateiHerunter(
    base64,
    dateiname,
    mimeType = "application/pdf"
  ) {
    const binary =
      atob(base64);

    const bytes =
      new Uint8Array(
        binary.length
      );

    for (
      let i = 0;
      i < binary.length;
      i++
    ) {
      bytes[i] =
        binary.charCodeAt(i);
    }

    const blob =
      new Blob(
        [bytes],
        {
          type: mimeType
        }
      );

    const downloadUrl =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      downloadUrl;

    link.download =
      dateiname ||
      "Dokument.pdf";

    link.style.display =
      "none";

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(
        downloadUrl
      );
    }, 1000);
  },


  zeigeServerMeldung(result, zurueckNachSchliessen = false) {
    const titel = typeof result?.titel === "string" ? result.titel : "";
    const nachricht = typeof result?.nachricht === "string" ? result.nachricht : "";

    if (!titel.trim() && !nachricht.trim()) {
      console.error("Serverantwort enthält keine Meldungstexte:", result);
      return;
    }

    this.zeigeMeldung(titel, nachricht, zurueckNachSchliessen);
  },


  zeigeMeldung(
    titel,
    inhalt,
    zurueckNachSchliessen = true,
    options = {}
  ) {
    this.msgbox.titel =
      titel || "";

    this.msgbox.inhalt =
      inhalt || "";

    this.msgbox.buttonText =
      options.buttonText ||
      "Schließen";

    this.msgbox.zurueckNachSchliessen =
      zurueckNachSchliessen;

    this.msgbox.onClose =
      typeof options.onClose ===
      "function"
        ? options.onClose
        : null;

    this.msgbox.visible = true;
  },


  schliesseMeldung() {
    if (!this.msgbox.visible) {
      return;
    }

    this.msgbox.visible = false;

    const callback =
      this.msgbox.onClose;

    this.msgbox.onClose = null;

    if (callback) {
      callback();
    }

    if (
      this.msgbox
        .zurueckNachSchliessen
    ) {
      this.zurueck();
    }
  },


  zeigeLadenIntern(text) {
    this.loading.text =
      text ||
      "Daten werden verarbeitet ...";

    this.loading.visible = true;
  },


  versteckeLadenIntern() {
    this.loading.visible = false;
  }
});