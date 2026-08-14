<script setup lang="ts">
defineProps<{ type?: string }>()
</script>

<template>
  <button class="yz-button"><slot /></button>
</template>
