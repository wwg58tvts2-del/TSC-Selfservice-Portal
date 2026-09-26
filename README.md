# Serviceportal

Stand: 20.09.2026, Version `20260920-storno-3`.

Das Portal zeigt Form.io-Formulare, Online-Services und Downloads. Petite Vue steuert die Oberfläche; n8n verarbeitet die Webhooks. Diese Dokumentation beschreibt die mitgelieferten Portaldateien. Externe Form.io-Formulare und n8n-Workflows gehören nicht zum Upload-Paket.

## Dateien und Bereitstellung

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Oberfläche, externe Bibliotheken und Einstieg in JavaScript |
| `/webhook/portal-config` | Liefert Texte, Formularliste, Links, Sichtbarkeit und Logout-Konfiguration als JSON |
| `js/main.js` | Globale Funktionen für Form.io und Start des Portals |
| `js/state.js` | Zustand, Loginstatus, Navigation, Meldungen und Formularverarbeitung |
| `js/api.js` | Netzwerkaufrufe und Response-Logging |
| `js/formio.js` | Form.io-Instanzen erstellen und zerstören |
| `js/navigation.js` | Formularparameter und Browser-History |
| `css/main.css` | Einbindung der aufgeteilten Stylesheets |
| `img/` | Bilder und Logos |
| `agent.md` | Hinweise zur Codepflege |

Den Inhalt des Ordners `5_Serviceportal` in den bestehenden Portal-Webordner kopieren, gleichnamige Dateien ersetzen und die Seite neu laden. Vorher die bisherigen Serverdateien sichern. Kein zusätzlicher Unterordner innerhalb des bisherigen Webordners ist erforderlich.

Das Portal benötigt einen Webserver und Zugriff auf die eingebundenen Bibliotheken von unpkg, jsDelivr und Form.io. Relative Webhook-Pfade wie `/webhook/logout` beziehen sich auf den Ursprung der Portalseite. Der Server muss sie passend weiterleiten. Ein lokaler Build-Schritt ist nicht vorgesehen.

Die Einstiegsskripte, lokalen Modulimporte und der Konfigurationsabruf tragen eine Versionskennung. Fetch-Aufrufe verwenden `cache: "no-store"`. Server-Caching ist zusätzlich auf dem Webserver zu konfigurieren.

## Konfiguration

`page`, `header` und `body` enthalten Seitentexte und Logos. Die Config kann als einzelnes JSON-Objekt oder als Array mit dem Config-Objekt geliefert werden. `forms.baseUrl` ist die Form.io-Basisadresse; `forms.items`, `onlineServices.items`, `downloads.items` und `footer` werden vollständig angezeigt. Abschnittstexte stehen jeweils unter `section`.

```json
{
  "id": "FORMULAR-ID",
  "titel": "Mein Formular",
  "beschreibung": "Beschreibung des Formulars.",
  "active": true,
  "sichtbarkeit": ["mitglied"]
}
```

Das Frontend filtert diese Listen nicht nach `active` oder `sichtbarkeit`; es zeigt alle gelieferten Einträge und lässt die Formularauswahl zu. `active` und `sichtbarkeit` können weiterhin als Metadaten in der Config stehen, sind aber keine Zugriffsprüfung. n8n/Form.io muss Berechtigungen serverseitig beim Laden und Absenden jedes geschützten Formulars prüfen. Die UI ersetzt diese Autorisierung ausdrücklich nicht.

## Start, Login und Navigation

`main.js` veröffentlicht die globalen Funktionen, mountet Petite Vue und ruft `state.init()` auf. Nach dem Laden der Konfiguration wartet das Portal auf die stille Prüfung von `/webhook/me` und wertet anschließend `?form=...` aus.

Auf der Auswahlseite erscheint für abgemeldete Personen ein nativer Mitglieder-Login-Hinweis mit dem Ablauf der Einmalpasswort-Anmeldung. Der Button öffnet das bestehende Form.io-Login über `memberLogin.id`. Nach `submitDone` prüft das Portal `/webhook/me`; bei bestätigtem Login wird die Form.io-Ansicht geschlossen und die Auswahl mit dem angemeldeten Status angezeigt. `/webhook/me` erwartet eine Person und `gefunden: true` oder `erfolgreich: true`:

