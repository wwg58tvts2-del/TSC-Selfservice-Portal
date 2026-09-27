# Mitgliederlogin und Formulare

## Mitgliederlogin

Der Login ist ein natives HTML-Formular in der Hauptseite; Form.io wird dafür nicht verwendet. Die Zustandsfolge wird durch `memberLogin.steps` konfiguriert:

1. `chooseStatus.statusGroups` zeigt die angebotenen Statusgruppen und bestimmt das Kennungsfeld.
2. `requestOtp` sendet Statusgruppe und Kennung an den konfigurierten Webhook.
3. `authenticate` sendet Statusgruppe, Kennung und eingegebenes Einmalpasswort.

Beide Requests verwenden `{ request: { data } }` und erwarten ein boolesches `erfolgreich`. Die Kennung kann lokal gespeichert und beim nächsten Öffnen vorbelegt werden; Passwort und OTP werden nicht in diesem Speicher abgelegt. Anschließend lädt das Portal die Konfiguration erneut und prüft `memberStatusUrl`. Die Statusantwort wird aus `person` und `gefunden: true` oder `erfolgreich: true` gebildet; 401/403 beziehungsweise explizite Nicht-angemeldet-Status liefern keinen angemeldeten Benutzer.

`person.statusGruppe` bestimmt die lokale Gruppe. Unbekannte Werte fallen auf `gast` zurück. Das ist Anzeige-/Zustandslogik und ersetzt keine Backend-Autorisierung.

## Form.io

Ein Formular wird über `forms.baseUrl` plus URL-kodierte `id` geladen. `formio.js` kapselt `Formio.createForm()` und das Zerstören der Instanz. `navigation.js` speichert die Auswahl als `?form=<id>`; Zurück und Browser-History zerstören beziehungsweise wechseln die Instanz kontrolliert.

Form.io-Custom-JavaScript verwendet `window.sendeFormular(instance, config)`. Unterstützte Optionen sind `webhookUrl`, `method`, `ladeText`, `zurueckNachErfolg`, `onSuccess` und optional `data`. Ohne `data` wird `instance.root.data` gesendet. Der Request-Body lautet:

```json
{"request":{"data":{"...":"..."}}}
```

Die Antwort braucht HTTP-Erfolg und ein boolesches `erfolgreich`. Bei `true` folgen optionaler Base64-Download, `await onSuccess(result)` und anschließend die Servermeldung. Bei `false` gibt es keinen Erfolgs-Callback und keinen Download. HTTP-Fehler bleiben Fehler, auch wenn ihr JSON `erfolgreich: true` enthält. `finally` schließt den Loader und entsperrt die Form.io-Instanz.

## Meldungen und Logout

Für Formularversand und Logout werden nur Serverfelder `titel` und `nachricht` angezeigt. Ohne nutzbare Servertexte wird protokolliert, aber keine Ersatzmeldung erfunden. Logout sendet die konfigurierte Methode ohne Request-Body. Bei bestätigter Abmeldung oder `status: "nicht_angemeldet"` wird die lokale Person entfernt, die Config erneut geladen und zur Auswahl zurückgekehrt. Das Beenden der serverseitigen Sitzung bleibt Aufgabe des Backends.

`api.js` loggt Response-Bodies. In Produktionsantworten daher keine unnötigen Geheimnisse oder personenbezogenen Inhalte mitsenden.