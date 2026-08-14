<script setup lang="ts">
import { computed } from 'vue'

interface ColProps {
  span?: number
  offset?: number
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

const props = withDefaults(defineProps<ColProps>(), {
  span: 24, offset: 0, xs: undefined, sm: undefined, md: undefined, lg: undefined, xl: undefined,
})

const classes = computed(() => {
  const cls = ['yz-col', `yz-col--${props.span}`, `yz-col--offset-${props.offset}`]
  for (const bp of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
    const v = props[bp]
    if (v !== undefined) cls.push(`yz-col--${bp}-${v}`)
  }
  return cls
})
</script>

<template>
  <div :class="classes"><slot /></div>
</template>

<style scoped lang="scss">
.yz-col {
  flex: 0 0 auto;
  box-sizing: border-box;
  min-width: 0;
}

@for $i from 1 through 24 {
  .yz-col--#{$i} { width: percentage($i / 24); }
  .yz-col--offset-#{$i} { margin-left: percentage($i / 24); }
}
.yz-col--offset-0 { margin-left: 0; }

$bps: (xs: 480px, sm: 640px, md: 768px, lg: 1024px, xl: 1280px);
@each $bp, $width in $bps {
  @media (min-width: $width) {
    @for $i from 1 through 24 {
      .yz-col--#{$bp}-#{$i} { width: percentage($i / 24); }
    }
  }
}
</style>