```json
{
  "erfolgreich": true,
  "person": {
    "vorname": "Max",
    "nachname": "Muster",
    "statusGruppe": "mitglied"
  }
}
```

Dieser Endpunkt akzeptiert aus Kompatibilitätsgründen auch Arrays und verwendet dann das erste Element. Er besitzt weiterhin eine eigene lokale Begrüßung und Fehlerbehandlung; die neue Regel für Servermeldungen betrifft Formularversand und Logout. Eine fehlgeschlagene spätere Member-Prüfung entfernt eine bereits gespeicherte Person nicht automatisch.

`oeffneFormular()` setzt Auswahl und URL; der Form.io-Effekt lädt das Formular. `zurueck()` zerstört die Instanz und entfernt den Formularparameter. Die Start-URL sucht nur in `forms.items`, nicht separat in `memberLogin`.

## Allgemeiner JSON-Vertrag

n8n soll für diese Webhook-Aufrufe immer ein JSON-Objekt mit `Content-Type: application/json` liefern, auch bei Fehlern und Dateirückgaben. Keine HTML-Seite, Markdown-Codeblöcke oder rohe PDF-Datei als Antwort auf den Formularrequest senden. Direkte Links im Downloadbereich sind ein separater Ablauf.

| Feld | Bedeutung |
| --- | --- |
| `erfolgreich` | Boolean `true` oder `false`, kein String |
| `status` | Optionale maschinenlesbare Kennung |
| `titel` | Meldungsüberschrift als String |
| `nachricht` | Meldungstext als String; Zeilenumbrüche als `\n` |
| `datei` | Optionale Datei bei Formularerfolg; sonst weglassen oder `false` |

### Erfolg ohne Datei

```json
{
  "erfolgreich": true,
  "status": "gespeichert",
  "titel": "Erfolgreich gespeichert",
  "nachricht": "Deine Angaben wurden gespeichert.",
  "datei": false
}
```

### Fachlicher Fehler

```json
{
  "erfolgreich": false,
  "status": "nicht_angemeldet",
  "titel": "Anmeldung erforderlich",
  "nachricht": "Du bist derzeit nicht angemeldet. Bitte melde Dich an, um fortzufahren.",
  "datei": false
}
```

### Erfolg mit Datei

```json
{
  "erfolgreich": true,
  "status": "dokument_erstellt",
  "titel": "Dokument erstellt",
  "nachricht": "Dein Dokument steht zum Download bereit.",
  "datei": {
    "base64": "SGFsbG8hCg==",
    "dateiname": "Bestaetigung.txt",
    "mimeType": "text/plain"
  }
}
```

Dieses Beispiel enthält eine Textdatei mit „Hallo!“ und Zeilenumbruch. Für PDF den tatsächlichen PDF-Inhalt als Base64 übertragen und einen passenden Dateinamen sowie `application/pdf` verwenden. Kein Data-URL-Präfix vor `base64` setzen.

Eine Datei pro Antwort wird unterstützt. Ohne Dateiname gilt `Dokument.pdf`, ohne MIME-Type `application/pdf`. Ein fehlender oder leerer Base64-Wert löst keinen Download aus. Ungültiges Base64 kann eine technische Ausnahme auslösen. Der Browser-Download wird gestartet, sein tatsächlicher Abschluss aber nicht abgewartet.

## Meldungen: ausschließlich Servertexte

Für Formularversand und Logout gibt es keine Ersatztexte mehr in der Button-Konfiguration, der Logout-Konfiguration oder der zentralen Antwortbehandlung.

- Enthält das JSON `titel` und/oder `nachricht` als nicht leeren String, wird genau dieser Text angezeigt. Das jeweils fehlende Feld bleibt leer.
- Das gilt auch bei HTTP-Fehlern mit JSON-Body. `api.js` gibt diesen Body als `error.result` an die Fehlerbehandlung weiter.
- Ohne verwendbare Servertexte wird nur `console.error(...)` aufgerufen; es erscheint keine leere oder erfundene Fehlermeldung.
- Netzwerkfehler, nicht lesbares JSON und Ausnahmen beim Download oder Callback werden protokolliert. Ohne angehängte Serverantwort erscheint keine Meldung.
- Ohne Meldung gibt es auch keine Rücknavigation über deren Schließen. Ein erfolgreicher Download oder Callback wird trotzdem ausgeführt, wenn die Antwort fachlich gültig ist.

