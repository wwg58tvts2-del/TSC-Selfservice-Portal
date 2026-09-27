# Konfiguration

## Einstiegspunkt

Die lokale `config.json` enthält derzeit nur den Endpunkt:

```json
{
  "configUrl": "/webhook/config/selfservice"
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

Jeder Bereich mit Listen verwendet `section` für `kicker`, `title` und `intro`. `forms.baseUrl` wird mit `forms.items[].id` kombiniert.

## Einträge und Suche

Formulare verwenden mindestens `id`, `titel` und `beschreibung`. Online-Services verwenden `url`, `titel`, `beschreibung` und optional `neuesFenster`. Downloads verwenden `url`, `titel` und `beschreibung`. Footer-Links verwenden `url` und `titel`.

Die Kopfzeilensuche durchsucht nur Formulare, Online-Services und Downloads. Sie berücksichtigt `title`/`titel`, `description`/`beschreibung` und optionale Suchbegriffe in `searchTerms`, `searchKeywords`, `keywords`, `suchbegriffe`, `suchwoerter` oder `tags`. Der Vergleich ignoriert Groß-/Kleinschreibung. Jedes Item erhält beim Laden ein Laufzeitfeld `visible`, das beim Tippen neu berechnet wird; es ist keine Berechtigungsinformation.

`active` und `sichtbarkeit` werden bei diesen Hauptlisten nicht zur Autorisierung ausgewertet. Ein Suchtreffer macht einen Eintrag nicht zugriffsberechtigt; diese Entscheidung liegt beim Backend.

## Mitgliederlogin

`memberLogin.steps.chooseStatus.statusGroups` enthält Optionen mit `value`, `label`, `identifierField` und `identifierLabel`. `steps.requestOtp` und `steps.authenticate` konfigurieren jeweils `webhookUrl`, `method` und `loadingText` sowie die zugehörigen Texte. `memberLogin.messages` liefert Texte für lokale Ablauf- und Konfigurationsfehler. `memberStatusUrl` liefert `person` und einen Erfolgsindikator; `memberLogout` konfiguriert den separaten Logout-Request.