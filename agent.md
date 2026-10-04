# Agent Guide: Serviceportal

## Projektgrenzenﬁ

Das Serviceportal ist eine Vue-3-/Vite-SPA mit Pinia und Vue Router. n8n und Form.io sind externe Laufzeitdienste; dieses Repository enthält weder deren Workflows noch die produktive Portal-Konfiguration. `public/config.json` enthält nur den Konfigurationsendpunkt.

Abhängigkeiten sind in `package.json` und `package-lock.json` fixiert. `npm ci` installiert sie, `npm run dev` startet Vite und `npm run build` erzeugt `dist/`. Drittanbieter-Bibliotheken bleiben lokal unter `public/vendor/` gepinnt. Änderungen an Laufzeitverhalten gegen die Codebasis prüfen; echte n8n-/Form.io-Aufrufe nicht als lokal getestet ausgeben.

## Zuständigkeiten

- `index.html`: einziger Vite-Einstieg; Routen verwenden Hash-History.
- `src/App.vue`: Router-Shell und Portalinitialisierung.
- `src/PortalPage.vue`: Hauptauswahl, OTP-Mitgliederlogin, Form.io-Ansicht und Footer.
- `src/CalendarPage.vue`, `src/TrainingPlanPage.vue`: eigenständige Vue-Unterseiten.
- `js/state.js`, `js/kalender.js`, `js/trainingsplan.js`: Pinia-Stores und Benutzerabläufe.
- `js/api.js`: Fetch-Aufrufe; kein Zugriff auf den State.
- `js/formio.js`: Erstellen und Zerstören von Form.io-Instanzen.
- `js/navigation.js`: Formular-ID im `?form=`-Parameter und History.
- `js/main.js`: Vue-Mount und globale Funktionen für Form.io-Custom-JavaScript.
- `js/kalender.js`, `js/trainingsplan.js`: State/Normalisierung der eigenständigen Unterseiten.
- `vite.config.js`: Vue-SFC-Plugin und Build nach `dist/`.

Vorhandene Modulgrenzen beibehalten. Portalbereiche und Unterseiten nicht unnötig zusammenführen.

## Verträge und Invarianten

- Die Hauptkonfiguration wird über die URL in `config.json` geladen; `memberStatusUrl`, `memberLogin`, `memberLogout`, `calendarUrl` und Bereichslisten kommen aus dieser Konfiguration.
- Die Hauptauswahl zeigt `forms.items`, `onlineServices.items`, `downloads.items` und `footer`.
- Die Kopfzeilensuche filtert nur Formulare, Online-Services und Downloads. Sie durchsucht Titel, Beschreibung und die unterstützten Suchbegriffs-Felder; Footer und Login bleiben unberührt.
- `active` und `sichtbarkeit` sind keine Frontend-Berechtigungsprüfung. Autorisierung geschützter Daten und Requests gehört ins Backend/Form.io.
- Mitgliederlogin: Statusgruppen und Kennungsfelder stammen aus `memberLogin.steps.chooseStatus.statusGroups`; OTP-Anforderung und Authentifizierung verwenden die konfigurierten Webhooks. Keine Login-URL oder Kennungsfelder fest codieren.
- Form.io-Requests laufen über `window.sendeFormular(instance, config)`. Payload, `erfolgreich`, optionale Datei und Callback-Reihenfolge erhalten.
- Servermeldungen bei Formularversand und Logout nicht durch lokale Ersatztexte ersetzen. HTTP-Fehler dürfen keinen Erfolgsweg auslösen.
- `calendarUrl` versorgt Kalender und Trainingsplan; diese Seiten haben eigene Normalisierung und Filter.

## Vorgehen und Prüfung

1. Änderungen eng auf die zuständige Vue-Komponente oder das zuständige State-/API-Modul begrenzen.
2. `npm run build` prüft SFCs, Imports und alle drei HTML-Einstiege; gebündelte Assets erhalten Inhalts-Hashes.
3. JSON mit `python3 -m json.tool <datei>` validieren.
4. Für Portalansichten das vorgesehene Testsystem verwenden. Keine lokale Portalwebsite im integrierten Browser öffnen.
5. Bei Änderungen an Requests zusätzlich Erfolg, fachlichen Fehler, HTTP-Fehler und Cleanup prüfen. Keine Live-Webhook-Aufrufe ohne ausdrückliche Freigabe.

Es gibt keinen Unit-Test-Runner. Simulierte Prüfungen klar von Live-Tests unterscheiden.