HTTP-Status und `erfolgreich` sind getrennte Prüfungen. HTTP-Fehler führen niemals zu Download oder Erfolgs-Callback, auch wenn ihr Body `erfolgreich: true` enthält. Ein fehlendes oder nicht boolesches `erfolgreich` wird bei HTTP-Erfolg als ungültige Antwort protokolliert; vorhandene Servertexte können dabei angezeigt werden.

Die Meldungen werden als Text ausgegeben, nicht als HTML. Keine HTML-Entities wie `&#x20;` oder Markdown-Escapes in JSON einfügen.

## Formularversand und onSuccess

```javascript
const CONFIG = {
  webhookUrl: '/webhook/reservierungsanfrage',
  method: 'POST',
  ladeText: 'Deine Reservierungsanfrage wird übermittelt …',
  zurueckNachErfolg: false,
  onSuccess: () => resetReservierungsanfrage()
};

window.sendeFormular(instance, CONFIG);
```

`instance` stammt aus Form.io; eine verwendete Reset-Funktion muss im Button definiert sein. `method` ist standardmäßig `POST`. `zurueckNachErfolg` ist standardmäßig `true` und wirkt erst beim Schließen der Erfolgsmeldung. `ladeText` bleibt ein lokaler Text für die laufende Anfrage, kein Antwort-Ersatztext. Alte Optionen `fehlerTitel` und `fehlerNachricht` werden nicht mehr ausgewertet und können entfernt werden.

Der Request sendet Cookies, JSON-Header und `{ "request": { "data": ... } }`, wobei `data` aus `instance.root.data` kommt. Es wird keine zusätzliche Formularvalidierung durch diese zentrale Funktion ausgelöst.

Reihenfolge: Button sperren → Loader öffnen → Request senden → HTTP und JSON prüfen → bei Erfolg optionale Datei herunterladen → `onSuccess(result)` abwarten → Servermeldung anzeigen → Loader schließen und Button freigeben.

Bei fachlichen oder technischen Fehlern laufen Download und Callback nicht. Wirft der Callback selbst einen Fehler, wird dieser protokolliert; die Backend-Verarbeitung kann trotzdem bereits erfolgreich sein. `finally` schließt den Loader und gibt den Button frei. Die Funktion liefert kein Antwortobjekt zurück; der Callback erhält das vollständige JSON.

### Nur das Reservierungs-Panel zurücksetzen

```javascript
function resetReservierungsanfrage() {
  const panel = instance.root.getComponent('reservierungsanfrage1');
  if (!panel) {
    throw new Error('Panel "reservierungsanfrage1" wurde nicht gefunden.');
  }

  panel.resetValue();

  const von = panel.getComponent('von');
  const bis = panel.getComponent('bis');
  if (von && bis) {
    bis._von = von.dataValue;
  }

  return panel.redraw();
}
```

Der Reset betrifft dieses Panel einschließlich seiner untergeordneten Komponenten. Form.io stellt Vorgabewerte wieder her beziehungsweise leert Felder ohne Vorgabewert. `_von` gehört zur eigenen Bis-Uhrzeit-Logik. Andere Panels werden nicht direkt zurückgesetzt. Der vollständige bereinigte Button-Code liegt unter `formio/Reservierungsbutton.js` und in Form.io eingefügt, nicht als zusätzliches Portalskript eingebunden.

## Logout

```json
{
  "memberLogout": {
    "webhookUrl": "/webhook/logout",
    "method": "GET",
    "ladeText": "Du wirst abgemeldet ..."
  }
}
```

Dieser Abschnitt wird über `/webhook/portal-config` geliefert. Pfad und Methode haben weiterhin die bisherigen Rückfallwerte. Der Request sendet Cookies, aber keinen Body. Backend und HTTP-Methode müssen zueinander passen.

```json
{
  "erfolgreich": true,
  "status": "abgemeldet",
  "titel": "Erfolgreich abgemeldet",
  "nachricht": "Du wurdest erfolgreich abgemeldet."
}
```

