# Serviceportal

Vue-3-SPA für Mitglieder des Tanzsportclub Dortmund. Sie zeigt Form.io-Formulare, Online-Services und Downloads; Konfiguration, Mitgliedsstatus und Fachprozesse werden über n8n bereitgestellt. Portal, Kalender und Trainingsplan laufen als Vue-Routen unter einer `index.html`.

## Start

`public/config.json` enthält die URL für die Portal-Konfiguration. Aktuell verweist sie auf `/webhook/config/selfservice`. Das Portal benötigt Node.js 20.19 oder neuer.

```sh
npm ci
npm run dev
npm run build
```

Vite baut eine `index.html` nach `dist/`. Portal und Login liegen unter `/` und `/login`; Formulare öffnen direkt unter `/<form-id>`. Kalender und Trainingsplan bleiben unter `/kalender` und `/trainingsplan`. Nginx führt unbekannte Pfade auf die SPA zurück. Vue wird gebündelt; Bootstrap, Bootstrap Icons, Form.io und FullCalendar bleiben lokal gepinnt unter `public/vendor/`.

Die API-Aufrufe senden Cookies mit `credentials: "include"` und verwenden `cache: "no-store"`. Reverse Proxy und n8n müssen zum jeweiligen Endpunkt passen. Die lokale `config.json` ist nur der Einstiegspunkt; die eigentliche Portal-Konfiguration kommt vom Backend.

## Bereiche

- **Formulare:** `forms.items[].id` öffnet `/<form-id>`; `forms.baseUrl` plus ID bestimmen die Form.io-Request-URL.
- **Online-Services:** Links aus `onlineServices.items`.
- **Downloads:** Dateien aus `downloads.items`.
- **Suche:** Kopfzeilensuche über Titel, Beschreibung und Suchbegriffe dieser drei Kategorien.
- **Mitgliederlogin:** konfigurierbarer Statusgruppen-/Kennungs- und Einmalpasswort-Ablauf.
- **Trainingskalender:** Route `/kalender`, gespeist über `calendarUrl`.
- **Trainingsplan:** Route `/trainingsplan`, ebenfalls gespeist über `calendarUrl`, mit Text-, Tag- und Trainerfilter.

`active` und `sichtbarkeit` werden bei den Hauptlisten nicht als Berechtigungsprüfung verwendet. Die Anzeige ist keine Autorisierung: n8n und Form.io müssen geschützte Daten und Requests serverseitig absichern.

## Dateien

| Pfad | Verantwortung |
| --- | --- |
| `index.html` | Hauptportal, Loginansicht, Suchfeld und Kategorien |
| `public/config.json` | URL zur Laufzeitkonfiguration |
| `src/App.vue` | Hauptportal und Mitgliederlogin |
| `src/router.js` | Pfadrouten für Portal, Formulare, Kalender und Trainingsplan |
| `src/CalendarPage.vue` | Trainingskalender |
| `src/TrainingPlanPage.vue` | Trainingsplan |
| `src/stores/exposeReactiveState.js` | Pinia-Bindings für reaktive State-Module |
| `js/main.js` | Vue-Mount und globale Schnittstellen für Form.io |
| `js/state.js` | State, Login, Suche, Navigation, Formularabläufe |
| `js/api.js` | HTTP-Aufrufe und Response-Logging |
| `js/formio.js` | Erzeugen und Zerstören von Form.io-Instanzen |
| `js/navigation.js` | Lesen alter `?form=`-Direktlinks |
| `js/kalender.js` | Kalender-Pinia-Store und FullCalendar-Integration |
| `js/trainingsplan.js` | Trainingsplan-Pinia-Store und Filter |
| `css/main.css` | Importiert die aufgeteilten Stylesheets |
| `.github/workflows/docker-image.yml` | Baut und veröffentlicht das Docker-Image |

`public/kalender.html` und `public/trainingsplan.html` leiten ältere Direktlinks auf die entsprechenden SPA-Routen um.

## Anmeldung und Formulare

Das Portal und seine Formularpfade erzwingen keinen Login. Mitglieder können den Login-Button freiwillig verwenden; `memberStatusUrl` prüft die vorhandene Sitzung und steuert die Anzeige des Logout-Buttons. `memberLogin.steps.chooseStatus.statusGroups` definiert Statusgruppen und Kennungsfelder; `requestOtp` und `authenticate` enthalten jeweils Webhook-URL und Methode. Die Kennung kann im Browser lokal gespeichert und beim nächsten Öffnen vorbelegt werden; das Einmalpasswort wird nicht dort abgelegt. Geschützte Formulardaten und Requests müssen n8n/Form.io serverseitig absichern.

Formularrequests verwenden `{ request: { data } }`. Eine gültige Antwort enthält ein boolesches `erfolgreich`; erfolgreiche Antworten können eine Base64-Datei enthalten. Formular- und Logoutmeldungen stammen vom Server. Weitere Ablaufdetails stehen im [Wiki: Anmeldung und Formulare](wiki/login-und-formulare.md).

## Produktion

Der Push auf `main` baut und veröffentlicht das Docker-Image über `.github/workflows/docker-image.yml` und aktualisiert anschließend ausschließlich den Portainer-Test-Stack. Dafür muss `PORTAINER_WEBHOOK_URL` als GitHub-Secret auf den Test-Stack-Webhook zeigen. Details stehen in [DOCKER.md](DOCKER.md).

Der alte serverseitige Git-Push-Webhook liegt außerhalb dieses Repositories und muss separat deaktiviert werden. Die nicht mehr benötigten GitHub-Secrets `PROD_WEBHOOK_URL` und `PROD_WEBHOOK_SECRET` können anschließend in den Repository-Einstellungen entfernt werden.

Die technische Übersicht, Konfigurationsreferenz und Betriebsnotizen beginnen im [Wiki](wiki/README.md). Hinweise für Codeänderungen stehen in [agent.md](agent.md).