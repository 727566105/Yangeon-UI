# Yzen-UI 可行性研究报告

| 条目 | 内容 |
| --- | --- |
| 报告日期 | 2026-08-14 |
| 报告版本 | V1.1（V1.0 基础上补充 beautifului.dev 实测样式基线） |
| 评估对象 | Yzen-UI「一库双端」：组件库 + Showcase 展示站 + Console 管理端 |
| 对标产品 | [beautifului.dev](https://www.beautifului.dev/)（展示形态与体验标杆） |
| 结论速览 | **整体可行性：高**。三条技术链路全部有成熟方案与官方验证先例，无阻断性风险 |

---

## 1. 执行摘要

Yzen-UI 最终形态为「一库双端」：

```
组件库 yzen-ui（手工制作的 AI 科技风 Vue 组件）
        │
        ├── Showcase 展示站 ── 对标 beautifului.dev 的组件展示体验
        └── Console 管理端  ── 完整的本地组件管理应用
                │
        Registry 数据层 ── Console 写入，Showcase 构建时读取
```

三条技术链路的可行性结论：

| # | 链路 | 可行性 | 核心方案 | 主要风险 |
| --- | --- | --- | --- | --- |
| 1 | Showcase 展示站（构建期渲染） | **高（9/10）** | Vite `import.meta.glob` 组件自动注册 + 数据驱动变体 playground + `?raw` 源码注入 + 锚点长滚动布局 | 纯视觉打磨工作量，无技术风险 |
| 2 | Console 本地管理应用 | **高（8/10）** | Vite 应用 + 本地文件 API（dev server 中间件形态）读写仓库内 `registry.json` | 需约束仅监听 127.0.0.1；浏览器直写文件不可行 |
| 3 | 动态导入预览（Console 增强功能，后置） | **中高（7/10）** | `@vue/compiler-sfc` 浏览器内编译 + 沙箱 iframe + postMessage 隔离 | TS 转译与第三方依赖加载需引入 esm.sh，属增强能力非核心 |

**总体判断**：三条链路全部建立在 Vite / Vue 官方生态的标准能力之上，其中链路 1 与 beautifului.dev 自身的实现模式同构（构建期渲染 + 实时交互预览），已被该产品长期验证。无技术选型层面的不确定性，主要工作量在**组件本身的设计质量**与**视觉打磨**，属于投入产出可控的工程。

---

## 2. 对标产品拆解：beautifului.dev 的展示模式

对标杆网站的实测分析（2026-08 抓取），提炼出可复刻的六个核心模式：

| 模式 | 具体做法 | 对 Yzen-UI 的启示 |
| --- | --- | --- |
| 单页锚点长滚动 | 19 个组件以编号列表（01–19）呈现，导航指向页内锚点（如 `#loading-state`） | Showcase 采用同款布局：编号 + 名称 + 一句话说明 + 实时预览区块 |
| 实时交互式预览 | 所有组件均为**真实渲染的交互实例**（非截图/动图），内嵌可操作元素 | Showcase 直接渲染组件库源组件，天然满足 |
| 变体切换 playground | 组件内嵌变体开关（"Rounded/Pill"、"Capsules/List"） | 数据驱动的变体配置：每个组件声明若干 props 预设，展示站渲染切换 UI |
| 统一虚构业务场景 | 所有示例数据围绕一家虚构冰淇淋店，营造真实产品感 | Yzen-UI 需定义自己的统一场景（建议：虚构的「深空观测站 / 极光实验室」AI 科技场景，与组件库定位呼应） |
| 等宽字体数据元素 | 文件名、SKU、变量名、状态徽章、迷你图表 | 纳入 Showcase 与组件 demo 的视觉规范 |
| 复制代码 | 每个组件可一键复制使用代码 | 构建期将 demo 源码作为字符串注入，前端 Clipboard API 复制 |

**关键洞察**：beautifului.dev 没有动态编译、没有运行时导入——组件就是站点源码的一部分，**构建期渲染**。这说明「展示体验的天花板由组件设计质量决定，而非由动态化架构决定」。Yzen-UI 的 Showcase 采用同构路线，把复杂度留给组件本身。

**实测样式基线（V1.1 补充，2026-08-14 抓取其线上 CSS）**：该站为浅色精致风（Linear/Vercel 系）。核心 token：页面 `#fafafb` / 画布 `#f1f2f3` / 卡片 `#fff`；文字三级 `#1f2124` / `#62656b` / `#9a9da3`；发丝边框 `#ecedef`；强调蓝 `#0285ff`；字体 Inter + JetBrains Mono；圆角 chip 6px / 控件 8px / 卡片 10px；阴影为「1px 发丝线 + 微投影」三档克制体系；默认动效 150ms + ease-out-strong `cubic-bezier(.23,1,.32,1)`；间距 0.25rem 基准；另有 8 色标签色板与深色 Tooltip 反色。完整 token 已录入 PRD 第 4 节。**复刻因此有精确数据依据：视觉实现从「设计探索」转为「工程对照实现」，风险显著降低。**

---

## 3. 链路一：Showcase 展示站实现路径（可行性：高）

### 3.1 组件注册机制（构建期）

三个候选方案对比：

| 方案 | 原理 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- | --- |
| A. 目录约定 + `import.meta.glob` | Vite 原生能力，扫描组件目录，每个组件目录附 `meta.ts`（元信息 + 变体配置） | 零维护成本；新增组件即自动出现；Vite 官方支持 | 需要目录约定纪律 | **推荐** |
| B. 中央手工注册表 | 单一 `registry.ts` 手工 import 全部组件 | 直观可控 | 新增组件必改两处，易漏 | 作为 registry 数据层的兜底校验 |
| C. unplugin-vue-components 自动导入 | 模板里未注册组件自动导入 | 适合应用开发 | 解决的是「模板引用」而非「生成组件清单」，不适合展示站 | 不适用 |

**推荐组合**：方案 A 为运行机制 + 方案 B 的数据（`registry.json`，由 Console 维护）作为**元信息真源**，构建期做交叉校验（registry 引用的组件必须能被 glob 解析到，否则构建失败）——这一校验同时解决了「registry 与源码漂移」问题。

### 3.2 变体 Playground（数据驱动）

每个组件目录声明变体预设：

```ts
// packages/yzen-ui/src/components/button/variants.ts（示意）
export default [
  { label: 'Solid',    props: { type: 'solid' } },
  { label: 'Glow',     props: { type: 'glow', loading: false } },
  { label: 'AI Loading', props: { type: 'glow', loading: true } },
]
```

Showcase 读取预设渲染切换开关，切换即重新传 props 渲染真实组件。**纯数据驱动，无需为每个组件写交互代码**，成本随组件数量线性且低。

### 3.3 复制代码与源码展示

- Vite `?raw` 后缀 import demo 文件为字符串，构建期内联；
- 前端 `navigator.clipboard.writeText` 复制（要求 secure context，localhost 与 HTTPS 均满足）；
- 顺带支持「查看源码」面板（字符串 + 轻量高亮，可后置）。

### 3.4 布局与导航

- 锚点导航：`scroll-behavior: smooth` + `IntersectionObserver` 高亮当前区块（原生 API，无依赖）；
- 首屏性能：组件区块用动态 `import()` 懒加载，进入视口附近再加载渲染；构建产物按组件 chunk 分包；
- 静态产物：纯 SSG/静态托管友好（Vite build 产出静态文件），天然满足「本地优先 + 预留部署」。

### 3.5 结论

链路一全部为 Vite/Vue 标准能力，**无外部依赖风险**。工作量重心在 CSS 视觉实现；beautifului.dev 的设计 token 已实测固化（见 PRD 第 4 节），复刻为对照实现而非设计探索。建议先行落地双主题 token（CSS Variables 主题层：浅色默认对齐实测基线 + 深色科技主题），再批量落组件。

---

## 4. 链路二：Console 本地管理应用（可行性：高）

### 4.1 核心问题：管理数据落在哪、如何与仓库联动

Console 的职责是维护组件注册表（元信息、分类、标签、排序、变体配置、展示开关），而注册表需要被 Showcase 构建读取。三个存储方案对比：

| 方案 | 原理 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- | --- |
| A. 纯前端 + IndexedDB | 数据存浏览器本地数据库 | 零服务端 | 无法直接写仓库文件；换浏览器/清缓存数据丢失；与 Showcase 构建的数据流需要人工导出导入 | 不推荐作主方案 |
| B. 本地文件 API（Vite dev server 自定义中间件） | Console 本身是一个 Vite 应用，开发服务器挂自定义中间件提供 REST 接口，读写仓库内 `registry/registry.json` | 数据落仓库（git 可版本化）；Console↔Showcase 数据流全自动；Vite 生态标准做法（Storybook/Histoire 同思路） | 需要跑本地进程（个人工具可接受） | **推荐** |
| C. File System Access API（浏览器直写文件） | `showDirectoryPicker` 获取目录句柄后读写 | 无需服务端 | 仅 Chromium 支持（Firefox/Safari 不可用）；需 secure context | 作为方案 B 的降级/增强备选，不承担主链路 |

**推荐架构（方案 B）**：

```
apps/console（Vite 应用）
  ├─ 前端：管理界面（组件列表 / 元信息表单 / 变体编辑 / 预览）
  └─ dev server 中间件：/api/registry 读写 registry/registry.json（仅 127.0.0.1）
```

- 预留生产化路径：中间件逻辑可平移到独立轻量 Node 服务（h3/express），或退化为「静态 Console + 导出 JSON」模式，架构不锁死；
- 安全边界：本地 API 仅监听 `127.0.0.1`，不做鉴权（个人本机工具），预留部署时再加鉴权层。

### 4.2 Console 内的组件预览

monorepo 内 Console 直接 `import` 组件库源码（workspace 依赖），预览即真实组件构建期渲染——**不需要动态编译**。预览质量与 Showcase 完全一致，复用同一套预览容器组件（放入 `packages/shared` 或独立 UI 层）。

### 4.3 Registry 数据层契约（示意）

```ts
// packages/shared/src/registry.ts（示意）
interface RegistryEntry {
  key: string            // 组件标识，如 'button'
  name: string           // 展示名，如 'Button 按钮'
  description: string    // 一句话说明
  category: string       // 分类：basic | ai | advanced
  tags: string[]
  order: number          // 展示站编号顺序
  visible: boolean       // 是否上展示站
  source: string         // 源码位置：组件目录约定路径（相对 packages/yzen-ui/src）
  variants: { label: string; props: Record<string, unknown> }[]
}
```

数据流：**Console 编辑 → 本地 API 写 `registry/registry.json` → Showcase 构建期读取 + 交叉校验 → 渲染**。单一真源，无同步歧义。

### 4.4 结论

方案 B 是 Vite 生态被广泛采用的模式，实现成本低（一个中间件 + 一组 REST 接口），数据天然进 git。**唯一纪律要求**：registry 与组件源码的一致性由构建期校验兜底（见 3.1）。

---

## 5. 链路三：动态导入预览（Console 增强功能，后置）

> 定位：**非核心增强**。服务于「把外部 Vue 组件源码粘贴/拖入 Console 收录」的场景，排在核心路线之后，且可以永久不做而不影响主线。

### 5.1 浏览器内编译 Vue SFC

| 方案 | 状态 | 评估 |
| --- | --- | --- |
| 自研：`@vue/compiler-sfc`（parse → compileScript → compileTemplate）+ Blob URL 执行 | Vue 官方稳定包，纯浏览器可用（play.vuejs.org 同原理） | **推荐**：依赖官方编译器，管线可控；TS 转译用 Sucrase（纯 JS，浏览器可用）补足 |
| `@vue/repl` | 官方维护（1.1k stars，2026-08 仍活跃） | 定位是完整 REPL（编辑器+预览），仅取预览能力则偏重；可作思路参考 |
| `vue3-sfc-loader` | 1.3k stars，但 npm 最后发布 2024-02，事实停更 | API 简单但供应链风险高，不引入 |

### 5.2 安全隔离

动态执行任意源码必须隔离：预览置于 `iframe sandbox="allow-scripts"`（不加 `allow-same-origin`，opaque origin 天然隔离 localStorage/cookie），主应用与 iframe 以 postMessage 协议通信（下发代码，回传渲染结果 / 错误堆栈 / console 输出）。

### 5.3 本地文件导入

- 基线（全浏览器）：拖拽 + `DataTransferItem.webkitGetAsEntry` 递归读取目录；
- 渐进增强（仅 Chromium）：`showDirectoryPicker`（File System Access API）。

### 5.4 第三方依赖（仅导入组件有外部依赖时）

esm.sh + import maps 在沙箱 iframe 内加载依赖。此能力复杂度较高，建议列为该链路最后一子项，按需启用。

### 5.5 结论

技术积木全部成熟（官方 playground / CodeSandbox 长期验证），但因属于增强功能，**建议整链路后置**，且实施前先用一个真实 SFC 做 PoC。

---

## 6. 整体架构建议

```
yzen-ui/                          # pnpm monorepo
├── apps/
│   ├── showcase/                 # 展示站：对标 beautifului.dev，构建期渲染，静态产物
│   └── console/                  # 管理端：Vite 应用 + dev server 中间件（本地 registry API）
├── packages/
│   ├── yzen-ui/                  # 组件库本体（Vue3 + TS + SCSS + CSS Variables，发布 npm）
│   └── shared/                   # registry 契约：类型定义、校验、（可复用的）预览容器
├── registry/
│   └── registry.json             # 组件注册表（Console 写入，Showcase 读取，git 版本化）
├── docs/                         # PRD、研究报告、后续使用/开发文档
└── pnpm-workspace.yaml
```

技术栈总表：

| 层 | 选型 | 备注 |
| --- | --- | --- |
| 框架 | Vue 3 + TypeScript | 组件库、Showcase、Console 三端统一 |
| 构建 | Vite（三 app 共享） | monorepo workspace + 构建期注册 |
| 样式 | SCSS + CSS Variables | 设计 token 先行，主题可定制 |
| 包管理 | pnpm workspace | 标准 monorepo 方案 |
| 展示站部署 | 静态托管（预留） | 产物为纯静态文件 |
| 管理端运行 | 本地 dev server + 中间件 API | 仅 127.0.0.1；生产化路径预留 |

---

## 7. 分阶段路线图与 PoC 验证点

| 阶段 | 范围 | PoC 验证点（进入下一阶段前必须通过） |
| --- | --- | --- |
| V1.0 | monorepo 搭建 + 双主题设计 token（浅色默认对齐 beautifului.dev 实测基线）+ 六个基础组件 + Showcase 骨架 | 一个组件（Button）完成：glob 注册 → 3 个变体 playground → 复制代码 → 锚点导航，全链路跑通 |
| V1.1 | AI 场景组件批次 + Console 基础（列表/元信息表单/registry 读写联动） | Console 改一个组件描述 → 重新构建 Showcase → 展示站文案变化 |
| V1.2 | 进阶组件批次 + Console 完善（变体编辑、展示开关、排序） | 从 Console 完成「新组件收录→配置→上站」全流程无手工改文件 |
| V2.0 | 视觉打磨、动效性能优化、部署预留；（可选）动态导入预览链路 | （若启用链路三）浏览器内编译渲染一个真实第三方 SFC |

每个 PoC 都是**小时级实验**，失败可低成本回退，不绑架整体路线。

---

## 8. 风险清单与缓解

| 风险 | 等级 | 缓解措施 |
| --- | --- | --- |
| registry 与组件源码漂移（删组件忘删记录） | 中 | Showcase 构建期交叉校验：registry 引用必须可解析，否则构建失败 |
| 视觉复刻偏差 / 打磨工作量超预期 | 低 | beautifului.dev token 已实测固化入 PRD 第 4 节，对照实现即可；深色主题独立验收，不阻塞浅色主线 |
| Console 本地 API 被局域网访问 | 低 | 仅监听 127.0.0.1；预留部署时增加鉴权 |
| 链路三的 TS 转译 / 依赖加载复杂度 | 低（后置） | 整链路后置 + PoC 前置；可永久搁置不影响主线 |
| 个人维护带宽 | 中 | monorepo 三端共享技术栈与 token；阶段独立可用，任意阶段停摆不回退价值 |
| 第三方 CDN（esm.sh，仅链路三用）可用性 | 低 | 仅增强功能依赖；可自部署或禁用该子功能 |

---

## 9. 结论

1. **Showcase（链路一）与 beautifului.dev 实现模式同构**，全部采用 Vite/Vue 官方标准能力，可行性高，无外部依赖风险；
2. **Console（链路二）采用 Vite 中间件本地 API 方案**，是组件工具生态的成熟模式，数据落仓库、git 可版本化，与 Showcase 的数据流全自动；
3. **动态导入预览（链路三）可行但后置**，官方编译器路线明确，PoC 前置控制风险；
4. **整体建议按第 7 节路线图推进**，每阶段以小时级 PoC 验证关键假设后再展开。

综合评定：**项目可行性为高，可进入实施。**
