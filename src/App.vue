<script setup>
import { watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { usePortalStore } from "../js/state.js";

const route = useRoute();
const portal = usePortalStore();
const routenTitel = {
  kalender: "Kalender | Tanzsportclub Dortmund",
  trainingsplan: "Trainingsplan | Tanzsportclub Dortmund"
};

watch(
  () => route.name,
  (name) => {
    document.title = name === "portal"
      ? portal.config?.page?.title || "Portal"
      : routenTitel[name] || "Portal";
  },
  { immediate: true }
);
</script>

<template>
  <RouterView />
</template>