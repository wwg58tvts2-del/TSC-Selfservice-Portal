// Kapselt den direkten Umgang mit der globalen Formio-Bibliothek

export async function ladeFormular(container, formUrl, { onSubmitDone } = {}) {
  const instance = await Formio.createForm(container, formUrl, {
    noAlerts: false,
    readOnly: false
  });

  instance.on("submitDone", () => {
    if (typeof onSubmitDone === "function") {
      onSubmitDone();
    }
  });

  instance.on("error", (error) => {
    console.error("Form.io-Fehler:", error);
  });

  return instance;
}

export function zerstoereFormular(instance) {
  if (instance) {
    instance.destroy(true);
  }
}
