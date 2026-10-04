<script setup>
import PortalCard from "./PortalCard.vue";
import PortalSection from "./PortalSection.vue";

defineProps({
  area: { type: Object, required: true }
});

defineEmits(["open-form", "open-page"]);

const opensInNewWindow = (item, type) =>
  item.openInNewWindow ?? item.neuesFenster ?? type === "download";
const itemType = (item, area) => {
  const type = String(item.type || item.typ || area.type || "").toLowerCase();
  return type === "formular" ? "form" : type === "seite" ? "page" : type;
};
</script>

<template>
  <PortalSection
    :id="area.id"
    :section="area.section"
    :fallback-title="area.title || area.id"
    :items="area.items"
    :options-class="area.type === 'download' ? 'download-options' : area.type === 'link' || area.type === 'service' ? 'service-options' : ''"
  >
    <template #default="{ items }">
      <PortalCard
        v-for="(item, index) in items"
        :key="item.id || item.url || `${area.id}-${index}`"
        :class="{ 'form-option--wide': itemType(item, area) === 'form' && Number(item.width) === 2 }"
        :variant="itemType(item, area) === 'download' ? 'download' : ['link', 'app', 'service'].includes(itemType(item, area)) ? 'service' : ''"
        :title="item.title || item.titel"
        :description="item.description || item.beschreibung"
      >
        <template #action>
          <button v-if="itemType(item, area) === 'form' || itemType(item, area) === 'formular'" class="form-button-label" type="button" @click="$emit('open-form', item)">
            Formular öffnen
            <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </button>
          <button v-else-if="itemType(item, area) === 'page' || itemType(item, area) === 'seite'" class="form-button-label" type="button" @click="$emit('open-page', item)">
            Öffnen
            <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </button>
          <a
            v-else
            :class="itemType(item, area) === 'download' ? 'download-button' : 'service-button'"
            :href="item.url"
            :target="opensInNewWindow(item, itemType(item, area)) ? '_blank' : '_self'"
            :rel="opensInNewWindow(item, itemType(item, area)) ? 'noopener noreferrer' : null"
          >
            <i :class="itemType(item, area) === 'download' ? 'bi bi-download' : 'bi bi-box-arrow-up-right'" aria-hidden="true"></i>
            {{ itemType(item, area) === 'download' ? 'Download' : 'Öffnen' }}
          </a>
        </template>
      </PortalCard>
    </template>
  </PortalSection>
</template>