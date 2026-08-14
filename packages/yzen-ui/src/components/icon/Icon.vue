<script setup lang="ts">
import { computed } from 'vue'
import { ICON_PATHS, type IconName } from './icon-paths'

interface IconProps {
  name: IconName
  size?: number | string
  strokeWidth?: number
}

const props = withDefaults(defineProps<IconProps>(), {
  size: '1em',
  strokeWidth: 1.8,
})

const paths = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS.info)
</script>

<template>
  <svg
    class="yz-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :width="size"
    :height="size"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="paths"
  />
</template>

<style scoped lang="scss">
.yz-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
