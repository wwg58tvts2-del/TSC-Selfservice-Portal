# Serviceportal – Codepflege

Stand: 20.09.2026, Version `20260920-storno-3`. Die vollständige Funktionsbeschreibung und JSON-Beispiele stehen in [README.md](README.md).

## Architektur und Stil

`main.js` veröffentlicht globale Funktionen und startet Petite Vue. `state.js` steuert Zustand und Oberfläche; `api.js` enthält Netzwerkaufrufe und Logging ohne Zugriff auf den State. `formio.js` erstellt und zerstört Formularinstanzen. `navigation.js` steuert URL und History. Die Konfiguration wird über `/webhook/portal-config` geladen; CSS wird über `css/main.css` eingebunden, `responsive.css` zuletzt.

Deutsche Namen und Modulgrenzen erhalten. Neue Aufrufe kompakt schreiben, keine unnötigen Zeilenumbrüche oder beiläufigen Umformatierungen. Formularspezifische Resets bleiben im Form.io-Button.

## JSON und Meldungen

n8n soll JSON-Objekte liefern: boolesches `erfolgreich`, optionaler `status`, Strings `titel` und `nachricht`, optional `datei`. Bei Datei: reines Base64, Dateiname und MIME-Type. Keine HTML-Entities oder Markdown-Escapes im JSON. Mehrere Dateien pro Antwort sind nicht implementiert.

Für Formularversand und Logout ausschließlich Servertexte anzeigen. Keine lokalen Erfolg-/Fehler-Ersatztexte in diese Abläufe einführen. `zeigeServerMeldung()` zeigt vorhandene String-Felder an; ohne verwendbare Texte protokolliert es die Antwort und öffnet keine Meldung. Ohne Meldung findet keine Rücknavigation durch deren Schließen statt.

HTTP-Fehler behalten das JSON als `error.result`. Dadurch werden Servertexte auch bei 4xx/5xx angezeigt. Netzwerkfehler, ungültiges JSON und Callback-/Download-Ausnahmen ohne Serverantwort werden nur protokolliert. HTTP-Fehler lösen nie den Erfolgsweg aus. Ein ungültiges `erfolgreich` wird bei HTTP-Erfolg als Schemafehler behandelt und kann trotzdem mitgelieferte Servertexte anzeigen.

Die Member-Prüfung und sonstigen lokalen UI-Meldungen sind separate Abläufe und wurden nicht auf diese Regel umgestellt. `/webhook/me` erwartet `person` und `gefunden: true` oder `erfolgreich: true`; Arrays werden weiterhin akzeptiert. Eine spätere fehlgeschlagene Prüfung löscht eine vorhandene Person nicht automatisch.

## Formulare

`window.sendeFormular(instance, config)` reicht beide Argumente unverändert weiter. Optionen: `webhookUrl`, `method` (Standard POST), `ladeText`, `zurueckNachErfolg` (Standard true), `onSuccess`. `fehlerTitel` und `fehlerNachricht` werden nicht mehr verwendet.

Request: `{ request: { data: instance.root.data } }`, JSON-Header, Cookies einschließen, `cache: "no-store"`. Keine zusätzliche Form.io-Validierung. Bei Erfolg: Download → `await config.onSuccess(result)` → Servermeldung. `finally` schließt den Loader und entsperrt den Button. Bei Fehlern kein Download oder Callback. Ein Callback-Fehler kann nach erfolgreicher Backend-Verarbeitung auftreten und wird protokolliert.

Das Reservierungs-Panel wird über `panel.resetValue()` zurückgesetzt, danach `bis._von` mit `von.dataValue` synchronisiert und nur das Panel neu gezeichnet. Kein globaler Formularreset.

## Logout

