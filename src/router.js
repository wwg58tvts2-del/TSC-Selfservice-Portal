import { createRouter, createWebHashHistory } from "vue-router";
import CalendarPage from "./CalendarPage.vue";
import PortalPage from "./PortalPage.vue";
import TrainingPlanPage from "./TrainingPlanPage.vue";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "portal", component: PortalPage },
    { path: "/kalender", name: "kalender", component: CalendarPage },
    { path: "/trainingsplan", name: "trainingsplan", component: TrainingPlanPage },
    { path: "/:pathMatch(.*)*", redirect: "/" }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});