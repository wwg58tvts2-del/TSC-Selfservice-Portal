<script setup>
defineProps({
  links: { type: Array, default: () => [] }
});
</script>

<template>
  <footer class="site-footer">
    <nav class="footer-links" aria-label="Rechtliches">
      <a v-for="link in links" :key="link.url" class="footer-link" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.titel }}</a>
    </nav>
  </footer>
</template>