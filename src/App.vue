<script setup>
import { watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { usePortalStore } from "../js/state.js";

const route = useRoute();
const portal = usePortalStore();

watch(
  () => route.name,
  (name) => {
    const portalTitel = portal.config?.page?.title || "Portal";
    document.title = name === "formular"
      ? `${portal.selectedForm?.titel || portal.selectedForm?.title || "Formular"} | ${portalTitel}`
      : name === "seite"
        ? `${portal.selectedPage?.title || portal.selectedPage?.titel || "Seite"} | ${portalTitel}`
        : name === "kalender"
          ? "Kalender | Tanzsportclub Dortmund"
          : name === "trainingsplan"
            ? "Trainingsplan | Tanzsportclub Dortmund"
            : portalTitel;
  },
  { immediate: true }
);
</script>

<template>
  <RouterView />
</template>