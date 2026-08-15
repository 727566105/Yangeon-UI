<script setup lang="ts">
// YzBorderBeam demo：
// - 样式 A：6 组渐变预设（Ocean/Sunset/Aurora/Forest/Ember/Nebula），单光束，
//   由展示站 VariantSwitcher 承担预设切换（antd demo 中的 Segmented）
// - 样式 B：多光束（count 分布），两张卡对比 count=3 / count=2（antd Multiple beams demo）
import { computed } from 'vue'
import { YzBorderBeam, type BorderBeamStop } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

interface PresetProps {
  name: string
  usage: string
  description: string
  color: BorderBeamStop[]
}

const active = computed<PresetProps>(
  () => (props.variants?.[props.variantIndex ?? 0]?.props ?? {}) as PresetProps,
)

// 样式 B：多光束使用库 accent 渐变（非预设色板）
const multiColor: BorderBeamStop[] = [
  { color: 'var(--yz-accent)', percent: 0 },
  { color: 'color-mix(in srgb, var(--yz-accent) 45%, transparent)', percent: 100 },
]
const isMulti = computed(() => active.value.type === 'multi')
</script>

<template>
  <!-- 样式 B：多光束，两张卡对比 count=3 / count=2 -->
  <div v-if="isMulti" class="bb-multi">
    <YzBorderBeam
      v-for="count in [3, 2]"
      :key="count"
      :color="multiColor"
      :count="count"
      :radius="12"
      :line-width="1.5"
      :size="100"
      :duration="7"
      class="bb-demo"
    >
      <div class="bb-card">
        <span class="bb-card__title">Multiple beams</span>
        <p class="bb-card__desc">
          Set count to distribute multiple beams evenly around the container border.
        </p>
      </div>
    </YzBorderBeam>
  </div>

  <!-- 样式 A：单光束 + 预设色板 -->
  <YzBorderBeam
    v-else
    :color="active.color"
    :radius="12"
    :line-width="1.5"
    :size="120"
    :duration="7"
    class="bb-demo"
  >
    <div class="bb-card">
      <div class="bb-card__head">
        <span class="bb-card__title">{{ active.name }}</span>
        <span class="bb-card__usage">{{ active.usage }}</span>
      </div>
      <p class="bb-card__desc">{{ active.description }}</p>
      <div class="bb-card__swatches">
        <span
          v-for="s in active.color"
          :key="`${s.color}-${s.percent}`"
          class="bb-card__swatch"
        >
          <i class="bb-card__dot" :style="{ background: s.color }" />
          {{ s.color }} · {{ s.percent }}%
        </span>
      </div>
      <p class="bb-card__note">Stop positions use the public 0-100 input range.</p>
    </div>
  </YzBorderBeam>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.bb-demo {
  max-width: 480px;
  margin: 0 auto;
}

/* 多光束（样式 B）：两卡垂直排列 */
.bb-multi {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 480px;
  margin: 0 auto;
}

/* 仿 antd Card：白底 + 1px 描边 + 圆角，边框环即光束行走路径 */
.bb-card {
  padding: 20px 22px;
  border: 1px solid var(--yz-line-strong);
  border-radius: 12px;
  background: var(--yz-surface);
  box-shadow: $yz-shadow-card;
  text-align: left;
}

.bb-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bb-card__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--yz-ink);
}

.bb-card__usage {
  padding: 1px 8px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--yz-accent) 12%, transparent);
  color: var(--yz-accent);
  font-size: 11.5px;
  font-weight: 500;
}

.bb-card__desc {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--yz-ink-2);
}

.bb-card__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.bb-card__swatch {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--yz-field);
  font-family: var(--yz-font-mono);
  font-size: 10.5px;
  color: var(--yz-ink-2);
}

.bb-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
}

.bb-card__note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--yz-ink-3);
}
</style>
