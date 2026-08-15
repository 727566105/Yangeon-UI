// demo 壳懒加载映射（构建期 glob，供 DemoStage 使用）。
// glob 路径相对本文件（packages/shared/src/）解析：../../yzen-ui/src/components/*/demo.vue
export const demoLoaders = import.meta.glob(
  '../../yzen-ui/src/components/*/demo.vue',
  { import: 'default' },
)

/** 取某个组件 key 的 demo 壳 loader 对应的 glob key（与 demoLoaders 的键一致） */
export function demoGlobKey(entryKey: string): string {
  return `../../yzen-ui/src/components/${entryKey}/demo.vue`
}
