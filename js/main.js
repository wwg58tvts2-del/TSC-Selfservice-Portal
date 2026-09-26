import {createApp} from "https://unpkg.com/petite-vue?module";
import {state} from "./state.js?v=20260926-login-dialog-1";


// Bestehende Form.io-Skripte rufen
// diese globalen Funktionen auf.

window.showMsgBox = (titel, inhalt, zurueckNachSchliessen, options = {}) =>
  state.zeigeMeldung(titel, inhalt, zurueckNachSchliessen, options);


window.closeMsgBox = () =>
  state.schliesseMeldung();


window.zeigeLaden = (text) =>
  state.zeigeLadenIntern(text);


window.versteckeLaden = () =>
  state.versteckeLadenIntern();


window.showLoading =
  window.zeigeLaden;


window.hideLoading =
  window.versteckeLaden;


window.ladeMemberDaten = (options) =>
  state.ladeMemberDaten(options);


window.pruefeMeWebhook =
  window.ladeMemberDaten;


window.logoutMember = () =>
  state.logout();


/*
 * Zentrale Schnittstelle für
 * Form.io-Custom-JavaScript.
 */
window.sendeFormular = (instance, config) =>
  state.sendeFormular(instance, config);


createApp(state).mount("body");

state.init();