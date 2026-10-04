import { createRouter, createWebHistory } from "vue-router";
import CalendarPage from "./CalendarPage.vue";
import PortalPage from "./PortalPage.vue";
import TrainingPlanPage from "./TrainingPlanPage.vue";

const query = new URLSearchParams(window.location.search);
const legacyFormId = query.get("form");
const legacyHashRoute = window.location.hash.startsWith("#/")
  ? window.location.hash.slice(1)
  : "";
let legacyRoute = legacyFormId
  ? `/${encodeURIComponent(legacyFormId)}`
  : legacyHashRoute;

if (legacyRoute) {
  query.delete("form");
  const basePath = window.location.pathname.endsWith("/index.html")
    ? window.location.pathname.slice(0, -"index.html".length)
    : window.location.pathname;
  const nextPath = `${basePath.replace(/\/$/, "")}${legacyRoute}` || "/";
  const nextSearch = query.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${nextPath}${nextSearch ? `?${nextSearch}` : ""}`
  );
}

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "portal", component: PortalPage },
    { path: "/login", name: "login", component: PortalPage },
    { path: "/kalender", name: "kalender", component: CalendarPage },
    { path: "/trainingsplan", name: "trainingsplan", component: TrainingPlanPage },
    {
      path: "/formular/:formId",
      name: "legacy-formular",
      redirect: (route) => ({ name: "formular", params: { formId: route.params.formId } })
    },
    { path: "/:formId", name: "formular", component: PortalPage },
    { path: "/:pathMatch(.*)*", redirect: "/" }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});