import { describe, it, expect } from 'vitest'
import { compileSfc, isReactJsxSource } from '../compileSfc'

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

describe('compileSfc parse error reporting', () => {
  it('reports attribute-name errors with line/column location', () => {
    const src = '<template>\n  <div class="x" "y">hi</div>\n</template>\n<script setup>const a = 1</script>'
    try {
      compileSfc(src)
      expect.unreachable('should throw')
    } catch (e) {
      const msg = (e as Error).message
      expect(msg).toContain('SFC 解析失败')
      expect(msg).toContain('Attribute name cannot contain')
      // 定位信息：错误发生在第 2 行（<div class="x" "y">）
      expect(msg).toContain('第 2 行')
    }
  })
})

describe('compileSfc React JSX detection', () => {
  it('detects React code via the react import', () => {
    expect(isReactJsxSource(`import React from 'react';\nconst App = () => <div />;`)).toBe(true)
    expect(isReactJsxSource(`import { Tabs } from 'antd';\nimport type { TabsProps } from 'antd';`)).toBe(false)
  })

  it('detects JSX feature combinations without a react import', () => {
    // className + 大写组件标签（>=2 个 JSX 特征）
    expect(isReactJsxSource('<Segmented options={[\'a\']} />\n<div className="x" />')).toBe(true)
    // 仅有 1 个特征不算（避免误伤普通 Vue 模板）
    expect(isReactJsxSource('<div className="x" />')).toBe(false)
  })

  it('reports a friendly guidance message instead of the raw SFC parse error', () => {
    const src = `import React from 'react';
import { Segmented, Tabs } from 'antd';
import type { TabsProps } from 'antd';

const onChange = (key: string) => {
  console.log(key);
};

const items: TabsProps['items'] = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
];

const App: React.FC = () => {
  const [alignValue, setAlignValue] = React.useState<Align>('center');
  return (
    <>
      <Segmented value={alignValue} options={['start', 'center', 'end']} />
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
    </>
  );
};

export default App;`
    try {
      compileSfc(src)
      expect.unreachable('should throw')
    } catch (e) {
      const msg = (e as Error).message
      // 不再出现误导性的「Element is missing end tag」格式错误
      expect(msg).not.toContain('missing end tag')
      expect(msg).toContain('React JSX')
      expect(msg).toContain('Vue 单文件组件')
      expect(msg).toContain('ZCode')
    }
  })
})

describe('compileSfc language support (TypeScript + JavaScript)', () => {
  it('compiles a plain JavaScript SFC (no lang attribute)', () => {
    const src = `
<script setup>
import { ref } from 'vue'
const count = ref(0)
const label = 'hello'
</script>
<template>
  <button @click="count++">{{ label }} {{ count }}</button>
</template>
`
    const { html } = compileSfc(src)
    expect(html).toContain('createApp(__sfc__).mount')
    expect(html).toContain('__sfc__.render = render')
  })

  it('compiles a TypeScript SFC with interface, enum and generics', () => {
    const src = `
<script setup lang="ts">
import { ref } from 'vue'
interface Props { label?: string }
enum Dir { Up = 1, Down = 2 }
const props = defineProps<Props>()
const count = ref<number>(0)
const dir = Dir.Up
</script>
<template>
  <div>{{ props.label ?? 'x' }} {{ count }} {{ dir }}</div>
</template>
`
    const { html } = compileSfc(src)
    expect(html).toContain('createApp(__sfc__).mount')
    // 类型语法已被剥离（interface/enum 类型残留不应出现）
    expect(html).not.toContain('interface Props')
    expect(html).not.toContain('ref<number>')
  })

  it('compiles a JavaScript options-API SFC (script without setup)', () => {
    const src = `
<script>
export default {
  data: () => ({ msg: 'hi' }),
  template: '<div>{{ msg }}</div>',
}
</script>
`
    const { html } = compileSfc(src)
    expect(html).toContain('createApp(__sfc__).mount')
  })
})