Bei HTTP-Erfolg und `erfolgreich: true` wird die lokale Person entfernt. Auch `erfolgreich: false` mit `status: "nicht_angemeldet"` entfernt sie, einschließlich entsprechender HTTP-Fehlerantworten. Andere Fehler behalten die Person bei. Die oben dokumentierte JSON-Antwort „Anmeldung erforderlich“ ist dafür geeignet.

Der Logout verarbeitet keine Datei. Bei bestätigter Abmeldung oder `status: "nicht_angemeldet"` wird die Form.io-Instanz geschlossen und zur Formularauswahl zurückgekehrt. Die Formularliste wird anhand des nun abgemeldeten Status neu berechnet. Bei anderen Fehlern bleiben Person und aktuelle Ansicht erhalten. Das Backend muss die Sitzung beziehungsweise den Cookie beenden; das Entfernen der lokalen Person allein tut dies nicht.

## Globale Funktionen und Fehlersuche

`window.sendeFormular`, `showMsgBox`, `closeMsgBox`, `zeigeLaden`, `versteckeLaden`, `ladeMemberDaten` und `logoutMember` bleiben verfügbar. `showLoading`, `hideLoading` und `pruefeMeWebhook` sind Aliase. `showMsgBox(titel, inhalt, zurueckNachSchliessen, options)` unterstützt `buttonText` und `onClose`; der Schließen-Callback wird nicht abgewartet. Escape und Hintergrundklick schließen die Infobox ebenfalls.

`loggeResponse` ist ein Modulexport, keine globale Funktion. Die Browserkonsole enthält API-Status, URL, lesbare Header und Body; Antwortdaten können personenbezogen sein. HttpOnly-Cookies und `Set-Cookie` sind darüber nicht auslesbar.

Bei fehlendem Reset die tatsächlich geladene `state.js` auf den `onSuccess`-Aufruf und den Button auf den korrekten Panel-Schlüssel prüfen. Bei fehlenden Meldungen JSON-Texte und Browserkonsole prüfen. Bei Loginproblemen Login-ID, `submitDone` und `/webhook/me` prüfen.

Syntax, JSON und simulierte Abläufe wurden geprüft. Ein Live-Test gegen n8n mit echter Reservierung oder Abmeldung wurde nicht durchgeführt.

## Stornierung einzelner Reservierungen

`config.data` ist optional. Ist es nicht `undefined`, sendet die zentrale Funktion diesen Wert unter `request.data`; andernfalls weiterhin `instance.root.data`. Der Stornobutton verwendet `data: row` und `method: 'DELETE'`. Damit wird ausschließlich die angeklickte Data-Grid-Zeile gesendet.

Der fertige Custom-JavaScript-Code liegt in `formio/Stornobutton.js` und wird in den Form.io-Stornobutton eingefügt. Vor dem Request werden Reservierungs-ID und Data Grid geprüft. Erst bei erfolgreicher Antwort entfernt `onSuccess` den Eintrag anhand der zuvor gemerkten ID aus den aktuellen Grid-Daten. Bei Fehlern bleibt die Liste erhalten. Das Formular bleibt geöffnet. Servertexte, optionale Downloads und technische Fehler laufen über die zentrale Verarbeitung. Der optionale Download erfolgt dabei vor dem Callback.

Die neue `state.js` muss vor Verwendung dieses Buttons auf dem Server liegen; ältere Versionen ignorieren `config.data` und würden das gesamte Formular senden. Andere Buttons ohne `data` behalten ihr bisheriges Verhalten.

## Trainingsgruppen-Darstellung

`formio/Trainingsgruppen.json` enthält das Austausch-Data-Grid. Die Klasse `gruppen-tabelle-kompakt` trennt die Darstellung von älteren Tabellenregeln. `css/trainingsgruppen.css` wird in `index.html` nach `main.css` eingebunden. Drei sichtbare Spalten: Gruppe/Trainingszeiten, gesperrte Status-Checkbox und Änderung. Bei schmalen Displays ist die Tabelle horizontal scrollbar. Gruppenabgleich und Aktionwerte bleiben unverändert.
