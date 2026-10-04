// Liest den alten ?form=...-Query-Parameter für vorhandene Direktlinks.

export function leseFormIdAusUrl() {
  return new URLSearchParams(window.location.search).get("form");
}

