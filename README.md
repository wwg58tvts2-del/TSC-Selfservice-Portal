# Serviceportal

Statisches Webportal für Mitglieder des Tanzsportclub Dortmund. Es zeigt Form.io-Formulare, Online-Services und Downloads; Konfiguration, Mitgliedsstatus und Fachprozesse werden über n8n bereitgestellt. Kalender und Trainingsplan sind eigene Seiten im selben Verzeichnis.

## Struktur

`public/` ist das Document Root des Webservers und enthält alles, was der Browser laedt (`index.html`, `kalender.html`, `trainingsplan.html`, `css/`, `js/`, `img/`, `vendor/`, `config.json`). `config/` enthaelt die Apache-Serverkonfiguration (`selfservices-httpd.conf`) und wird nicht ausgeliefert. Alles ausserhalb von `public/` ist ueber den Webserver nicht erreichbar (`Require all denied`).

## Start

`public/config.json` enthält die URL für die Portal-Konfiguration. Aktuell verweist sie auf `/webhook/config/selfservice`. Das Portal benötigt einen HTTPS-Webserver, Zugriff auf die konfigurierten n8n-Endpunkte und die unter `public/vendor/` mitgelieferten Bibliotheken (Petite Vue, Bootstrap, Bootstrap Icons, FullCalendar, Form.io; siehe `public/vendor/VERSIONS.txt`). Ein Paketmanager oder Build-Schritt ist im Repository nicht eingerichtet.

Die API-Aufrufe senden Cookies mit `credentials: "include"` und verwenden `cache: "no-store"`. Reverse Proxy und n8n müssen zum jeweiligen Endpunkt passen. Die lokale `config.json` ist nur der Einstiegspunkt; die eigentliche Portal-Konfiguration kommt vom Backend.

## Bereiche

- **Formulare:** `forms.baseUrl` plus `forms.items[].id` bestimmen die Form.io-URL.
- **Online-Services:** Links aus `onlineServices.items`.
- **Downloads:** Dateien aus `downloads.items`.
- **Suche:** Kopfzeilensuche über Titel, Beschreibung und Suchbegriffe dieser drei Kategorien.
- **Mitgliederlogin:** konfigurierbarer Statusgruppen-/Kennungs- und Einmalpasswort-Ablauf.
- **Trainingskalender:** `kalender.html`, gespeiste über `calendarUrl`.
- **Trainingsplan:** `trainingsplan.html`, ebenfalls gespeist über `calendarUrl`, mit Text-, Tag- und Trainerfilter.

`active` und `sichtbarkeit` werden bei den Hauptlisten nicht als Berechtigungsprüfung verwendet. Die Anzeige ist keine Autorisierung: n8n und Form.io müssen geschützte Daten und Requests serverseitig absichern.

## Dateien

Alle Pfade sind relativ zu `public/`.

| Pfad | Verantwortung |
| --- | --- |
| `index.html` | Hauptportal, Loginansicht, Suchfeld und Kategorien |
| `config.json` | URL zur Laufzeitkonfiguration |
| `js/main.js` | Petite-Vue-Mount und globale Schnittstellen für Form.io |
| `js/state.js` | State, Login, Suche, Navigation, Formularabläufe |
| `js/api.js` | HTTP-Aufrufe und Response-Logging |
| `js/formio.js` | Erzeugen und Zerstören von Form.io-Instanzen |
| `js/navigation.js` | `?form=` und Browser-History |
| `js/kalender.js` | Kalenderseite und FullCalendar-Integration |
| `js/trainingsplan.js` | Trainingsgruppen und Filter |
| `css/main.css` | Importiert die aufgeteilten Stylesheets |
| `vendor/` | Lokal eingebundene Bibliotheken (siehe `vendor/VERSIONS.txt`) |
| `.github/workflows/deploy-prod.yml` | Manueller Produktions-Webhook |
| `config/selfservices-httpd.conf` | Apache-Vhost-Konfiguration (ausserhalb von `public/`) |

## Anmeldung und Formulare

`memberStatusUrl` liefert den angemeldeten Datensatz. `memberLogin.steps.chooseStatus.statusGroups` definiert Statusgruppen und Kennungsfelder; `requestOtp` und `authenticate` enthalten jeweils Webhook-URL und Methode. Die Kennung kann im Browser lokal gespeichert werden; das Einmalpasswort wird nicht dort abgelegt. Formulare werden getrennt vom Login über Form.io geladen.

Formularrequests verwenden `{ request: { data } }`. Eine gültige Antwort enthält ein boolesches `erfolgreich`; erfolgreiche Antworten können eine Base64-Datei enthalten. Formular- und Logoutmeldungen stammen vom Server. Weitere Ablaufdetails stehen im [Wiki: Anmeldung und Formulare](wiki/login-und-formulare.md).

## Produktion

Der Workflow `deploy-prod.yml` kann in GitHub Actions manuell von `main` gestartet werden. Er verlangt die Secrets `PROD_WEBHOOK_URL` und `PROD_WEBHOOK_SECRET`, signiert einen HTTPS-Request an den festgelegten Produktionspfad und erwartet `Deployment triggered`. Das bestätigt nur die Annahme des Auftrags, nicht den erfolgreichen Abschluss des serverseitigen `git pull`.

Die technische Übersicht, Konfigurationsreferenz und Betriebsnotizen beginnen im [Wiki](wiki/README.md). Hinweise für Codeänderungen stehen in [agent.md](agent.md).