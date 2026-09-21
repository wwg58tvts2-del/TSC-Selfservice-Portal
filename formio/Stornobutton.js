// ======================================================
// FORM.IO → n8n RESERVIERUNG STORNIEREN
// ======================================================

(async () => {
  try {
    if (typeof row === 'undefined' || !row || !row.reservierungId) {
      throw new Error('Keine Reservierungs-ID in der aktuellen Zeile gefunden.');
    }

    const reservierungId = row.reservierungId;
    const dataGrid = instance.root.getComponent('dataGrid');

    if (!dataGrid) {
      throw new Error('Data Grid "dataGrid" wurde nicht gefunden.');
    }

    // ======================================================
    // KONFIGURATION
    // ======================================================

    const CONFIG = {
      webhookUrl: '/webhook/reservierungsanfrage-storno',
      method: 'DELETE',
      ladeText: 'Deine Reservierung wird storniert …',
      zurueckNachErfolg: false,

      // Nur die angeklickte Zeile senden
      data: row,

      // Nach Erfolg die stornierte Reservierung entfernen
      onSuccess: () => {
        const aktuelleDaten = Array.isArray(dataGrid.dataValue) ? dataGrid.dataValue : [];
        const neueDaten = aktuelleDaten.filter(eintrag =>
          String(eintrag.reservierungId) !== String(reservierungId)
        );

        return dataGrid.setValue(neueDaten);
      }
    };

    // ======================================================
    // STORNIERUNG ABSENDEN
    // ======================================================

    await window.sendeFormular(instance, CONFIG);
  } catch (error) {
    console.error('Fehler bei der Stornierung:', error);
  }
})();
