# Automatischer Docker-Build und Portainer

Jeder Push auf `main` startet den Workflow „Docker-Image bauen und veröffentlichen“.
Das Dockerfile führt mit Node 24 zuerst `npm ci` und `npm run build` aus.
Nur bei erfolgreichem Build wird das fertige Nginx-Image in GHCR veröffentlicht.
Das Image enthält `dist/` einschließlich der Dateien aus `public/`.
Es enthält weder Node noch einen Git-Klon. Zielplattform ist Linux amd64 (x86-64).

## Erster Push

Alle Vue-Änderungen einschließlich `package-lock.json`, `public/`, `src/` und
`vite.config.js` zusammen mit den neuen Docker-Dateien committen und nach `main`
pushen. In GitHub unter Actions den neuen Workflow öffnen und dessen Erfolg abwarten.
Das Image heißt `ghcr.io/wwg58tvts2-del/tsc-selfservice-portal:latest`.
Jeder Build erhält außerdem `sha-<vollständige Commit-ID>` für Versionswechsel.
Der Workflow verwendet den automatisch bereitgestellten GITHUB_TOKEN; ein eigenes
Registry-Passwort als Repository-Secret ist normalerweise nicht nötig.
Nach erfolgreichem Push ruft er `PORTAINER_WEBHOOK_URL` auf. Dieses GitHub-Secret
muss ausschließlich den Webhook des Portainer-Test-Stacks enthalten. Der
Produktiv-Stack darf nicht auf dieses Secret zeigen.

## Registry-Zugriff

Neue GHCR-Pakete sind standardmäßig privat, auch bei öffentlichen Repositories.
Nach dem ersten Build im GitHub-Profil unter Packages das Image öffnen.
Entweder in Package settings die Sichtbarkeit bewusst auf Public stellen oder
in Portainer eine Registry `ghcr.io` mit GitHub-Benutzername und einem Personal
Access Token (classic) mit `read:packages` einrichten. Private Images benötigen
beim Stack-Deployment diese Registry-Zugangsdaten. Keine Tokens ins Repository schreiben.

## Parallel testen

In Portainer einen neuen Stack `serviceportal-vue` anlegen und den Inhalt von
`compose.yaml` in den Editor kopieren. Gegebenenfalls die GHCR-Registry auswählen.
Der Standardport ist 8086: http://192.168.178.150:8086/ .
Das alte Portal auf 8087 bleibt zunächst bestehen. Kein htdocs-Volume hinzufügen:
Die kompilierten Webdateien sind bereits im Image.
Externe Konfiguration, n8n und Form.io bleiben Laufzeitabhängigkeiten und müssen
für den neuen Ursprung erreichbar sein (gegebenenfalls CORS/Cookies prüfen).

## Aktualisieren und zurückwechseln

Nach einem erfolgreichen GitHub-Build in Portainer den Stack aktualisieren und
dabei das erneute Herunterladen des Images aktivieren. Der Container muss neu
erstellt werden; ein Neustart allein lädt kein neues Image.
Für eine feste Version die Stack-Umgebungsvariable IMAGE_TAG auf
`sha-<vollständige Commit-ID>` setzen, für den neuesten Stand auf `latest`.
GitHub Packages zeigt die verfügbaren Tags. Aufbewahrte SHA-Tags nicht löschen,
wenn sie für einen späteren Rückwechsel benötigt werden.

## Umstellung

Erst nach erfolgreichem Test das alte Portal stoppen bzw. aus dessen Stack
entfernen, PORTAL_PORT im neuen Stack auf 8087 setzen und diesen aktualisieren.
Den alten Projektordner erst nach Sicherung eigener Daten entfernen.
Den bisherigen GitHub-Push-Webhook für dieses Portal separat deaktivieren:
Er kann sonst weiterhin das alte git-pull-Deployment auslösen.
Die GitHub-Secrets `PROD_WEBHOOK_URL` und `PROD_WEBHOOK_SECRET` können danach
aus den Repository-Einstellungen entfernt werden. Der alte manuelle Workflow
`deploy-prod.yml` wurde aus diesem Repository entfernt.

Der Workflow aktualisiert nach dem Image-Push automatisch den Test-Stack über
dessen Portainer-Webhook. Das Image wird dadurch nicht automatisch in Produktion
ausgerollt; der Prod-Stack bleibt separat und wird weiterhin manuell aktualisiert.
