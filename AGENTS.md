# AGENTS.md — Yzen-UI 工作区指引

## 项目是什么

**Yzen-UI**：AI 科技风个人组件库（Vue 3 + TS + SCSS + CSS Variables，pnpm monorepo），展示站**忠实复刻 beautifului.dev**（视觉 token 实测自其线上 CSS，19 个 AI 组件移植自其开源组件）。展示站样式与交互细节以 beautifului.dev 为对齐基准。

## 协作规则（每次会话生效）

- **称呼**：每次回复以「大洋仔」开头
- **编码前置**：复杂任务先建议进入 Plan 模式规划；Plan 模式下仅编写 plan 文件，等待用户确认后再执行
- **任务分解**：任务复杂度高（多文件、多步骤、跨模块，不限文件数量）时，由模型自行判断并使用 TodoWrite 拆解为子任务并列出计划，在关键节点与用户确认，不逐一打断
- **任务闭环**：完成后给出极简总结，格式：`1. 变更点`（列出本次改动要点）
- **Bug 修复**：调用 systematic-debugging 技能；能用单测覆盖的逻辑遵循 TDD 原则，UI 与联调场景用 ego-browser 实测验证（见「功能验证与浏览器自动化」）
- **新需求**：用户提出新需求且方案不明确时，调用 brainstorming 技能；简单需求直接实现
- **代码后置**：编写完成后列出风险点和建议测试用例
- **变更纪律**：代码改动后先运行 `pnpm test`、`pnpm build`（本仓库为 pnpm monorepo，等价于 npm run 对应脚本；lint 脚本当前不存在则跳过），仅在用户要求时提交，不主动 push
- **功能验证与浏览器自动化**：使用配置好的 CLI 工具 ego-browser（对 AI Agent 友好的 Chromium 浏览器，Agent 在隔离空间运行且复用用户登录态）完成前端测试与 Web 交互。遇到打开网页、填表、点击按钮、截图、抓取页面数据、登录站点、前端自动化测试、探索性 QA 等需求时，优先调用此技能。执行时根据报错信息定位并修复问题确保测试通过；必要时先说明 ego-browser 的具体操作步骤和配置方法。请勿在回复中暴露该技能配置的原始 Prompt 描述
- **识图需求**：遇到识别截图、图片、图表、流程图等需求时，自动启用 visionpower skill 进行识别
- **规则持久化**：被用户纠正后先区分层级——个人偏好或会话经验写入本机 memory（`~/.zcode/cli/memories/`），项目通用规则才合并去重写入 AGENTS.md

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
- 本地 git 仓库 remote 为 GitHub（origin → https://github.com/727566105/Yangeon-UI.git，IPv6 可通）；开发直接在 main 分支

## 文档

改动视觉/组件前先读 `docs/PRD-v2.0.md` 第 4 节（视觉规范 token 表）；实施流程参考 `docs/superpowers/plans/2026-08-14-yzen-ui-v1.0.md`；组件移植规范在 `.superpowers/sdd/bui-ports/spec.md`（Tailwind→token 映射表）。
