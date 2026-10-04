// Einwilligungsverwaltung für optionale Browserspeicherungen (Login-Kennung, Kalenderansicht).
// Framework-unabhängig für alle Vue-Routen. Technisch notwendige Session-Cookies des Backends sind hiervon
// nicht betroffen und werden nicht verändert.

const CONSENT_STORAGE_KEY = "tsc-serviceportal.consent";
const CONSENT_VERSION = 1;

const LOGIN_IDENTITY_STORAGE_KEY = "tsc-serviceportal.member-login";
const LOGIN_IDENTITY_MAX_AGE_TAGE = 180;

const CALENDAR_VIEW_COOKIE_NAME = "tsc-serviceportal-calendar-view";
const CALENDAR_VIEW_COOKIE_MAX_AGE_TAGE = 365;
const ERLAUBTE_KALENDER_ANSICHTEN = ["dayGridMonth", "timeGridWeek", "timeGridDay"];

export const CONSENT_CHANGE_EVENT = "tsc-consent-changed";

const TAG_IN_MS = 24 * 60 * 60 * 1000;


// --- Entscheidung lesen/schreiben -------------------------------------------------

function leseEntscheidung() {
  try {
    const roh = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) || "null");

    if (
      !roh ||
      typeof roh !== "object" ||
      roh.version !== CONSENT_VERSION ||
      typeof roh.zeitpunkt !== "string" ||
      typeof roh.loginKennung !== "boolean" ||
      typeof roh.kalenderAnsicht !== "boolean"
    ) {
      return null;
    }

    return roh;
  } catch (error) {
    console.warn("Gespeicherte Einwilligungsentscheidung konnte nicht gelesen werden:", error);
    return null;
  }
}

function istEntschieden() {
  return leseEntscheidung() !== null;
}

export function hatEinwilligung(kategorie) {
  const entscheidung = leseEntscheidung();
  return entscheidung ? entscheidung[kategorie] === true : false;
}

export function leseAktuelleEntscheidung() {
  return leseEntscheidung();
}

function loescheLoginKennungEintrag() {
  try {
    window.localStorage.removeItem(LOGIN_IDENTITY_STORAGE_KEY);
  } catch (error) {
    console.warn("Login-Kennung konnte nicht entfernt werden:", error);
  }
}

