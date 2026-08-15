# 组件库 CLI / MCP 接入可行性调研（开发消费型）

- 日期：2026-08-15（修订：定位澄清为「开发消费型」）
- 范围：Yzen-UI 组件库对外接入能力
- 结论：**可行性高（9/10）**——数据源（registry + 组件源码 + 设计 token）全部本地可读，CLI 与 MCP 为「薄壳 + 复用数据访问层」，无阻断性风险

## 0. 产品定位（2026-08-15 补充需求确认）

**目标不是管理端运维，而是开发消费**：

> 开发者（尤其是 Claude / Cursor 等 AI 编程工具）连接组件库后，开发时可直接调用组件库的
> **内容**（组件清单、源码、用法示例、变体）与**规范**（设计 token、命名约定、代码模式），
> 使 AI 生成的代码天然符合组件库风格与视觉规范。

- 消费主体：AI 编程工具（通过 MCP）+ 开发者终端（通过 CLI）
- 数据源：`registry/registry.json`（元信息）+ `packages/yzen-ui/src/components/*`（源码/demo）+ `packages/yzen-ui/src/theme/*.scss`（设计 token 规范）
- 管理能力（写 registry/收录）降级为**后置可选**，本期不做

### 0.1 规模约束（2026-08-15 补充：组件库将扩展到 100+ 组件）

设计必须面向 100+ 组件规模，核心原则：

1. **按需读取，禁止启动全量加载源码**：registry.json 元信息全量读（100 条 JSON ≈ 几十 KB，无压力）；组件源码/demo 必须按 key 懒读取（100+ 个 `.vue` 文件全量读是浪费且拖慢启动）
2. **工具返回精简，字段分级**：
   - `list_components` 返回**精简字段**（key/名称/分类/order/变体数，不含 description 全文）——100+ 条也只占 AI 上下文一小块
   - 详情类（get_component / get_component_source）按需返回全量
   - `list_components` 支持筛选参数（`category` / `keyword` / `limit`），避免 AI 被迫消费全量清单
3. **数据访问层 API 自带筛选/分页**：`listComponents({ category?, keyword?, limit? })` 在 core 层实现，CLI 与 MCP 共用同一过滤逻辑
4. **组件目录扫描用 readdir 懒枚举**（100+ 目录无压力），不做启动时索引缓存（除非实测需要）
5. **单测含规模用例**：生成 100+ 条 fake entry 验证 list/筛选/懒加载的正确性与耗时

### 0.2 动态项目感知（2026-08-15 补充：接入能力跟随组件库扩展，了解整个项目）

MCP/CLI 不是静态快照，而是**跟随项目实时变化、覆盖整个项目资产**的感知层：

1. **零缓存实时读取**：所有查询在调用时直接读文件系统——registry.json、组件目录、tokens、docs 每次调用都是最新状态。
   - CLI 每次执行即新进程，天然最新
   - MCP server 常驻，但 handler **不做启动快照/缓存**：新增组件/改元信息/更新规范后，下一次工具调用立即可见，**无需重启 MCP server**
2. **组件库扩展自动可见**：`listComponentKeys` 用 readdir 动态枚举（新组件目录一出现即可查）；组件源码按 key 实时读取——100+ 扩展过程中零配置
3. **覆盖整个项目资产**（不只组件）：
   - 组件：registry 元信息 + 源码/demo/变体（动态）
   - 规范：设计 token + style-guide + 项目文档（PRD / AGENTS.md / 调研文档，按需读取）
   - 结构：项目概览（apps/packages/registry/docs 布局，动态扫描）
4. **数据访问层定位升级为「项目感知层」**：`ProjectContext` 以仓库根为锚，按约定路径动态发现已知资产；新增资产类型时只需扩展该层，CLI/MCP 工具自动继承
5. **工具描述明确"实时反映当前项目状态"**，引导 AI 在不确定时先查询最新清单

## 1. 执行摘要

组件库的对外能力分三层：**数据源**（registry/组件源码/token 规范，本地文件即完整资产）、**数据访问层**（读取 + 结构化，需新建）、**接入形态**（MCP server / CLI）。

- MCP：官方 SDK 包一层只读 tools（组件查询/源码获取/token 规范），AI 工具直连本地 stdio
- CLI：`yz` 命令查组件/拉源码/导出 token，供脚本与开发者使用
- 两者共享同一「数据访问层」（registry 读取 + 组件文件读取 + token 解析），一并做最划算
- 不需要 dev server、不需要管理端鉴权（本地只读消费）

## 2. 现状盘点

### 2.0 消费型数据源（本调研核心资产）

| 数据源 | 路径 | 内容 | 消费形态 |
|---|---|---|---|
| 组件注册表 | `registry/registry.json` | 25 组件元信息（key/名称/描述/分类/标签/变体/双语） | 组件清单/详情/变体 |
| 组件实现 | `packages/yzen-ui/src/components/<key>/<Name>.vue` | 完整组件源码 | 源码获取/复刻 |
| demo 示例 | 同目录 `demo.vue` | 用法示例（薄壳 + 变体 props） | 用法参考 |
| 设计规范 | `packages/yzen-ui/src/theme/tokens-light.scss` 等 | `--yz-*` 变量（颜色/圆角/阴影/字体/动效）+ 动画 keyframes | 设计 token 查询 |
| 代码规范 | 组件目录模式 + AGENTS.md/PRD | Yz 命名/类名/四文件/动画约定 | style-guide 查询 |

