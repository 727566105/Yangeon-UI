// 代码规范摘要（style-guide）：源自 AGENTS.md 架构规则 / PRD 视觉规范 / 组件四文件模式。
// 供 CLI `yz style-guide` 与 MCP `get_style_guide` 使用，引导 AI 产出符合组件库规范的代码。
export const STYLE_GUIDE = `# Yzen-UI 组件开发规范

## 命名
- 组件名：Yz 前缀 + PascalCase（如 YzButton、YzAILoading、YzSidebarNav）
- CSS 类：yz- 前缀 + BEM（如 yz-button__label、yz-button--solid）
- CSS 变量：--yz- 前缀（颜色/圆角/阴影/字体/动效一律使用 token，禁止硬编码色值）
- 目录约定：packages/yzen-ui/src/components/<key>/，key 为小写连字符（如 ai-loading）

## 组件四文件模式
每个组件目录包含：
- <Name>.vue —— 组件实现（props/emits 全 TS 类型，scoped 样式，纯 props/emits 驱动）
- index.ts —— 导出（export { default as Yz<Name> } from './<Name>.vue'）
- demo.vue —— 预览壳（variantIndex/variants props + active computed + v-bind）
- __tests__/<Name>.spec.ts —— 3-5 项冒烟测试

## 样式与动效
- 视觉铁律：颜色/阴影/圆角/动效必须用 --yz-* 变量（浅色默认对齐 beautifului 实测 token）
- 动画：用全局 animations.scss 的 yz-* keyframes（yz-pop-in/yz-fade-in/yz-spin 等），
  所有动效加 @media (prefers-reduced-motion: reduce) 降级
- 折叠动画：grid-template-rows 0fr/1fr + transition 常驻基础类

## 交互约束
- 受控组件铁律：内部修改状态后必须同步 emit('update:xxx')
- 空数据/边界必须有守卫（空态文案、空数组处理）

## 使用方式
- 安装：pnpm add yzen-ui，引入 import 'yzen-ui/style.css'（含全部 token 与动画）
- 深色主题：<html data-theme="dark"> 自动切换
- 中英文案：组件展示文案走 registry.json 双语字段（LocalizedText { zh, en }）`
