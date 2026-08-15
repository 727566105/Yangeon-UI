# AGENTS.md — Yzen-UI 工作区指引

## 项目是什么

**Yzen-UI**：AI 科技风个人组件库（Vue 3 + TS + SCSS + CSS Variables，pnpm monorepo）。产品 = **组件库 + Showcase 展示站 + Console 管理端 + 开发消费接入（CLI/MCP）**：
- 展示站**忠实复刻 beautifului.dev**（视觉 token 实测自其线上 CSS，19 个 AI 组件移植自其开源组件），样式与交互细节以 beautifului.dev 为对齐基准，支持中英文切换
- Console 管理端：本地 Web 应用（密码登录，`YZ_CONSOLE_PASSWORD` 环境变量，默认 123456），维护组件注册表/分类/收录
- CLI（`yz` 命令）与 MCP（10 个只读 tools）：开发者与 AI 编程工具消费组件库内容与规范，零缓存实时跟随组件库扩展

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
packages/yzen-ui/          # 组件库（npm 包名 yzen-ui，26 个组件：6 basic + 20 AI）
  src/theme/               # tokens-light.scss（浅色默认）/ tokens-dark.scss（html[data-theme="dark"]）
  src/styles/              # variables.scss（$yz-* 映射层）/ animations.scss（全局 keyframes）/ base.scss
  src/components/          # 每组件目录：<Name>.vue + index.ts + demo.vue + __tests__/<Name>.spec.ts
packages/shared/           # 双端共享契约：类型 + validateRegistry/validateCategories + DemoStage 预览容器
packages/registry-core/    # 项目感知层（CLI/MCP 共用）：组件/源码/token/文档读取，零缓存实时
packages/cli/              # yz 命令（Node 22.18+ 原生 TS 直跑）：components/tokens/style-guide/info/docs/init
packages/mcp-server/       # MCP stdio server（10 个只读 tools，@modelcontextprotocol/server v2）
apps/showcase/             # 展示站（Vite 应用）：锚点导航/registry 驱动区块/变体切换/复制+查看代码/中英切换/平台（端）全局切换
apps/console/              # 管理端（Vite 应用 + dev server 中间件本地 API）：组件/分类/收录/沙箱预览/密码登录
registry/registry.json     # 组件注册表单一真源（双语文案：name/description/tags/variant label 为 {zh,en}；platform 字段引用平台 key）
registry/categories.json   # 分类清单（key + 双语 label + order，Console 可增删改排序）
registry/platforms.json    # 平台（端）清单（key + 双语 label + order，Console 可增删改排序，展示站全局切换）
docs/                      # PRD-v2.0.md（产品需求）、research/（可行性报告 + CLI/MCP 调研）、superpowers/plans/
```

## 常用命令

```bash
pnpm install             # 安装依赖（pnpm 10，workspace）
pnpm dev:showcase        # 展示站 dev（http://localhost:5173）
pnpm dev:console         # 管理端 dev（http://localhost:5174，本地 API 仅本机/局域网）
pnpm test                # 全量测试（七包 312：shared 22 + yzen-ui 136 + showcase 49 + console 58 + registry-core 22 + cli 14 + mcp 11）
pnpm -F yzen-ui test -- src/components/<key>   # 单组件测试
pnpm build:yzen-ui       # 组件库构建（ESM + CSS + dist/types）
pnpm build:showcase      # 展示站构建
pnpm build:console       # 管理端构建
node packages/cli/bin/yz.mjs <cmd>        # CLI 实测（components list/get、tokens、style-guide、info、docs、init）
node packages/mcp-server/bin/yz-mcp.mjs   # MCP stdio server（Claude Desktop/Cursor 接入）
```

## 架构边界与规则

- **命名**：组件 `YzXxx`；CSS 类 `yz-xxx`；CSS 变量 `--yz-xxx`；SCSS 映射 `$yz-xxx`
- **视觉铁律**：所有颜色/阴影/圆角/动效必须用 `--yz-*` 变量（浅色默认对齐 beautifului 实测 token，禁止硬编码色值）。**SCSS 映射层 variables.scss 只定义部分 `$yz-*`——引用前先查映射，缺失的用 `var(--yz-*)` 直写**（否则 sass 编译失败，vitest 不编译样式测不出）
- **组件四文件模式**：`<Name>.vue`（props/emits 全 TS 类型）+ `index.ts`（Yz 前缀命名导出）+ `demo.vue`（接收 `variantIndex`/`variants` props + active computed + `v-bind`）+ `__tests__/*.spec.ts`（3-5 项冒烟）
- **demo.vue 禁止 import 包名**（循环引用），一律相对路径 `'../../index'`；**Console 收录生成的新组件 demo 壳改为相对导入组件文件**（`import YzXxx from './Xxx.vue'`，根入口静态导出不含新组件）
- **动画**：用全局 `animations.scss` 的 `yz-*` keyframes；所有动效加 `@media (prefers-reduced-motion: reduce)` 降级
- **受控组件铁律**：内部修改状态后必须同步 `emit('update:xxx')`；折叠动画 `grid-template-rows 0fr/1fr` + transition 常驻基础类（防瞬跳）
- **间距/数值与源像素级一致**（对照 beautifului HTML 的 gap-*/px-*/size-*）；空数据/边界必须有守卫
- **registry 双语契约**：name/description/tags/variant label 为 `{zh,en}` 结构，Console 编辑、展示站/CLI/MCP 读取；validateRegistry 校验双语非空 + platform 必须存在于 platforms.json（validatePlatforms 校验平台表本身）
- **七包依赖方向**：yzen-ui（组件）→ shared（契约）→ registry-core（感知层）→ cli/mcp-server（消费）；console/showcase 消费 shared + yzen-ui。registry-core/shared 内部相对导入必须带 `.ts` 扩展（Node type stripping 要求，tsconfig 已开 allowImportingTsExtensions）
- **Console 鉴权**：API 除 /api/login 外全部要求 Bearer token（内存 Set，dev 重启失效）；密码 `YZ_CONSOLE_PASSWORD`（默认 123456 启动有警告）

