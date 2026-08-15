# Yzen-UI（阳核组件库）

> Build AI-native interfaces — 面向AI时代的轻量化科技组件基座

专属 Yangzai 的 AI 科技风个人组件库与组件工作台，展示站样式与 [beautifului.dev](https://www.beautifului.dev/) 保持一致（浅色默认 + 深色可切换主题，中英文双语）。

## 产品形态：一库双端

```
组件库 yzen-ui —— 手工精心制作的 AI 科技风 Vue 组件（核心资产，25 个组件）
        │
        ├── Showcase 展示站 —— 长滚动锚点布局 / 实时交互预览 / 变体切换 / 复制代码 / 中英文切换
        │
        └── Console 管理端 —— 组件收录 / 元信息管理 / 预览检查 / 展示配置（本地 Web 应用）

Registry 数据层 —— Console 写入、Showcase 读取的组件注册表（双语文案随表维护）
```

## 技术栈

Vue 3 · TypeScript · Vite · SCSS + CSS Variables · pnpm monorepo

## 文档

| 文档 | 说明 |
| --- | --- |
| [PRD V2.0](docs/PRD-v2.0.md) | 产品需求文档：定位、视觉规范、组件规划、双端需求、迭代计划 |
| [可行性研究报告](docs/research/2026-08-14-feasibility-study.md) | 三条技术链路的可行性论证、架构建议、分阶段 PoC 验证点 |

## 当前状态

✅ **V1.1 完成** — 组件库 25 个组件（6 基础 + 19 AI）、Showcase 全功能（beautifului 复刻 + 中英文切换）、Console 管理端（组件列表/元信息/变体编辑/实时预览/沙箱收录）。

## 快速启动

```bash
pnpm install
pnpm dev:showcase   # 启动展示站（http://localhost:5173）
pnpm dev:console    # 启动管理端（http://127.0.0.1:5174，本地 API 仅本机可访问）
pnpm test           # 运行全部测试（组件库 + 展示站 + 管理端 + 共享契约）
pnpm build:showcase # 构建展示站
pnpm build:console  # 构建管理端
```

## Console 管理端

本地组件管理应用，维护 `registry/registry.json`（组件元信息 + 双语文案），保存后 Showcase 构建/刷新即生效：

- **组件列表**：搜索、分类筛选、可见状态一览
- **分类管理**：分组可新增/改名/排序/删除（使用中禁删），展示站侧栏分组即时生效
- **元信息编辑**：中英文名称/描述/标签、分类、排序、展示开关
- **变体配置**：增删/排序/重命名变体，props 预设 JSON 编辑
- **实时预览**：与 Showcase 同一渲染路径（`@yzen-ui/shared` DemoStage），所见即所得
- **收录向导**：粘贴 Vue SFC 或拖入 `.vue` 文件 → 沙箱 iframe 预览（`sandbox="allow-scripts"` 隔离）→ 生成组件四文件 → 补全元信息上站

> 访问：本机 http://localhost:5174，局域网 http://<本机IP>:5174（监听 0.0.0.0）。
> 🔐 登录：默认密码 `yzenui`（启动日志有提醒）——通过环境变量 `YZ_CONSOLE_PASSWORD` 修改；
> 会话 token 存浏览器 localStorage，刷新免登录；所有 /api 写接口均需登录（401 自动回落登录页）。
> ⚠️ 安全：密码鉴权面向局域网可信网络；公共 WiFi/公网请勿开启；写盘前服务端校验 + 原子写入。

## 在项目中使用组件库

```bash
pnpm add yzen-ui
```

```ts
// main.ts —— 引入组件库样式（全部设计 token 与动画）
import 'yzen-ui/style.css'
```

```vue
<script setup lang="ts">
import { YzButton } from 'yzen-ui'
</script>
<template>
  <YzButton>Send</YzButton>
</template>
```

深色主题：在 `<html>` 设置 `data-theme="dark"` 即自动切换。

## License

MIT（规划中）