`memberLogout` enthält nur `webhookUrl`, `method` und `ladeText`. Defaults für Pfad und Methode bleiben `/webhook/logout` und GET. Kein Request-Body. Bei HTTP-Erfolg und `erfolgreich: true` lokale Person entfernen; ebenso bei `erfolgreich: false` und `status: "nicht_angemeldet"`, auch im HTTP-Fehlerfall. Andere Fehler behalten die Person. Keine Dateiverarbeitung oder automatische Rücknavigation. Die Sitzung beendet das Backend.
`memberLogout` enthält nur `webhookUrl`, `method` und `ladeText`. Defaults für Pfad und Methode bleiben `/webhook/logout` und GET. Kein Request-Body. Bei HTTP-Erfolg und `erfolgreich: true` lokale Person entfernen; ebenso bei `erfolgreich: false` und `status: "nicht_angemeldet"`, auch im HTTP-Fehlerfall. In beiden Fällen Form.io-Instanz zerstören und zur Auswahl zurückkehren; `sichtbareFormulare` berechnet die für den Gaststatus passenden Einträge reaktiv neu. Andere Fehler behalten Person und Ansicht. Keine Dateiverarbeitung. Die Sitzung beendet das Backend.

## Bestehende Grenzen und Prüfung

Sichtbarkeit ersetzt keine Backend-Berechtigung. `active` filtert die Auswahl, nicht alle direkten Öffnungswege. Der `popstate`-Handler prüft Sichtbarkeit nicht erneut. Die Start-URL sucht nur in `forms.items`. Logout schließt das aktuelle Formular nicht automatisch.
Sichtbarkeit ersetzt keine Backend-Berechtigung. `active` filtert die Auswahl, nicht alle direkten Öffnungswege. Der `popstate`-Handler prüft Sichtbarkeit nicht erneut. Die Start-URL sucht nur in `forms.items`.

Die Versionskennung in HTML, lokalen Modulimporten und Konfigurationsabruf konsistent halten. Syntax, JSON, Erfolgs-/Fehlerfälle, Callback-Reihenfolge, Zustand und Cleanup prüfen. Simulierte Tests nicht als Live-Tests ausgeben. Response-Logging kann personenbezogene Inhalte enthalten.

## Stornierung einzelner Reservierungen

`config.data` ist optional. Ist es nicht `undefined`, sendet die zentrale Funktion diesen Wert unter `request.data`; andernfalls weiterhin `instance.root.data`. Der Stornobutton verwendet `data: row` und `method: 'DELETE'`. Damit wird ausschließlich die angeklickte Data-Grid-Zeile gesendet.

Der fertige Custom-JavaScript-Code liegt in `formio/Stornobutton.js` und wird in den Form.io-Stornobutton eingefügt. Vor dem Request werden Reservierungs-ID und Data Grid geprüft. Erst bei erfolgreicher Antwort entfernt `onSuccess` den Eintrag anhand der zuvor gemerkten ID aus den aktuellen Grid-Daten. Bei Fehlern bleibt die Liste erhalten. Das Formular bleibt geöffnet. Servertexte, optionale Downloads und technische Fehler laufen über die zentrale Verarbeitung. Der optionale Download erfolgt dabei vor dem Callback.

Die neue `state.js` muss vor Verwendung dieses Buttons auf dem Server liegen; ältere Versionen ignorieren `config.data` und würden das gesamte Formular senden. Andere Buttons ohne `data` behalten ihr bisheriges Verhalten.

## Trainingsgruppen-Darstellung

`formio/Trainingsgruppen.json` enthält das Austausch-Data-Grid. Die Klasse `gruppen-tabelle-kompakt` trennt die Darstellung von älteren Tabellenregeln. `css/trainingsgruppen.css` wird in `index.html` nach `main.css` eingebunden. Drei sichtbare Spalten: Gruppe/Trainingszeiten, gesperrte Status-Checkbox und Änderung. Bei schmalen Displays ist die Tabelle horizontal scrollbar. Gruppenabgleich und Aktionwerte bleiben unverändert.
