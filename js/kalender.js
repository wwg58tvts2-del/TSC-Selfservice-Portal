    import { createApp, reactive } from "https://unpkg.com/petite-vue?module";

    function CalendarApp() {
      return reactive({
        loading: true,
        error: "",
        config: null,
        events: [],
        selectedHalls: [],
        selectedEvent: null,
        calendarInstance: null,
        ferienUndStornos: {
          ferien: [],
          storno: []
        },

        halls: [
          { id: "saal-1", name: "Saal 1", color: "#2f8f46", match: "saal 1" },
          { id: "saal-2", name: "Saal 2", color: "#c62828", match: "saal 2" },
          { id: "saal-3", name: "Saal 3", color: "#2868b2", match: "saal 3" },
          { id: "halle", name: "Halle", color: "#d6a900", match: "halle" }
        ],

        async load() {
          console.log("[Kalender] load() gestartet");
          try {
            this.config = await this.ladeKonfiguration();
            this.selectedHalls = this.halls.map((hall) => hall.id);
            const kalenderEndpoint = this.config?.calendarUrl;
            console.log("[Kalender] fetch() an", kalenderEndpoint);
            const response = await fetch(kalenderEndpoint, {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers: { Accept: "application/json" }
            });

            console.log("[Kalender] fetch status:", response.status, response.statusText);
            const result = await response.json();
            console.log("[Kalender] Response-Body:", result);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            console.log("[Kalender] normalisiereKalender() start");
            this.events = this.normalisiereKalender(result);
            console.log("[Kalender] events nach Normalisierung:", this.events.length, this.events.slice(0, 3));

            setTimeout(() => {
              console.log("[Kalender] renderCalendar() gestartet");
              this.renderCalendar();
            }, 0);
          } catch (error) {
            console.error("[Kalender] Fehler im load()-Pfad:", error);
            this.error = "Der Kalender konnte nicht geladen werden. Bitte später erneut versuchen.";
          } finally {
            console.log("[Kalender] load() finally. loading=false");
            this.loading = false;
          }
        },

        async ladeKonfiguration() {
          const lokaleConfigResponse = await fetch("config.json", {
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" }
          });
          const lokaleConfig = await lokaleConfigResponse.json();
          if (!lokaleConfigResponse.ok) throw new Error(`Lokale Konfiguration HTTP ${lokaleConfigResponse.status}`);

          const configUrl = lokaleConfig.configUrl;
          if (!configUrl) throw new Error("config.json enthält keine configUrl.");
          const response = await fetch(configUrl, {
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" }
          });
          const result = await response.json();
          if (!response.ok) throw new Error(`Konfiguration HTTP ${response.status}`);
          const config = Array.isArray(result) ? result[0] : result;
          if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Ungültige Portal-Konfiguration.");
          const favicon = document.getElementById("favicon");
          if (favicon && config.page?.favicon) favicon.href = config.page.favicon;
          console.log("[Kalender] Portal-Konfiguration geladen:", config.header, config.footer);
          return config;
        },

        get sichtbareFooterLinks() {
          return Array.isArray(this.config?.footer)
            ? this.config.footer
            : [];
        },

        normalisiereKalender(result) {
          const daten = Array.isArray(result)
            ? result.reduce((acc, item) => ({ ...acc, ...(item || {}) }), {})
            : (result || {});
          const events = [];

          this.ferienUndStornos = {
            ferien: Array.isArray(daten?.ferien) ? daten.ferien : [],
            storno: Array.isArray(daten?.storno) ? daten.storno : []
          };

          const gruppen = Array.isArray(daten?.gruppen) ? daten.gruppen : [];
          gruppen.forEach((gruppe) => {
            if (gruppe.inaktiv === true) {
              return;
            }

            const termine = Array.isArray(gruppe.gruzar) ? gruppe.gruzar : [];
            termine.forEach((termin, index) => {
              const wochentag = Number(termin.wotag);
              const gruppentext = this.leseGruppentext(gruppe.grutxt);
              const leistungsniveau = String(gruppe.hp_leiststufe || gruppe.gzfld03 || "").trim();
              const altersstufe = String(gruppe.hp_altersstufe || gruppentext.altersgruppe || "").trim();
              const bereich = gruppe.hp_kat || String(gruppe.kbez || "").replace(/^Training\s+/i, "");
              const freieBeschreibung = gruppentext.beschreibung;
              events.push({
                terminId: `gruppe-${gruppe.gruid}-${index}`,
                titel: gruppe.gruppenname || "Training",
                beschreibung: freieBeschreibung,
                notiz: String(gruppe.notiz || "").trim(),
                saal: { name: termin.ortbez || termin.ortkb || "" },
                trainer: gruppe.trnameall
                  ? [{ name: gruppe.trnameall }]
                  : [],
                wochentagId: wochentag,
                startzeit: termin.startzeit,
                endzeit: termin.endzeit,
                leistungsniveau,
                altersstufe,
                bereich,
                gruppenId: String(gruppe.gruid),
                eintragIndex: index,
                kwRegel: gruppe.gzfld05 || "",
                kursvon: gruppe.kursvon || "",
                kursbis: gruppe.kursbis || "",
                recurring: true
              });
            });
          });

          const reservierungen = Array.isArray(daten?.reservierungen)
            ? daten.reservierungen
            : [];
          reservierungen.forEach((reservierung) => {
            events.push({
              terminId: `reservierung-${reservierung.id}`,
              titel: reservierung.titel || "Reservierung",
              beschreibung: reservierung.beschreibung || "",
              saal: { name: reservierung.saal || "" },
              von: reservierung.von,
              bis: reservierung.bis,
              reservation: true
            });
          });

          return events;

        },

        leseGruppentext(text) {
          const freieZeilen = [];
          let leistungsstufe = "";
          let altersgruppe = "";
          let naechstesFeld = "";
          const zeilen = String(text || "")
            .replace(/\r/g, "")
            .split("\n")
            .map((zeile) => zeile.trim())
            .filter(Boolean);

          zeilen.forEach((zeile) => {
            const treffer = zeile.match(/^(Leistungsniveau|Altersgruppe):\s*(.*)$/i);
            if (treffer) {
              naechstesFeld = treffer[1].toLowerCase() === "altersgruppe"
                ? "altersgruppe"
                : "leistungsstufe";
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

        renderCalendar() {
          console.log("[Kalender] renderCalendar() aufgerufen");
          const calendarElement = document.getElementById("calendar");
          console.log("[Kalender] calendarElement vorhanden:", !!calendarElement, "events.length:", this.events.length);

          if (!calendarElement || !this.events.length) {
            console.warn("[Kalender] renderCalendar() abgebrochen: kein Element oder keine Events");
            return;
          }

          if (!window.FullCalendar) {
            console.error("[Kalender] FullCalendar global nicht verfügbar. CSS/Script möglicherweise blockiert oder nicht geladen.");
            this.error = "Der Kalender konnte nicht initialisiert werden. Bitte Seite neu laden.";
            return;
          }

          if (this.calendarInstance) {
            console.log("[Kalender] bestehende Instance zerstört");
            this.calendarInstance.destroy();
          }

          console.log("[Kalender] FullCalendar.Calendar wird initialisiert");
          const calendar = new FullCalendar.Calendar(calendarElement, {
            locale: "de",
            firstDay: 1,
            initialView: window.innerWidth < 700 ? "timeGridDay" : "dayGridMonth",
            height: "auto",
            expandRows: true,
            headerToolbar: {
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            },
            buttonText: {
              today: "Heute",
              month: "Monat",
              week: "Woche",
              day: "Tag"
            },
            allDaySlot: false,
            slotMinTime: "07:00:00",
            slotMaxTime: "23:00:00",
            nowIndicator: true,
            eventTimeFormat: {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            },
            events: (fetchInfo, successCallback) => {
              successCallback(this.erstelleSichtbareKalenderEvents(fetchInfo));
            },
            eventClick: (info) => {
              const props = info.event.extendedProps;
              this.selectedEvent = {
                title: info.event.title,
                start: info.event.start?.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) || "",
                end: info.event.end?.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) || "",
                ...props
              };
            },
            eventDidMount(info) {
              const props = info.event.extendedProps;
              const details = [props.saal, props.trainer].filter(Boolean).join(" | ");
              if (details) {
                info.el.title = details;
              }
            }
          });

          this.calendarInstance = calendar;
          calendar.render();
        },

        filterCalendar() {
          this.selectedEvent = null;
          this.renderCalendar();
        },

        setHallFilter(filter) {
          this.selectedHalls = this.selectedHalls.includes(filter)
            ? this.selectedHalls.filter((hallId) => hallId !== filter)
            : [...this.selectedHalls, filter];
          console.log("[Kalender] Säle geändert:", this.selectedHalls);
          this.filterCalendar();
        },

        erstelleSichtbareKalenderEvents(fetchInfo) {
          const sichtbareEvents = [];
          const startDatum = new Date(fetchInfo.start);
          const endDatum = new Date(fetchInfo.end);

          this.events
            .filter((event) => this.selectedHalls.includes(this.getHallId(event)))
            .forEach((event) => {
              if (!event.recurring) {
                sichtbareEvents.push(this.erstelleFullCalendarEvent(event));
                return;
              }

              const wochentag = Number(event.wochentagId) === 7
                ? 0
                : Number(event.wochentagId);
              const datum = new Date(startDatum);

              datum.setHours(0, 0, 0, 0);
              while (datum < endDatum) {
                if (
                  datum.getDay() === wochentag &&
                  this.istTerminInnerhalbKurszeit(event, datum) &&
                  !this.istGruppenterminAusgenommen(event, datum) &&
                  this.istTerminInKalenderwoche(event, datum)
                ) {
                  const datumText = this.datumAlsIso(datum);
                  sichtbareEvents.push({
                    ...this.erstelleFullCalendarEvent(event),
                    id: `${event.terminId}-${datumText}`,
                    start: `${datumText}T${event.startzeit}`,
                    end: `${datumText}T${event.endzeit}`
                  });
                }
                datum.setDate(datum.getDate() + 1);
              }
            });

          return sichtbareEvents;
        },

        erstelleFullCalendarEvent(event) {
          return {
            id: event.terminId,
            title: event.titel || "Training",
            ...(event.recurring
              ? {}
              : {
                  start: event.von,
                  end: event.bis
                }),
            extendedProps: {
              beschreibung: event.beschreibung,
              notiz: event.notiz || "",
              trainer: (event.trainer || []).map((person) => person.name).join(", "),
              saal: event.saal?.name || "",
              niveau: event.leistungsniveau || event.leistung || "",
              beitrag: event.beitrag || "",
              altersstufe: event.altersstufe || "",
              bereich: event.bereich || ""
            },
            color: this.getHallColor(event),
            textColor: this.getHallId(event) === "halle" ? "#171717" : "#ffffff"
          };
        },

        istGruppenterminAusgenommen(event, datum) {
          const datumText = this.datumAlsIso(datum);
          const storniert = this.ferienUndStornos.storno.some((storno) =>
            String(storno.gruppenId) === String(event.gruppenId) &&
            String(storno.datum).slice(0, 10) === datumText
          );
          const inFerien = this.ferienUndStornos.ferien.some((ferien) =>
            datumText >= String(ferien.von).slice(0, 10) &&
            datumText <= String(ferien.bis).slice(0, 10)
          );

          return storniert || inFerien;
        },

        istTerminInnerhalbKurszeit(event, datum) {
          const datumText = this.datumAlsIso(datum);
          const kursvon = String(event.kursvon || "").slice(0, 10);
          const kursbis = String(event.kursbis || "").slice(0, 10);
          const hatKursbeginn = kursvon && kursvon !== "0000-00-00";
          const hatKursende = kursbis && kursbis !== "0000-00-00";

          return (!hatKursbeginn || datumText >= kursvon) &&
            (!hatKursende || datumText <= kursbis);
        },

        istTerminInKalenderwoche(event, datum) {
          const regel = String(event.kwRegel || "").toLowerCase();
          if (!regel) {
            return true;
          }

          const match = regel.match(/erster eintrag ist (gerade|ungerade) kw/);
          if (!match) {
            console.warn("[Kalender] Unbekannte KW-Regel, Termin wird angezeigt:", event.kwRegel);
            return true;
          }

          const ersteWocheIstGerade = match[1] === "gerade";
          const eintragSollGeradeSein = event.eintragIndex === 0
            ? ersteWocheIstGerade
            : !ersteWocheIstGerade;

          return this.kalenderwocheIstGerade(datum) === eintragSollGeradeSein;
        },

        kalenderwocheIstGerade(datum) {
          const utcDatum = new Date(Date.UTC(
            datum.getFullYear(),
            datum.getMonth(),
            datum.getDate()
          ));
          const wochentag = utcDatum.getUTCDay() || 7;
          utcDatum.setUTCDate(utcDatum.getUTCDate() + 4 - wochentag);
          const jahresanfang = new Date(Date.UTC(utcDatum.getUTCFullYear(), 0, 1));
          const kalenderwoche = Math.ceil((((utcDatum - jahresanfang) / 86400000) + 1) / 7);

          return kalenderwoche % 2 === 0;
        },

        datumAlsIso(datum) {
          return [
            datum.getFullYear(),
            String(datum.getMonth() + 1).padStart(2, "0"),
            String(datum.getDate()).padStart(2, "0")
          ].join("-");
        },

        getHallId(event) {
          const name = String(event.saal?.name || "").toLowerCase();
          const hall = this.halls.find((item) => name.includes(item.match));
          return hall?.id || "unbekannt";
        },

        getHallColor(event) {
          const hall = this.halls.find((item) => item.id === this.getHallId(event));
          return hall?.color || "#8e0000";
        }
      });
    }

    createApp({ CalendarApp }).mount("body");