function loescheKalenderAnsichtCookie() {
  document.cookie = `${CALENDAR_VIEW_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function wendeEntscheidungAn(entscheidung) {
  if (!entscheidung.loginKennung) {
    loescheLoginKennungEintrag();
  }

  if (!entscheidung.kalenderAnsicht) {
    loescheKalenderAnsichtCookie();
  }
}

function bereinigeUndokumentierteEintraege() {
  if (istEntschieden()) {
    return;
  }

  // Ohne gültige, versionierte Entscheidung gilt jede vorhandene optionale
  // Speicherung als undokumentiert und wird gezielt entfernt. Kein localStorage.clear().
  loescheLoginKennungEintrag();
  loescheKalenderAnsichtCookie();
}

export function speichereEntscheidung({ loginKennung, kalenderAnsicht }) {
  const entscheidung = {
    version: CONSENT_VERSION,
    zeitpunkt: new Date().toISOString(),
    loginKennung: loginKennung === true,
    kalenderAnsicht: kalenderAnsicht === true
  };

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(entscheidung));
  } catch (error) {
    console.warn("Einwilligungsentscheidung konnte nicht gespeichert werden:", error);
  }

  wendeEntscheidungAn(entscheidung);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: entscheidung }));

  return entscheidung;
}


// --- Login-Kennung (localStorage), nur bei Einwilligung ---------------------------

export function leseLoginKennung() {
  if (!hatEinwilligung("loginKennung")) {
    loescheLoginKennungEintrag();
    return null;
  }

  try {
    const roh = JSON.parse(window.localStorage.getItem(LOGIN_IDENTITY_STORAGE_KEY) || "null");
    const wert = roh?.wert;

    if (
      !wert ||
      typeof wert.statusGruppe !== "string" ||
      typeof wert.identifierField !== "string" ||
      typeof wert.identifierValue !== "string" ||
      typeof roh.gespeichertAm !== "string"
    ) {
      return null;
    }

    const gespeichertAm = new Date(roh.gespeichertAm).getTime();
    const istAbgelaufen = Number.isNaN(gespeichertAm) || (Date.now() - gespeichertAm) > LOGIN_IDENTITY_MAX_AGE_TAGE * TAG_IN_MS;

    if (istAbgelaufen) {
      loescheLoginKennungEintrag();
      return null;
    }

    return wert;
  } catch (error) {
    console.warn("Gespeicherte Login-Kennung konnte nicht gelesen werden:", error);
    return null;
  }
}

export function schreibeLoginKennung(identitaet) {
  if (!hatEinwilligung("loginKennung")) {
    return false;
  }

  try {
    window.localStorage.setItem(
      LOGIN_IDENTITY_STORAGE_KEY,
      JSON.stringify({ wert: identitaet, gespeichertAm: new Date().toISOString() })
    );
    return true;
  } catch (error) {
    console.warn("Login-Kennung konnte nicht gespeichert werden:", error);
    return false;
  }
}

export function loescheLoginKennung() {
  loescheLoginKennungEintrag();
}


// --- Kalenderansicht (Cookie), nur bei Einwilligung -------------------------------

export function leseKalenderAnsicht() {
  if (!hatEinwilligung("kalenderAnsicht")) {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((eintrag) => eintrag.startsWith(`${CALENDAR_VIEW_COOKIE_NAME}=`));
  const ansicht = cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";

  return ERLAUBTE_KALENDER_ANSICHTEN.includes(ansicht) ? ansicht : "";
}

export function schreibeKalenderAnsicht(ansicht) {
  if (!hatEinwilligung("kalenderAnsicht") || !ERLAUBTE_KALENDER_ANSICHTEN.includes(ansicht)) {
    return;
  }

  document.cookie = `${CALENDAR_VIEW_COOKIE_NAME}=${encodeURIComponent(ansicht)}; Max-Age=${CALENDAR_VIEW_COOKIE_MAX_AGE_TAGE * 24 * 60 * 60}; Path=/; SameSite=Lax; Secure`;
}


// --- Banner- und Einstellungen-UI -------------------------------------------------

function ermittleDatenschutzLink() {
  const links = document.querySelectorAll(".footer-link");

  for (const link of links) {
    if (/datenschutz/i.test(link.textContent || "")) {
      return link.getAttribute("href") || "";
    }
  }

  return "";
}

function aktualisiereDatenschutzLink(wurzel) {
  const link = wurzel.querySelector("[data-consent-privacy-link]");
  const href = ermittleDatenschutzLink();

  if (href) {
    link.href = href;
    link.hidden = false;
  } else {
    link.hidden = true;
  }
}

function erzeugeBannerMarkup() {
  const wurzel = document.createElement("div");

  wurzel.innerHTML = `
    <div class="consent-overlay" id="tsc-consent-overlay" role="dialog" aria-modal="true" aria-labelledby="tsc-consent-title" hidden>
      <div class="consent-backdrop" data-consent-backdrop></div>
      <div class="consent-dialog">
        <h2 id="tsc-consent-title">Datenschutzeinstellungen</h2>
        <p class="consent-text">Wir verwenden technisch notwendige Speicherfunktionen für Anmeldung und Betrieb des Portals. Mit Ihrer Zustimmung merken wir uns zusätzlich Ihre Login-Kennung und Ihre Kalenderansicht auf diesem Gerät. Sie können das Portal auch ohne diese Komfortfunktionen nutzen und Ihre Auswahl jederzeit ändern.</p>

        <div class="consent-options" data-consent-options hidden>
          <label class="consent-toggle">
            <input type="checkbox" data-consent-toggle="loginKennung">
            <span class="consent-toggle-text">
              <strong>Login-Kennung merken</strong>
              <small>Speichert Statusgruppe und Kennung für bis zu ${LOGIN_IDENTITY_MAX_AGE_TAGE} Tage lokal in diesem Browser. Kein Passwort, kein Einmalcode.</small>
            </span>
          </label>
          <label class="consent-toggle">
            <input type="checkbox" data-consent-toggle="kalenderAnsicht">
            <span class="consent-toggle-text">
              <strong>Kalenderansicht merken</strong>
              <small>Speichert die zuletzt gewählte Kalenderansicht (Monat, Woche, Tag) für ${CALENDAR_VIEW_COOKIE_MAX_AGE_TAGE} Tage in einem Cookie.</small>
            </span>
          </label>
        </div>

        <div class="consent-actions">
          <button type="button" class="consent-btn consent-btn-ghost" data-consent-action="settings">Einstellungen</button>
          <button type="button" class="consent-btn consent-btn-outline" data-consent-action="reject">Nur technisch notwendige</button>
          <button type="button" class="consent-btn consent-btn-primary" data-consent-action="accept-all">Alle erlauben</button>
        </div>
        <div class="consent-actions" data-consent-save-actions hidden>
          <button type="button" class="consent-btn consent-btn-primary" data-consent-action="save">Auswahl speichern</button>
        </div>

        <p class="consent-links">
          <a href="#" data-consent-privacy-link target="_blank" rel="noopener noreferrer" hidden>Datenschutzerklärung</a>
        </p>
      </div>
    </div>
  `;

  return wurzel.firstElementChild;
}

function erzeugeReopenLink() {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "tsc-consent-reopen";
  button.className = "consent-reopen-link";
  button.textContent = "Datenschutzeinstellungen";
  return button;
}

function fuelleOptionenMitEntscheidung(overlay) {
  const entscheidung = leseEntscheidung();
  overlay.querySelector('[data-consent-toggle="loginKennung"]').checked = entscheidung?.loginKennung === true;
  overlay.querySelector('[data-consent-toggle="kalenderAnsicht"]').checked = entscheidung?.kalenderAnsicht === true;
}

function initialisiereBannerVerhalten(overlay) {
  const options = overlay.querySelector("[data-consent-options]");
  const saveActions = overlay.querySelector("[data-consent-save-actions]");

  const verstecke = () => {
    overlay.hidden = true;
  };

  const zeige = ({ einstellungenOeffnen = false } = {}) => {
    fuelleOptionenMitEntscheidung(overlay);
    aktualisiereDatenschutzLink(overlay);
    options.hidden = !einstellungenOeffnen;
    saveActions.hidden = !einstellungenOeffnen;
    overlay.hidden = false;
  };

  overlay.addEventListener("click", (event) => {
    // Banner schließt ausschließlich über eine der Aktionen, nicht per Klick auf Backdrop/Overlay.
    const aktion = event.target.closest("[data-consent-action]")?.dataset.consentAction;

    if (!aktion) {
      return;
    }

    if (aktion === "settings") {
      const sichtbar = !options.hidden;
      options.hidden = sichtbar;
      saveActions.hidden = sichtbar;
      return;
    }

    if (aktion === "accept-all") {
      speichereEntscheidung({ loginKennung: true, kalenderAnsicht: true });
      verstecke();
      return;
    }

    if (aktion === "reject") {
      speichereEntscheidung({ loginKennung: false, kalenderAnsicht: false });
      verstecke();
      return;
    }

    if (aktion === "save") {
      speichereEntscheidung({
        loginKennung: overlay.querySelector('[data-consent-toggle="loginKennung"]').checked,
        kalenderAnsicht: overlay.querySelector('[data-consent-toggle="kalenderAnsicht"]').checked
      });
      verstecke();
    }
  });

  return { zeige };
}

function beobachteFooterFuerDatenschutzLink(overlay) {
  const beobachter = new MutationObserver(() => {
    const link = overlay.querySelector("[data-consent-privacy-link]");
    if (link.hidden) {
      aktualisiereDatenschutzLink(overlay);
    }
  });

  beobachter.observe(document.body, { childList: true, subtree: true });
}

let initialisiert = false;

function stelleSicher() {
  if (initialisiert) {
    return;
  }

  initialisiert = true;

  bereinigeUndokumentierteEintraege();

  const overlay = erzeugeBannerMarkup();
  document.body.appendChild(overlay);
  const { zeige } = initialisiereBannerVerhalten(overlay);
  beobachteFooterFuerDatenschutzLink(overlay);

  const reopenLink = erzeugeReopenLink();
  reopenLink.addEventListener("click", () => zeige({ einstellungenOeffnen: true }));
  document.body.appendChild(reopenLink);

  if (!istEntschieden()) {
    zeige();
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", stelleSicher, { once: true });
  } else {
    stelleSicher();
  }
}
