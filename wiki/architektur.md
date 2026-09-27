# Architektur

## Laufzeit

Das Portal besteht aus statischen HTML-, CSS- und ES-Moduldateien. Petite Vue mountet den reaktiven State direkt im Browser. Bootstrap, Bootstrap Icons, Form.io und FullCalendar werden über CDN-URLs eingebunden; es gibt keinen Build-Schritt in diesem Repository.

`index.html` ist die Hauptauswahl mit Mitgliederlogin, Formularen, Online-Services und Downloads. `kalender.html` und `trainingsplan.html` sind eigenständige Seiten und erzeugen jeweils einen eigenen Petite-Vue-State.

## Hauptmodule

| Modul | Verantwortung |
| --- | --- |
| `js/main.js` | Mount von Petite Vue und globale Form.io-Schnittstellen |
| `js/state.js` | Konfiguration, Mitgliedsstatus, Login, Auswahl, Meldungen und Versand |
| `js/api.js` | Fetch, Cookies, JSON-Verarbeitung und Response-Logging |
| `js/formio.js` | Erzeugen und Zerstören der Form.io-Instanz |
| `js/navigation.js` | `?form=` und Browser-History |
| `js/kalender.js` | Trainings-/Reservierungsevents und FullCalendar |
| `js/trainingsplan.js` | Gruppen-Normalisierung und Such-/Tag-/Trainerfilter |

`css/main.css` importiert die Stylesheets. `responsive.css` kommt zuletzt, um die mobilen Regeln durchzusetzen. Die Trainingsgruppen-Seite ergänzt `css/trainingsgruppen.css` separat.

## Datenfluss

1. `config.json` liefert die URL der Laufzeitkonfiguration.
2. `state.js` lädt die Konfiguration ohne Cache und fragt anschließend `memberStatusUrl` ab.
3. Die Hauptauswahl rendert die drei Listen aus `forms.items`, `onlineServices.items` und `downloads.items`.
4. Formularauswahl setzt `?form=<id>`; Form.io lädt `forms.baseUrl/<id>`.
5. Formularversand und Logout laufen über `api.js`; der State steuert Loader, Meldungen und Cleanup.

Kalender und Trainingsplan laden `config.json` und anschließend separat `calendarUrl`. Sie teilen sich die Endpunktadresse, nicht den UI-State oder die Normalisierung.

## Grenzen

Die Browseroberfläche ist kein Berechtigungsdienst. Die Hauptlisten werden nicht anhand von `active` oder `sichtbarkeit` autorisiert. Geschützte Formulare und Daten müssen n8n/Form.io serverseitig prüfen. Die Unterseiten verwenden eigene fachliche Regeln, beispielsweise `inaktiv` bei Trainingsgruppen und Ferien/Stornos im Kalender.