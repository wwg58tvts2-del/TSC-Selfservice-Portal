// Liest/schreibt ausschließlich den ?form=...-Query-Parameter und die Browser-History

export function leseFormIdAusUrl() {
  return new URLSearchParams(window.location.search).get("form");
}

export function aktualisiereUrl(formId) {
  const pageUrl = new URL(window.location.href);

  if (formId) {
    pageUrl.searchParams.set("form", formId);
  } else {
    pageUrl.searchParams.delete("form");
  }

  const nextUrl = `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.pushState({ formId: formId || null }, "", nextUrl);
  }
}
