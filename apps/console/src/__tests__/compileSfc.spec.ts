import { describe, it, expect } from 'vitest'
import { compileSfc } from '../compileSfc'

describe('compileSfc', () => {
  it('compiles a simple script-setup component into sandbox html', () => {
    const { html } = compileSfc(`
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
const label: string = 'hi'
</script>
<template>
  <button @click="count++">{{ label }} {{ count }}</button>
</template>
<style>
button { color: red; }
</style>
`)
    // 编译产物包含：render 挂载、vue import map、样式、错误上报
    expect(html).toContain('importmap')
    expect(html).toContain('createApp(__sfc__).mount')
    expect(html).toContain('sandbox-error')
    expect(html).toContain('color: red')
    expect(html).toContain('"vue":"https://esm.sh/vue@3.5.41"')
    // TS 已被 Sucrase 剥离（无类型注解残留）
    expect(html).not.toContain('const label: string')
    // render 已合并进 __sfc__
    expect(html).toContain('__sfc__.render = render')
  })

  it('rejects components without script', () => {
    expect(() => compileSfc('<template><div>hi</div></template>')).toThrow('必须包含')
  })

  it('rejects external dependencies (plain Vue components only)', () => {
    const src = `
<script setup>
import axios from 'axios'
const x = 1
</script>
<template><div>{{ x }}</div></template>
`
    expect(() => compileSfc(src)).toThrow('外部依赖')
  })

  it('rejects malformed template', () => {
    const src = `
<script setup>
const x = 1
</script>
<template><div>{{ x }
</template>
`
    expect(() => compileSfc(src)).toThrow()
  })
})
