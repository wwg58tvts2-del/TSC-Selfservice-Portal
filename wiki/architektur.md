# Architektur

## Laufzeit

Das Portal ist eine Vue-3-SPA mit Vite, Pinia und Vue Router. Es gibt genau einen HTML-Einstieg (`index.html`); `npm run build` erzeugt die Anwendung unter `dist/`. Nginx führt unbekannte Pfade auf `index.html` zurück, damit saubere Formularpfade funktionieren.

Die Routen `/`, `/login`, `/<form-id>`, `/kalender` und `/trainingsplan` zeigen alle Ansichten in derselben Vue-App. Alte `?form=<id>`- und Hash-Formularlinks werden auf `/<form-id>` migriert; alte `.html`-Adressen werden aus `public/` weitergeleitet.

## Hauptmodule

| Modul | Verantwortung |
| --- | --- |
| `src/App.vue` | Hauptportal, Suche, Login und Formularansicht |
| `src/PortalPage.vue` | Suche, Login und Form.io-Ansicht |
| `src/CalendarPage.vue` | Kalenderoberfläche und FullCalendar-Lebenszyklus |
| `src/TrainingPlanPage.vue` | Trainingsplanoberfläche und Filter |
| `src/router.js` | Pfadrouten und Legacy-URL-Migration |
| `js/main.js` | Vue-/Pinia-Mount und globale Form.io-Schnittstellen |
| `js/state.js` | Portal-Pinia-Store: Konfiguration, Mitgliedsstatus, Login, Meldungen und Versand |
| `js/api.js` | Fetch, Cookies, JSON-Verarbeitung und Response-Logging |
| `js/formio.js` | Erzeugen und Zerstören der Form.io-Instanz |
| `js/navigation.js` | Lesen von `?form=`-Legacy-Links |
| `js/kalender.js` | Trainings-/Reservierungsevents und FullCalendar |
| `js/trainingsplan.js` | Gruppen-Normalisierung und Such-/Tag-/Trainerfilter |

`css/main.css` importiert die Stylesheets. `responsive.css` kommt zuletzt, um die mobilen Regeln durchzusetzen. Die Trainingsgruppen-Seite ergänzt `css/trainingsgruppen.css` separat. `public/` enthält Laufzeitkonfiguration, Bilder und die gepinnten lokalen Drittanbieter-Bibliotheken.

## Datenfluss

1. `config.json` liefert die URL der Laufzeitkonfiguration.
2. `state.js` lädt die Konfiguration ohne Cache und fragt anschließend `memberStatusUrl` ab.
3. Die Hauptauswahl rendert die drei Listen aus `forms.items`, `onlineServices.items` und `downloads.items`.
4. Formularauswahl öffnet `/<form-id>`; Form.io lädt `forms.baseUrl/<id>`.
5. Formularversand und Logout laufen über `api.js`; der State steuert Loader, Meldungen und Cleanup.

Kalender und Trainingsplan laden `config.json` und anschließend separat `calendarUrl`. Die drei Ansichten besitzen jeweils einen Pinia-Store; Endpunktadresse und fachliche Normalisierung bleiben wie bisher konfigurationsgesteuert.

## Grenzen

Die Browseroberfläche ist kein Berechtigungsdienst. Die Hauptlisten werden nicht anhand von `active` oder `sichtbarkeit` autorisiert. Geschützte Formulare und Daten müssen n8n/Form.io serverseitig prüfen. Die Unterseiten verwenden eigene fachliche Regeln, beispielsweise `inaktiv` bei Trainingsgruppen und Ferien/Stornos im Kalender.