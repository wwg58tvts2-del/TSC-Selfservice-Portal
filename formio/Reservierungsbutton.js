// ======================================================
// FORM.IO → n8n RESERVIERUNGSANFRAGE
// ======================================================

// ======================================================
// NUR DIE RESERVIERUNGSANFRAGE ZURÜCKSETZEN
// ======================================================

function resetReservierungsanfrage() {
  const panel = instance.root.getComponent('reservierungsanfrage1');

  if (!panel) {
    throw new Error('Panel "reservierungsanfrage1" wurde nicht gefunden.');
  }

  // Panel einschließlich aller enthaltenen Felder zurücksetzen
  panel.resetValue();

  // Merker der eigenen Bis-Uhrzeit-Logik synchronisieren
  const von = panel.getComponent('von');
  const bis = panel.getComponent('bis');

  if (von && bis) {
    bis._von = von.dataValue;
  }

  // Nur dieses Panel neu zeichnen
  return panel.redraw();
}

// ======================================================
// KONFIGURATION
// ======================================================

const CONFIG = {
  // n8n Webhook
  webhookUrl: '/webhook/reservierungsanfrage',

  // HTTP-Methode
  method: 'POST',

  // Ladeanzeige
  ladeText: 'Deine Reservierungsanfrage wird übermittelt …',

  // Formular bleibt nach Erfolg geöffnet
  zurueckNachErfolg: false,

  // Nach Erfolg ausschließlich das Anfrage-Panel zurücksetzen
  onSuccess: () => resetReservierungsanfrage()
};

// ======================================================
// RESERVIERUNGSANFRAGE ABSENDEN
// ======================================================

window.sendeFormular(instance, CONFIG);