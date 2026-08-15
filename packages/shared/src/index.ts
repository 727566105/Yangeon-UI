// @yzen-ui/shared —— 双端共享的 Registry 契约层（PRD 9.3）：
// 类型、校验、组件映射、demo 预览容器。以源码形式被 showcase/console 通过 vite alias 消费。
export type { LocalizedText, Variant, RegistryEntry, RegistryJson, RegistryCategory, CategoriesJson, Platform, PlatformsJson } from './types'
export { validateRegistry, validateCategories, validatePlatforms } from './validate'
export { buildComponentMap } from './componentMap'
export type { ComponentMap } from './componentMap'
export { demoLoaders, demoGlobKey } from './demos'
export { default as DemoStage } from './DemoStage.vue'