## 已知陷阱（重要）

- **dev server 的 `import.meta.glob` 有 transform 缓存**：新增组件目录/demo.vue 后必须**重启 dev server** 才能被 glob 扫到（Vite 不监视 glob 模式新增文件）；Console 收录组件后展示站需重启才能显示
- **glob loader 必须 `defineAsyncComponent` 包装**再传给 `<component :is>`——直接传 loader 函数会被当函数式组件调用，渲染成 `[object Promise]`（DemoStage 有回归测试；其测试轮询上限 8s 防冷启动超时）
- **console dev server 中间件（server/registryApi.ts）改动需重启 dev server**（configureServer 启动时加载，不热更）；前端改动 HMR 正常
- **structuredClone 无法克隆 Vue 响应式代理**：console 编辑页深拷贝用 `JSON.parse(JSON.stringify(entry))`
- **正则 str.match 带 g flag 无捕获组**：registry-core 的 token 解析（GROUP_RE/TOKEN_RE）不能加 g（有注释说明）
- showcase 的 vite alias：`yzen-ui → packages/yzen-ui/src/index.ts`；console 的 alias 数组形式（shared 子路径精确映射在前，防前缀误吞）；vitest.config 同款
- **Node 26 实验性 localStorage 会遮蔽 happy-dom 实现**：需要 test-setup.ts 内存垫片（console/showcase 已有）
- `tsconfig.build.json` exclude `__tests__` 与 `demo.vue`（demo 的 `v-bind` 会触发必需 prop 类型错误，属预期）
- **CLI/MCP 依赖 Node ≥22.18**（原生 TS type stripping 直跑 src 源码，无构建产物）
- 本地 git 仓库 remote 为 GitHub（origin → https://github.com/727566105/Yangeon-UI.git，IPv6 可通）；开发直接在 main 分支

## 文档

改动视觉/组件前先读 `docs/PRD-v2.0.md` 第 4 节（视觉规范 token 表）+ 第 5.2 节（registry 双语契约）；CLI/MCP 设计背景在 `docs/research/2026-08-15-cli-mcp-feasibility.md`；实施流程参考 `docs/superpowers/plans/2026-08-14-yzen-ui-v1.0.md`；组件移植规范在 `.superpowers/sdd/bui-ports/spec.md`（Tailwind→token 映射表）。
