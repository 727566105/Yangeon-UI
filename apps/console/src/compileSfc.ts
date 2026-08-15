// 沙箱预览编译管线（PRD 5.1：浏览器内编译 Vue SFC，play.vuejs.org 同原理）：
// @vue/compiler-sfc parse → compileScript（TS 用 Sucrase 剥离）→ compileTemplate →
// 组装为单文件 HTML（srcdoc 用），iframe sandbox="allow-scripts" 加载。
// 纯函数，可在 node 环境单测。
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { transform } from 'sucrase'

// iframe 沙箱内的 Vue 运行时来源：esm.sh + import map（PRD 5.4；pin 与项目一致的版本）
const VUE_CDN = 'https://esm.sh/vue@3.5.41'

// 只允许纯 Vue 组件（无外部依赖）：检测 import 非 'vue' 的语句
const EXTERNAL_IMPORT_RE = /import\s+(?:[^'"]*\s+from\s+)?['"](?!vue['"])([^'"]+)['"]/g

export function compileSfc(source: string): { html: string } {
  const { descriptor, errors } = parse(source, { filename: 'SandboxPreview.vue' })
  if (errors.length) {
    const first = errors[0]
    throw new Error(`SFC 解析失败: ${typeof first === 'string' ? first : first.message}`)
  }
  if (!descriptor.script && !descriptor.scriptSetup) {
    throw new Error('组件必须包含 <script> 或 <script setup>')
  }

  // 1) 脚本编译（含 <script setup> 转换）；TS 由 Sucrase 剥离
  const script = compileScript(descriptor, { id: 'sandbox' })
  let scriptContent = transform(script.content, { transforms: ['typescript'] }).code

  // 2) 外部依赖检测（首版仅支持纯 Vue 组件）
  const external = [...scriptContent.matchAll(EXTERNAL_IMPORT_RE)].map((m) => m[1])
  if (external.length) {
    throw new Error(`首版沙箱仅支持纯 Vue 组件，检测到外部依赖: ${external.join(', ')}`)
  }

  // 3) 模板编译为 render 函数
  let renderContent = ''
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: 'SandboxPreview.vue',
      id: 'sandbox',
    })
    if (template.errors.length) {
      const first = template.errors[0]
      throw new Error(`模板编译失败: ${typeof first === 'string' ? first : first.message ?? 'unknown'}`)
    }
    renderContent = template.code
  }

  // 4) 样式
  const css = descriptor.styles.map((s) => s.content).join('\n')

  // 5) 组装模块：脚本（含 __sfc__ + export default） + render 函数 + 挂载
  const moduleCode = [
    scriptContent,
    renderContent,
    '__sfc__.render = render',
    "import { createApp } from 'vue'",
    "createApp(__sfc__).mount('#app')",
    "window.addEventListener('error', (e) => parent.postMessage({ type: 'sandbox-error', message: e.message }, '*'))",
  ].join('\n')

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<script type="importmap">{"imports":{"vue":"${VUE_CDN}"}}</script>
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<script type="module">
${moduleCode}
</script>
</body>
</html>`

  return { html }
}
