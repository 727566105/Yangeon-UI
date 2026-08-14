<script setup lang="ts">
import { computed } from 'vue'
import YzIcon from '../icon/Icon.vue'

interface InputProps {
  modelValue?: string | number
  type?: 'text' | 'password' | 'number' | 'search' | 'email'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  size?: 'sm' | 'md' | 'lg'
  maxlength?: number
}

const props = withDefaults(defineProps<InputProps>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  clearable: false,
  size: 'md',
  maxlength: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'input', evt: Event): void
  (e: 'change', evt: Event): void
  (e: 'focus', evt: FocusEvent): void
  (e: 'blur', evt: FocusEvent): void
  (e: 'clear'): void
}>()

const hasValue = computed(() => String(props.modelValue).length > 0)

function onInput(evt: Event) {
  emit('update:modelValue', (evt.target as HTMLInputElement).value)
  emit('input', evt)
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <div class="yz-input" :class="[`yz-input--${size}`, { 'yz-input--disabled': disabled }]">
    <span v-if="$slots.prefix" class="yz-input__prefix"><slot name="prefix" /></span>
    <input
      class="yz-input__field"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      @input="onInput"
      @change="(e) => emit('change', e)"
      @focus="(e) => emit('focus', e)"
      @blur="(e) => emit('blur', e)"
    />
    <button
      v-if="clearable && hasValue && !disabled"
      class="yz-input__clear"
      type="button"
      aria-label="清空"
      @click="clear"
    >
      <YzIcon name="close" :size="14" />
    </button>
    <span v-if="$slots.suffix" class="yz-input__suffix"><slot name="suffix" /></span>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.yz-input {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid $yz-line-strong;
  border-radius: $yz-radius-control;
  background: $yz-surface;
  transition:
    border-color $yz-duration $yz-ease-out-strong,
    box-shadow $yz-duration $yz-ease-out-strong,
    background-color $yz-duration $yz-ease-out-strong;

  &:focus-within {
    border-color: $yz-accent;
    box-shadow: 0 0 0 3px var(--yz-accent-tint);
  }

  &--sm { height: 28px; padding: 0 8px; }
  &--md { height: 36px; padding: 0 10px; }
  &--lg { height: 44px; padding: 0 12px; }

  &--disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.yz-input__field {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: $yz-font-sans;
  font-size: inherit;
  color: $yz-ink;
  &::placeholder { color: $yz-ink-3; }
  &:disabled { cursor: not-allowed; }
}

.yz-input__prefix,
.yz-input__suffix {
  display: inline-flex;
  align-items: center;
  color: $yz-ink-3;
}

.yz-input__clear {
  display: inline-flex;
  align-items: center;
  border: none;
  background: transparent;
  color: $yz-ink-3;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  &:hover { color: $yz-ink; background: var(--yz-hover); }
}
</style>
