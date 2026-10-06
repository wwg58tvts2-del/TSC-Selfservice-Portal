# Konfiguration

## Einstiegspunkt

Die in `public/config.json` abgelegte und unter `/config.json` ausgelieferte Datei enthält derzeit nur den Endpunkt:

```json
{
  "configUrl": "/webhook/portal-config"
}
```

Das Frontend lädt zuerst diese Datei und danach die JSON-Antwort von `configUrl`. Die API akzeptiert als Antwort ein Konfigurationsobjekt oder ein Array, aus dem das erste Element verwendet wird. Erforderliche Endpunkte und Texte werden nicht in JavaScript fest codiert.

## Portalobjekt

Die Laufzeitkonfiguration verwendet diese Bereiche:

| Schlüssel | Verwendung |
| --- | --- |
| `page` | Seitentitel und Favicon |
| `header` | Logo, Alternativtext, Kicker und Unterzeile |
| `body` | Überschrift und Einleitung der Auswahl |
| `memberStatusUrl` | Prüfung des aktuellen Mitglieds |
| `memberLogin` | Statusgruppen, Kennungsfelder, OTP-Webhooks und Texte |
| `memberLogout` | Logout-Webhook, Methode und Ladeanzeige |
| `forms` | Form.io-Basisadresse, Abschnittstexte und Formulare |
| `onlineServices` | Abschnittstexte und externe Links |
| `downloads` | Abschnittstexte und Download-Links |
| `footer` | Rechtliche und weitere Footer-Links |
| `calendarUrl` | Datenendpunkt für Kalender und Trainingsplan |

`areas` ist eine geordnete Liste im System-JSON. Jede Area enthält `id`, `type`, `section` und `items`; die Items kommen beim Lesen aus `portal_item`, gefiltert nach `system_id` und `area == id`.

`area.type` ist der Standardtyp für Items ohne eigenen Typ. Jedes Item kann `type` auf `form`, `page`, `link`, `app`, `service` oder `download` setzen. Formulare verwenden die Item-`id` und das systemweite `formBaseUrl`; `width: 1` ist die Standardbreite, `width: 2` belegt zwei Kartenraster-Spalten. Link-Items verwenden `url` und `openInNewWindow: true` für ein neues Fenster (`false` öffnet im selben Fenster). `section` enthält `kicker`, `title` und `intro`.

## Einträge und Suche

Formulare verwenden mindestens `id`, `titel` und `beschreibung`. Titel und Beschreibung werden oberhalb des eingebetteten Formulars angezeigt; alternativ werden `title` und `description` unterstützt. Online-Services verwenden `url`, `titel`, `beschreibung` und optional `neuesFenster`. Downloads verwenden `url`, `titel` und `beschreibung`. Footer-Links verwenden `url` und `titel`.

Die Kopfzeilensuche durchsucht nur Formulare, Online-Services und Downloads. Sie berücksichtigt `title`/`titel`, `description`/`beschreibung` und optionale Suchbegriffe in `searchTerms`, `searchKeywords`, `keywords`, `suchbegriffe`, `suchwoerter` oder `tags`. Der Vergleich ignoriert Groß-/Kleinschreibung. Jedes Item erhält beim Laden ein Laufzeitfeld `visible`, das beim Tippen neu berechnet wird; es ist keine Berechtigungsinformation.

`active` und `sichtbarkeit` werden bei diesen Hauptlisten nicht zur Autorisierung ausgewertet. Ein Suchtreffer macht einen Eintrag nicht zugriffsberechtigt; diese Entscheidung liegt beim Backend.

## Mitgliederlogin

`memberLogin.steps.chooseStatus.statusGroups` enthält Optionen mit `value`, `label`, `identifierField` und `identifierLabel`. `steps.requestOtp` und `steps.authenticate` konfigurieren jeweils `webhookUrl`, `method` und `loadingText` sowie die zugehörigen Texte. `memberLogin.messages` liefert Texte für lokale Ablauf- und Konfigurationsfehler. `memberStatusUrl` liefert `person` und einen Erfolgsindikator; `memberLogout` konfiguriert den separaten Logout-Request.