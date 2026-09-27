# Betrieb und Deployment

## Voraussetzungen

Das Repository ist eine statische Website ohne npm-/Buildprozess. Der Webserver muss HTML, CSS und ES-Module ausliefern; die Seiten benötigen HTTPS für die produktive Cookie-/Webhook-Kommunikation sowie Zugriff auf die eingebundenen CDNs. Die `configUrl`, `memberStatusUrl`, Login-/Logout- und Kalenderendpunkte müssen zur jeweiligen Umgebung passen.

Änderungen an JavaScript und CSS erhalten Cachekennungen in den HTML-Script-/Stylesheet-URLs und in den lokalen ES-Modulimporten. Bei CSS-Imports sind auch die betroffenen Import-URLs zu aktualisieren.

## Produktion

`.github/workflows/deploy-prod.yml` ist ein manuell startbarer `workflow_dispatch`-Workflow und läuft nur für `refs/heads/main`. Er erwartet die GitHub-Secrets `PROD_WEBHOOK_URL` und `PROD_WEBHOOK_SECRET`. Die URL muss HTTPS verwenden und auf `/hooks/TSC-Selfservice-Portal-prod` enden.

GitHub Actions signiert die festen JSON-Bytes mit HMAC-SHA256 im Header `X-Hub-Signature-256`. Der Workflow akzeptiert ausschließlich HTTP 200 mit dem Body `Deployment triggered`. Danach führt der Server `git pull origin main` aus. Die Workflow-Antwort bestätigt nur den angenommenen Auftrag, nicht den erfolgreichen Pull oder das vollständige Live-Deployment.

## Prüfung

Es gibt keinen eingebauten Test-Runner. Für geänderte Module `node --check <datei>` und für JSON `python3 -m json.tool <datei>` verwenden. Form.io-/n8n-Verträge zusätzlich über das vorgesehene Testsystem prüfen. Keine lokalen Portalansichten im integrierten Browser testen und keine Produktions-Webhook-Requests als Syntaxprüfung verwenden.