import { createApp, reactive } from "https://unpkg.com/petite-vue?module";

const kalenderUrl = "/webhook/kalender";

function TrainingPlanApp() {
  return reactive({
    loading: true,
    error: "",
    config: null,
    gruppen: [],
    search: "",
    tagFilter: "alle",
    trainerFilter: "alle",

    async load() {
      const start = performance.now();
      console.group(`[Trainingsplan] Daten laden: ${kalenderUrl}`);
      console.log("Ladevorgang gestartet");
      console.log("Methode:", "GET");
      console.log("Credentials:", "include (Cookies werden nicht geloggt)");
      console.log("Cache:", "no-store");
      try {
        this.config = await this.ladeKonfiguration();
        let response;
        try {
          response = await fetch(kalenderUrl, {
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" }
          });
        } catch (error) {
          console.error("Netzwerkfehler beim Trainingsplan-Request:", error);
          throw error;
        }

        const contentType = response.headers.get("content-type") || "";
        console.log("Antwort erhalten nach:", `${Math.round(performance.now() - start)} ms`);
        console.log("HTTP-Status:", response.status, response.statusText);
        console.log("Content-Type:", contentType || "nicht gesetzt");

        let result;
        try {
          result = contentType.includes("application/json")
            ? await response.json()
            : await response.text();
        } catch (error) {
          console.error("Antwort konnte nicht gelesen werden:", error);
          throw error;
        }

        console.log("Response-Body:", result);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!result || typeof result !== "object") throw new Error("Ungültige Trainingsplan-Antwort.");

        const daten = Array.isArray(result)
          ? result.reduce((acc, item) => ({ ...acc, ...(item || {}) }), {})
          : (result || {});
        const alleGruppen = Array.isArray(daten.gruppen) ? daten.gruppen : [];
        const aktiveGruppen = alleGruppen.filter((gruppe) => gruppe.inaktiv !== true);
        console.log("JSON-Schlüssel:", Object.keys(daten));
        console.log("Gruppen gesamt:", alleGruppen.length);
        console.log("Inaktive Gruppen:", alleGruppen.length - aktiveGruppen.length);
        console.log("Aktive Gruppen:", aktiveGruppen.length);
        console.log("Reservierungen werden für den Trainingsplan ignoriert:", Array.isArray(daten.reservierungen) ? daten.reservierungen.length : 0);
        this.gruppen = aktiveGruppen.map((gruppe) => this.normalisiereGruppe(gruppe));
        console.log("Gruppen nach Normalisierung:", this.gruppen);
        console.log("Bereiche:", this.eindeutigeWerte("bereich"));
        console.log("Tage:", this.tageFilter);
        console.log("Trainer*innen:", this.trainerNamen);
        console.log("Trainingsplan erfolgreich verarbeitet.");
      } catch (error) {
        console.error("[Trainingsplan] Laden fehlgeschlagen:", error);
        this.error = "Der Trainingsplan konnte nicht geladen werden. Bitte später erneut versuchen.";
      } finally {
        this.loading = false;
        console.log("Ladevorgang beendet nach:", `${Math.round(performance.now() - start)} ms`);
        console.groupEnd();
      }
    },

    async ladeKonfiguration() {
      const response = await fetch("/webhook/portal-config", {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(`Konfiguration HTTP ${response.status}`);
      if (!result || typeof result !== "object") throw new Error("Ungültige Portal-Konfiguration.");
      const favicon = document.getElementById("favicon");
      if (favicon && result.page?.favicon) favicon.href = result.page.favicon;
      console.log("[Trainingsplan] Portal-Konfiguration geladen:", result.header, result.footer);
      return result;
    },

    get sichtbareFooterLinks() {
      return Array.isArray(this.config?.footer)
        ? this.config.footer.filter((link) => link.active !== false)
        : [];
    },

    normalisiereGruppe(gruppe) {
      const bereich = gruppe.hp_kat || String(gruppe.kbez || "").replace(/^Training\s+/i, "");
      const gruppentext = this.leseGruppentext(gruppe.grutxt);
      const stufe = String(gruppe.hp_leiststufe || gruppe.gzfld03 || "").trim();
      const normalisierteGruppe = {
        id: String(gruppe.gruid),
        name: gruppe.gruppenname || "Training",
        bereich: String(bereich).trim(),
        stufe: String(stufe).trim(),
        alter: String(gruppe.hp_altersstufe || gruppentext.altersgruppe || "").trim(),
        trainer: String(gruppe.trnameall || "").trim(),
        beschreibung: gruppentext.beschreibung,
        notiz: String(gruppe.notiz || "").trim(),
        termine: (Array.isArray(gruppe.gruzar) ? gruppe.gruzar : []).map((termin, index) => ({
          id: `${gruppe.gruid}-${index}`,
          tag: termin.wochentag || "",
          start: String(termin.startzeit || "").slice(0, 5),
          ende: String(termin.endzeit || "").slice(0, 5),
          saal: termin.ortbez || termin.ortkb || ""
        }))
      };
      console.log("[Trainingsplan] Gruppe normalisiert:", normalisierteGruppe);
      return normalisierteGruppe;
    },

    leseGruppentext(text) {
      const freieZeilen = [];
      let leistungsstufe = "";
      let altersgruppe = "";
      let naechstesFeld = "";
      const zeilen = String(text || "").replace(/\r/g, "").split("\n").map((zeile) => zeile.trim()).filter(Boolean);
      zeilen.forEach((zeile) => {
        const treffer = zeile.match(/^(Leistungsniveau|Altersgruppe):\s*(.*)$/i);
        if (treffer) {
          naechstesFeld = treffer[1].toLowerCase() === "altersgruppe" ? "altersgruppe" : "leistungsstufe";
          if (treffer[2]) {
            if (naechstesFeld === "altersgruppe") altersgruppe = treffer[2];
            else leistungsstufe = treffer[2];
            naechstesFeld = "";
          }
          return;
        }
        if (naechstesFeld === "altersgruppe") altersgruppe = zeile;
        else if (naechstesFeld === "leistungsstufe") leistungsstufe = zeile;
        else freieZeilen.push(zeile);
        naechstesFeld = "";
      });
      return { leistungsstufe, altersgruppe, beschreibung: freieZeilen.join("\n") };
    },

    logFilterChange(name, value) {
      console.log("[Trainingsplan] Filter geändert:", name, value, "Verbleibende Gruppen:", this.gefilterteGruppen.length);
    },

    get tageFilter() {
      return [...new Set(this.gruppen.flatMap((gruppe) => gruppe.termine.map((termin) => termin.tag).filter(Boolean)))];
    },

    get trainerNamen() {
      return this.eindeutigeWerte("trainer");
    },

    eindeutigeWerte(feld) {
      return [...new Set(this.gruppen.map((gruppe) => gruppe[feld]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
    },

    get gefilterteGruppen() {
      const suchtext = this.search.trim().toLowerCase();
      return this.gruppen.filter((gruppe) => {
        const passtSuche = !suchtext || [gruppe.name, gruppe.bereich, gruppe.stufe, gruppe.alter, gruppe.trainer, gruppe.beschreibung, gruppe.notiz].join(" ").toLowerCase().includes(suchtext);
        const passtTag = this.tagFilter === "alle" || gruppe.termine.some((termin) => termin.tag === this.tagFilter);
        return passtSuche && passtTag && (this.trainerFilter === "alle" || gruppe.trainer === this.trainerFilter);
      });
    }
  });
}

createApp({ TrainingPlanApp }).mount("body");
