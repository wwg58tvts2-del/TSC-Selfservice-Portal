# Betrieb und Deployment

## Voraussetzungen

Das Projekt benötigt Node.js 20.19 oder neuer sowie npm. Lokal: `npm ci`, `npm run dev`; für Produktion: `npm ci`, `npm run build`. Der Build liegt unter `dist/`. Der Webserver muss diesen Ordner als Dokumentenstamm ausliefern und HTTPS für die Cookie-/Webhook-Kommunikation bereitstellen. `configUrl`, `memberStatusUrl`, Login-/Logout- und Kalenderendpunkte müssen zur jeweiligen Umgebung passen.

Vite versieht gebündelte JavaScript- und CSS-Dateien mit Inhalts-Hashes. Die lokal gepinnten Laufzeitbibliotheken, Bilder und `config.json` werden aus `public/` nach `dist/` kopiert.

## Produktion

`.github/workflows/docker-image.yml` baut bei Pushes auf `main` das Docker-Image und veröffentlicht `latest` sowie einen unveränderlichen Commit-SHA-Tag in GHCR. Das Deployment erfolgt durch Aktualisieren des Portainer-Stacks; siehe [Docker und Portainer](../DOCKER.md).

Der frühere Git-Push-Webhook und sein serverseitiges `git pull`-Deploy-Skript liegen außerhalb dieses Repositories und müssen separat deaktiviert bzw. entfernt werden. Die nicht mehr verwendeten Secrets `PROD_WEBHOOK_URL` und `PROD_WEBHOOK_SECRET` können danach aus den GitHub-Repository-Secrets gelöscht werden.

## Prüfung

Es gibt keinen eingebauten Unit-Test-Runner. `npm run build` prüft Vue-SFCs, Imports und alle drei Seiteneinstiege. Form.io-/n8n-Verträge zusätzlich über das vorgesehene Testsystem prüfen. Keine lokalen Portalansichten im integrierten Browser testen und keine Produktions-Webhook-Requests als Buildprüfung verwenden.