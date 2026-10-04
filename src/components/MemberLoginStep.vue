<script setup>
defineProps({
  number: { type: String, default: "" },
  title: { type: String, default: "" }
});
</script>

<template>
  <section class="member-login-step-card">
    <div class="member-login-step-heading">
      <span class="member-login-step-number">{{ number }}</span>
      <h2>{{ title }}</h2>
    </div>
    <slot />
  </section>
</template>