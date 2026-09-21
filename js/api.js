// Reines Netzwerk-/Logging-Modul, kein Zugriff auf den reaktiven State

// document.cookie sieht HttpOnly-Cookies nicht, dient nur als Zusatzinfo fürs Debugging
export function hatSichtbarenCookie() {
  return document.cookie.trim().length > 0;
}

export function loggeResponse(label, response, body) {
  const header = {};

  response.headers.forEach((value, key) => {
    header[key] = key.toLowerCase() === "set-cookie"
      ? "[vom Browser aus Sicherheitsgründen nicht lesbar]"
      : value;
  });

  console.group(`[Serviceportal] ${label}`);
  console.log("Status:", response.status, response.statusText);
  console.log("URL:", response.url);
  console.log("Response-Header:", header);
  console.log("Response-Body:", body);
  console.groupEnd();
}

export async function ladeConfigDaten(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Konfiguration konnte nicht geladen werden (${response.status}).`);
  }

  return response.json();
}

export async function holeMemberStatus() {
  const response = await fetch("/webhook/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  loggeResponse("/webhook/me", response, result);

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    const error = new Error(
      typeof result === "string" ? result : `HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  const daten = Array.isArray(result) ? result[0] : result;
  const person = daten?.person;
  const gefunden = daten?.gefunden === true || daten?.erfolgreich === true;
  const nichtAngemeldet = daten?.status === "fehlender_coockie"
    || daten?.status === "fehlender_cookie"
    || daten?.status === "nicht_angemeldet";

  if (nichtAngemeldet || !gefunden || !person) {
    return null;
  }

  return person;
}

export async function sendeLogout(config = {}) {
  const webhookUrl = config.webhookUrl || "/webhook/logout";
  const method = config.method || "GET";

  const response = await fetch(webhookUrl, {
    method,
    credentials: "include",
    cache: "no-store"
  });

  const result = await response.json();
  loggeResponse(webhookUrl, response, result);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.result = result;
    throw error;
  }

  if (!result || typeof result.erfolgreich !== "boolean") {
    const error = new Error("Ungültige JSON-Antwort.");
    error.result = result;
    throw error;
  }

  return result;
}

export async function sendeFormularRequest(webhookUrl, method, data) {
  const requestMethod = String(method || "POST").toUpperCase();
  const requestOptions = {
    method: requestMethod,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Accept": "application/json"
    },
  };

  if (requestMethod !== "GET" && requestMethod !== "HEAD") {
    requestOptions.headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify({
      request: {
        data
      }
    });
  }

  const response = await fetch(webhookUrl, requestOptions);

  const result = await response.json();

  loggeResponse(
    webhookUrl,
    response,
    result
  );

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.result = result;
    throw error;
  }

  return result;
}