数据全部为本地文件，读取即完整资产——**这是消费型接入零障碍的基础**。

### 2.1 管理端现状（背景：与消费型共享数据源，能力可后置复用）

| 能力 | 方法 | 说明 |
|---|---|---|
| 组件注册表读 | `readRegistry()` | 读 registry/registry.json |
| 组件注册表写 | `writeRegistry(entries)` | validateRegistry 校验 + 原子写（tmp+rename） |
| 组件目录列表 | `listComponentKeys()` | 扫 packages/yzen-ui/src/components |
| 组件收录 | `importComponent(key, source)` | 生成四文件（<Name>.vue + index.ts + demo.vue），**不自动写 registry** |
| 分类读/写 | `readCategories()` / `writeCategories()` | 使用中分类禁删 + 原子写 |
| 辅助 | `keyToComponentName` / `validateRegistry` / `validateCategories`（shared） | 命名与校验 |

### 2.2 HTTP 接口与鉴权模型（接入层）

- 8 个路由：login/logout/registry GET+PUT/components/import/categories GET+PUT
- 鉴权：单密码（`YZ_CONSOLE_PASSWORD`，默认 `yzenui`）→ 内存 `Set` 签发随机 token → 除 login 外全部 `Authorization: Bearer` 校验（401）
- **token 不可跨进程**（模块级内存 Set，dev server 重启失效）；鉴权仅存在于 HTTP 中间件层

### 2.3 可复用性结论

- **可直接复用（纯 Node 函数，无 HTTP/无鉴权耦合）**：`createRegistryApi` 全部 6 个方法、`keyToComponentName`、shared 全部类型与校验。运行时仅依赖 `node:fs/path/http` + shared 纯 TS 源码
- **HTTP 耦合部分**：中间件、鉴权层、Vite 插件（仅 dev server 生效，`vite preview`/静态产物无 API）

## 3. CLI 接入评估（开发消费型）

### 3.1 方案

`packages/cli`（命令 `yz`）：本地只读消费组件库资产，不依赖 dev server、不经过鉴权（本机文件访问即权限）。面向 100+ 组件：清单默认精简 + 筛选，详情按需。

```
yz components list [--category ai] [--keyword 加载] [--limit 20]   # 精简清单（key/名称/分类/变体数）
yz components list --full         # 全量字段（含描述/标签/变体）
yz components get <key>           # 组件详情（props/emits/变体/描述）
yz components get <key> --source  # 组件实现源码（<Name>.vue 全文，按需读取）
yz components get <key> --demo    # demo 用法示例源码
yz tokens [--json]                # 设计 token 导出（--yz-* 变量结构化）
yz style-guide                    # 规范摘要（命名/类名/动画/四文件模式）
yz init                           # 在目标项目生成《组件库接入指南》（含 token 引用方式）
```

### 3.2 改造点与缺口

| # | 缺口 | 影响 | 改造 |
|---|---|---|---|
| 1 | 无 bin/命令框架 | 新建 | commander/cac（轻量） |
| 2 | 无「数据访问层」（读 registry/组件文件/token） | 新建 | `packages/registry-core`：readRegistry（复用 shared 类型）+ readComponentSource/readDemoSource + parseTokens（从 tokens-light/dark.scss 提取 `--yz-*` 变量为结构化 JSON） |
| 3 | 仓库根发现 | 阻塞 | CLI `--root` 参数 + 向上查找 `pnpm-workspace.yaml`/package.json 兜底 |
| 4 | token 解析 | 新建 | 正则提取 tokens-light.scss 的 `--yz-*: value` 并分组（颜色/圆角/阴影/字体/动效） |
| 5 | shared 为 TS 源码导出 | 运行时需 TS | monorepo 内部用 tsx 运行最简 |

### 3.3 风险

- 只读为主，无写风险；`yz init` 生成文件为新增非破坏
- 消费型 CLI 不触碰管理端鉴权模型

## 4. MCP 接入评估（开发消费型）

### 4.1 方案

`packages/mcp-server`：官方 `@modelcontextprotocol/server`（v2 SDK）——`registerTool(name, { description, inputSchema }, handler)` + Zod/Standard Schema；传输 **stdio**（Claude Desktop/Cursor 本地直连，后置 Streamable HTTP）。

Tools 设计（**只读为主，AI 开发时查询组件库内容与规范；清单精简 + 筛选适配 100+ 规模；全部实时读取，跟随组件库扩展**）：

