# Agent Guide: Serviceportal

## Projektgrenzen

Das Serviceportal ist ein statisches Petite-Vue-Frontend. n8n und Form.io sind externe Laufzeitdienste; dieses Repository enthält weder deren Workflows noch die produktive Portal-Konfiguration. `config.json` enthält nur den Konfigurationsendpunkt.

Keine Abhängigkeiten oder Buildschritte ergänzen, solange die Aufgabe das nicht verlangt. Bibliotheken werden in den HTML-Seiten per CDN geladen. Änderungen an Laufzeitverhalten gegen die Codebasis prüfen; echte n8n-/Form.io-Aufrufe nicht als lokal getestet ausgeben.

## Zuständigkeiten

- `index.html`: Hauptauswahl, OTP-Mitgliederlogin, Form.io-Ansicht und Footer.
- `js/state.js`: reaktiver Zustand und Benutzerabläufe.
- `js/api.js`: Fetch-Aufrufe; kein Zugriff auf den State.
- `js/formio.js`: Erstellen und Zerstören von Form.io-Instanzen.
- `js/navigation.js`: Formular-ID im `?form=`-Parameter und History.
- `js/main.js`: Mount, globale Funktionen für Form.io-Custom-JavaScript.
- `js/kalender.js`, `js/trainingsplan.js`: eigenständige Unterseiten, jeweils mit eigenem Petite-Vue-State.

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

1. Änderungen eng auf das zuständige Modul begrenzen.
2. Bei Änderung eines ES-Moduls dessen Cachekennung in den importierenden HTML-/JS-URLs konsistent aktualisieren.
3. JavaScript mit `node --check <datei>` prüfen; JSON mit `python3 -m json.tool <datei>` validieren.
4. Für Portalansichten das vorgesehene Testsystem verwenden. Keine lokale Portalwebsite im integrierten Browser öffnen.
5. Bei Änderungen an Requests zusätzlich Erfolg, fachlichen Fehler, HTTP-Fehler und Cleanup prüfen. Keine Live-Webhook-Aufrufe ohne ausdrückliche Freigabe.

Es gibt im Repository kein npm-Projekt und keinen automatischen Frontend-Testlauf. Simulierte Prüfungen klar von Live-Tests unterscheiden.