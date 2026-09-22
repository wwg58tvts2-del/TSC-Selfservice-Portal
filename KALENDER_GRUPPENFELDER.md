# Vom Kalender verwendete Gruppenfelder

Der Kalender verwendet aus jedem Objekt in `gruppen` nur die folgenden Felder.

## Felder aus `gruppen`

| Feld | Verwendung |
| --- | --- |
| `gruid` | Eindeutige Gruppen-ID für die interne Termin-ID und die Zuordnung des Gruppentermins. |
| `grubez` | Name beziehungsweise Titel der Trainingsgruppe. Wenn leer, wird `Training` verwendet. |
| `grutxt` | Beschreibung der Gruppe. Wird nicht für die Leistungsstufe verwendet. |
| `notiz` | Zusätzliche Notiz zum Gruppentermin. Wird in der Detailansicht als `Notiz` angezeigt. |
| `trnameall` | Name der Trainerin oder des Trainers. |
| `inaktiv` | Wenn exakt `true`, wird die gesamte Gruppe nicht angezeigt. |
| `hp_leiststufe` | Primäre Quelle für die Leistungsstufe. |
| `hp_altersstufe` | Altersgruppe des Trainings. Dieses Feld wird direkt verwendet. |
| `hp_kat` | Primäre Quelle für den Bereich beziehungsweise die Kategorie des Trainings. |
| `gzfld03` | Zusatzfeld für die Leistungsstufe; wird verwendet, wenn `hp_leiststufe` leer ist. |
| `gzfld05` | Steuert bei mehreren Einträgen den Wechsel zwischen geraden und ungeraden Kalenderwochen. |
| `kursvon` | Frühestes Datum, an dem die Gruppentermine angezeigt werden. Der Tag ist eingeschlossen. |
| `kursbis` | Letztes Datum, an dem die Gruppentermine angezeigt werden. Der Tag ist eingeschlossen. |
| `kbez` | Fallback für den Bereich, wenn `hp_kat` leer ist. Ein führendes `Training ` wird dabei entfernt. |

## Felder aus `gruppen[].gruzar`

Jeder Eintrag in `gruzar` erzeugt einen eigenen Gruppentermin.

| Feld | Verwendung |
| --- | --- |
| `wotag` | Wochentag des Termins. `1` = Montag bis `7` = Sonntag. |
| `startzeit` | Startzeit des Termins, zum Beispiel `18:00:00`. |
| `endzeit` | Endzeit des Termins, zum Beispiel `19:15:00`. |
| `ortbez` | Name des Saals. Wenn leer, wird `ortkb` verwendet. |
| `ortkb` | Alternative beziehungsweise kurze Saalbezeichnung. |

## Sonderverarbeitung von Gruppenfeldern

### Leistungsstufe

Die Leistungsstufe wird in dieser Reihenfolge gelesen:

1. `hp_leiststufe`
2. `gzfld03`, wenn `hp_leiststufe` leer ist

`grutxt` wird dafür nicht verwendet.

## Zuordnung MGVO-Oberfläche zu JSON

| Bezeichnung in der MGVO-Oberfläche | JSON-Feld | Verwendung im Kalender |
| --- | --- | --- |
| Altersstufe (HP) | `hp_altersstufe` | Altersgruppe |
| Leistungsstufe (HP) | `hp_leiststufe` | Primäre Leistungsstufe |
| Kategorie (HP) | `hp_kat` | Primärer Bereich |
| Zusatzfeld 1: Faktor (%) für Trainerkosten | `gzfld01` | Nicht verwendet |
| Zusatzfeld 2: Berechnung | `gzfld02` | Nicht verwendet |
| Zusatzfeld 3: Leistungsstufe | `gzfld03` | Fallback für die Leistungsstufe |
| Zusatzfeld 4: Altersklasse | `gzfld04` | Nicht verwendet |
| Zusatzfeld 5: Kalenderwoche | `gzfld05` | Gerade/ungerade Kalenderwoche |
| Zusatzfeld 6: Trainingseinheiten | `gzfld06` | Nicht verwendet |
| Zusatzfeld 7: Zielgruppe | `gzfld07` | Nicht verwendet |
| Zusatzfeld 8: Ausblenden im | `gzfld08` | Nicht verwendet |

Für die Leistungsstufe gilt daher:

```text
1. hp_leiststufe (Leistungsstufe (HP))
2. gzfld03 (Zusatzfeld 3: Leistungsstufe), wenn hp_leiststufe leer ist
```

`grutxt` wird nicht als Leistungsstufe interpretiert.

### `grutxt`

Der Inhalt von `grutxt` wird als Beschreibung des Gruppentermins angezeigt.

### `gzfld05`

Mögliche Werte:

```text
Erster Eintrag ist gerade KW
Erster Eintrag ist ungerade KW
```

- Leer: Alle `gruzar`-Einträge werden jede Woche angezeigt.
- `Erster Eintrag ist gerade KW`: Der erste Eintrag wird in geraden Kalenderwochen, der zweite in ungeraden Kalenderwochen angezeigt.
- `Erster Eintrag ist ungerade KW`: Der erste Eintrag wird in ungeraden Kalenderwochen, der zweite in geraden Kalenderwochen angezeigt.

### `kursvon` und `kursbis`

Die Datumsgrenzen gelten einschließlich beider Tage.

```json
{
  "kursvon": "2026-09-07",
  "kursbis": "2026-09-21"
}
```

Der Gruppentermin wird am 07., 14. und 21. September angezeigt. Leere Werte und `"0000-00-00"` bedeuten, dass keine entsprechende Grenze gesetzt ist.
