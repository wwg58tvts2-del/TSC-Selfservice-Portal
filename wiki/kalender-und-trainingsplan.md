# Kalender und Trainingsplan

Beide Routen laden dieselbe Portal-Konfiguration und verwenden deren `calendarUrl`. Der Datenabruf erfolgt separat von der Hauptauswahl mit Cookies und `cache: "no-store"`. Vue Router zeigt sie innerhalb derselben `index.html` an.

## Trainingskalender

Die Route `/#/kalender` rendert `CalendarPage.vue`; `js/kalender.js` stellt den Kalender-Pinia-Store und die Normalisierung bereit. Die Antwort kann Gruppen, Reservierungen, Ferien und Stornos enthalten. Gruppentermine werden aus `gruppen[].gruzar[]` zu wiederkehrenden Einträgen normalisiert; Reservierungen werden als einzelne Events übernommen. Gruppen mit `inaktiv: true` werden ausgelassen.

FullCalendar zeigt Monats-, Wochen- und Tagesansichten. Hallenfilter steuern die Eventquelle; Eventfarben werden aus dem Saal abgeleitet. Kursbeginn/-ende, gerade/ungerade Kalenderwochen, Ferien und einzelne Stornos begrenzen die Wiederholungen. Ein Klick öffnet die Details des Events. FullCalendar und deutsche Lokalisierungen kommen von jsDelivr.

## Trainingsplan

Die Route `/#/trainingsplan` rendert `TrainingPlanPage.vue`; `js/trainingsplan.js` stellt den Trainingsplan-Pinia-Store und die Normalisierung bereit. Der Plan verwendet aktive Gruppen aus der Kalenderantwort; Reservierungen werden ignoriert. Pro Gruppe wird der erste `gruzar`-Termin für die Anzeige normalisiert.

Die Filter kombinieren Freitext über Name, Bereich, Stufe, Alter, Trainer*in, Beschreibung und Notiz mit Tag- und Trainer-Auswahl. Die Optionen für Tag und Trainer*in werden aus den geladenen Gruppen erzeugt. `inaktiv: true` schließt eine Gruppe aus.

## Fehlerbehandlung

Beide Seiten zeigen einen Ladezustand und eine Fehlermeldung. Ein leerer Event- beziehungsweise Gruppensatz erhält einen eigenen Leerzustand. Fehler beim Konfigurations- oder Kalenderrequest erscheinen nicht als erfolgreiche leere Daten.