```
读（核心）：
  get_project_info           # 项目结构概览（apps/packages/registry/docs，动态扫描）
  list_components            # 精简清单（key/名称/分类/order/变体数），支持 category/keyword/limit 筛选
  get_component              # 组件详情（props/emits/变体/元信息全文）
  get_component_source       # 组件实现源码（AI 参考/复刻，按需读取）
  get_component_demo         # demo 用法示例
  get_variants               # 指定组件的变体配置（props 预设）
  get_design_tokens          # 设计 token（颜色/圆角/阴影/字体/动效分组）
  get_style_guide            # 代码规范（Yz 命名/yz-* 类名/动画约定/四文件模式）
  get_project_docs           # 项目文档（PRD / AGENTS.md 等，按需读取）
写（后置可选，本期不做）：
  update_component / create_component / delete_component   # 管理能力
```

### 4.2 改造点与缺口

| # | 缺口 | 影响 | 改造 |
|---|---|---|---|
| 1 | 无 MCP server 包 | 新建 | packages/mcp-server + `@modelcontextprotocol/server` + zod |
| 2 | 数据访问层（同 CLI） | 新建 | 与 CLI 共用 registry-core |
| 3 | 组件源码按需读取 | 新建 | readComponentSource 按 key 定位 `<Name>.vue`（index.ts 解析或目录扫描） |
| 4 | 规范查询结构化 | 新建 | parseTokens + style-guide 内容（来自 PRD 视觉规范/AGENTS.md 代码规则） |

### 4.3 风险

- 只读 tools 无数据风险；AI 拿到源码后自行复制使用，版权/规范一致性靠 style_guide 引导
- 后续开放写工具时复用管理端 validateRegistry 兜底（已在管理端验证）

## 5. 两种方式能力适配（开发消费型）

| 能力 | CLI（终端/脚本） | MCP（AI 编程工具） |
|---|---|---|
| 组件清单/详情查询 | ✅ `list --json` 供脚本 | ✅ list/get 供 AI 决策 |
| 组件源码/用法获取 | ✅ `get --source/--demo` | ✅ **get_component_source（AI 复刻/参考核心）** |
| 设计 token / 规范 | ✅ `tokens` / `style-guide` | ✅ **get_design_tokens / get_style_guide（AI 写码遵循规范）** |
| 变体配置 | ✅ `get --variants` | ✅ get_variants |
| 项目接入引导 | ✅ `yz init` 生成接入指南 | ➖（MCP 已覆盖查询，接入靠 style_guide） |
| 管理能力（写） | ⚠️ 后置 | ⚠️ 后置（开放时复用管理端校验） |

## 6. 结论与实施步骤

### 6.1 可行性判断

- **CLI：高（9/10）**——只读消费 + 数据访问层新建，无技术风险
- **MCP：高（9/10）**——官方 SDK 成熟，tools 为薄封装；AI 开发场景收益最直接（写代码时自动遵循组件库内容与规范）
- 两者共享同一「数据访问层」前置项，一并做最划算

### 6.2 初步方案

```
packages/registry-core（新）   ← 项目感知层（ProjectContext）：以仓库根为锚动态发现——
                                  listComponents({category?,keyword?,limit?})（精简字段）/
                                  getComponent / readComponentSource / readDemoSource /
                                  getProjectInfo（结构概览）/ parseTokens（--yz-* 结构化）/
                                  styleGuide / readDocs（docs/ 按需）
                                  依赖 packages/shared 类型与校验
                                  规模与动态：元信息全量读、源码按 key 懒读、零缓存实时反映项目最新状态

packages/cli（新）             ← 命令层（commander）+ 仓库根发现（--root / 向上查找）
packages/mcp-server（新）      ← @modelcontextprotocol/server + zod + 9 个只读 tools（清单工具带筛选）
```

### 6.3 实施步骤（批次）

1. **批次 1 · 项目感知层**：`packages/registry-core`（listComponents 精简+筛选 / getComponent / 源码/demo 懒读取 / projectInfo / token 解析 / style-guide / docs 读取）；单测含 **100+ 组件规模用例** + **动态性用例**（新增 fake 组件后再次查询立即可见，验证零缓存）
2. **批次 2 · CLI**：命令实现 + 单测 + 终端实测（list 筛选/get/tokens/style-guide/info/docs）
3. **批次 3 · MCP**：server + 9 个只读 tools + 单测（handler 直测）；用 MCP Inspector / 客户端实测（AI 查询组件 → 取源码 → 按 token 写代码；新增组件后无需重启即可查）
4. **批次 4 · 收尾**：README（Claude Desktop/Cursor 接入配置说明）；管理写工具列为后置

### 6.4 风险清单

| 风险 | 缓解 |
|---|---|
| 数据访问层新代码无现成测试 | temp-root 单测模式（console registryApi.spec 已验证） |
| token 解析正则脆弱 | 对 tokens-light.scss 全量断言（--yz-* 变量数 ≥ 80） |
| AI 拿到源码脱离规范 | style_guide 工具随源码一起引导（提示语含规范引用） |
| 只读能力覆盖不全 | 与 console 预览路径对照（同一数据源，字段一致） |
| MCP SDK 升级 | 跟随官方 v2（stdio 稳定） |
