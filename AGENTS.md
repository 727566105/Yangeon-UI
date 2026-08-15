# AGENTS.md — Yzen-UI 工作区指引

## 项目是什么

**Yzen-UI**：AI 科技风个人组件库（Vue 3 + TS + SCSS + CSS Variables，pnpm monorepo），展示站**忠实复刻 beautifului.dev**（视觉 token 实测自其线上 CSS，19 个 AI 组件移植自其开源组件）。展示站样式与交互细节以 beautifului.dev 为对齐基准。

## 目录结构

```
packages/yzen-ui/    # 组件库（npm 包名 yzen-ui，25 个组件：6 basic + 19 AI）
  src/theme/         # tokens-light.scss（浅色默认）/ tokens-dark.scss（html[data-theme="dark"]）
  src/styles/        # variables.scss（$yz-* 映射层）/ animations.scss（全局 keyframes）/ base.scss
  src/components/    # 每组件目录：<Name>.vue + index.ts + demo.vue + __tests__/<Name>.spec.ts
apps/showcase/       # 展示站（Vite 应用）：锚点导航/registry 驱动区块/变体切换/复制+查看代码
registry/registry.json  # 组件元信息单一真源（name/desc/category/variants），Console V1.1 将接管
docs/                # PRD-v2.0.md（产品需求）、research/（可行性报告）、superpowers/plans/（实施计划）
```

## 常用命令

```bash
pnpm install             # 安装依赖（pnpm 10，workspace）
pnpm dev:showcase        # 展示站 dev（http://localhost:5173）
pnpm test                # 全量测试（yzen-ui 129 + showcase 6）
pnpm -F yzen-ui test -- src/components/<key>   # 单组件测试
pnpm build:yzen-ui       # 组件库构建（ESM + CSS + dist/types）
pnpm build:showcase      # 展示站构建
```

## 架构边界与规则

- **命名**：组件 `YzXxx`；CSS 类 `yz-xxx`；CSS 变量 `--yz-xxx`；SCSS 映射 `$yz-xxx`
- **视觉铁律**：所有颜色/阴影/圆角/动效必须用 `--yz-*` 变量（浅色默认对齐 beautifului 实测 token，禁止硬编码色值）。**SCSS 映射层 variables.scss 只定义部分 `$yz-*`——引用前先查映射，缺失的用 `var(--yz-*)` 直写**（否则 sass 编译失败，vitest 不编译样式测不出）
- **组件四文件模式**：`<Name>.vue`（props/emits 全 TS 类型）+ `index.ts`（Yz 前缀命名导出）+ `demo.vue`（接收 `variantIndex`/`variants` props + active computed + `v-bind`）+ `__tests__/*.spec.ts`（3-5 项冒烟）
- **demo.vue 禁止 import 包名**（循环引用），一律相对路径 `'../../index'`
- **动画**：用全局 `animations.scss` 的 `yz-*` keyframes；所有动效加 `@media (prefers-reduced-motion: reduce)` 降级
- **受控组件铁律**：内部修改状态后必须同步 `emit('update:xxx')`；折叠动画 `grid-template-rows 0fr/1fr` + transition 常驻基础类（防瞬跳）
- **间距/数值与源像素级一致**（对照 beautifului HTML 的 gap-*/px-*/size-*）；空数据/边界必须有守卫

## 已知陷阱（重要）

- **dev server 的 `import.meta.glob` 有 transform 缓存**：新增组件目录/demo.vue 后必须**重启 dev server** 才能被 glob 扫到（Vite 不监视 glob 模式新增文件）
- **glob loader 必须 `defineAsyncComponent` 包装**再传给 `<component :is>`——直接传 loader 函数会被当函数式组件调用，渲染成 `[object Promise]`（apps/showcase/src/components/ComponentSection.vue 有回归测试）
- showcase 的 vite alias：`yzen-ui → packages/yzen-ui/src/index.ts`（dev 直连源码热更新；vitest.config.ts 同款 alias）
- `tsconfig.build.json` exclude `__tests__` 与 `demo.vue`（demo 的 `v-bind` 会触发必需 prop 类型错误，属预期）
- 本地 git 仓库无 remote；开发直接在 main 分支

## 文档

改动视觉/组件前先读 `docs/PRD-v2.0.md` 第 4 节（视觉规范 token 表）；实施流程参考 `docs/superpowers/plans/2026-08-14-yzen-ui-v1.0.md`；组件移植规范在 `.superpowers/sdd/bui-ports/spec.md`（Tailwind→token 映射表）。
