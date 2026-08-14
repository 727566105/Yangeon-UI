# Yzen-UI（阳核组件库）

> Build AI-native interfaces — 面向AI时代的轻量化科技组件基座

专属 Yangzai 的 AI 科技风个人组件库与组件工作台，展示站样式与 [beautifului.dev](https://www.beautifului.dev/) 保持一致（浅色默认 + 深色可切换主题）。

## 产品形态：一库双端

```
组件库 yzen-ui —— 手工精心制作的 AI 科技风 Vue 组件（核心资产）
        │
        ├── Showcase 展示站 —— 长滚动锚点布局 / 实时交互预览 / 变体切换 / 复制代码
        │
        └── Console 管理端 —— 组件收录 / 元信息管理 / 预览检查 / 展示配置

Registry 数据层 —— Console 写入、Showcase 读取的组件注册表
```

## 技术栈

Vue 3 · TypeScript · Vite · SCSS + CSS Variables · pnpm monorepo

## 文档

| 文档 | 说明 |
| --- | --- |
| [PRD V2.0](docs/PRD-v2.0.md) | 产品需求文档：定位、视觉规范、组件规划、双端需求、迭代计划 |
| [可行性研究报告](docs/research/2026-08-14-feasibility-study.md) | 三条技术链路的可行性论证、架构建议、分阶段 PoC 验证点 |

## 当前状态

🚧 **V1.0 开发中** — monorepo + 双主题 token + 六基础组件 + Showcase 骨架已完成。

## 快速启动

```bash
pnpm install
pnpm dev:showcase   # 启动展示站（http://localhost:5173）
pnpm test           # 运行全部测试
pnpm build:showcase # 构建展示站
```

## 开发指引（占位）

按 PRD 迭代计划，首个开发里程碑为 **V1.0**：monorepo 搭建 + 设计 token + 六个基础组件 + Showcase 骨架。实施前请先阅读可行性研究报告第 7 节的分阶段路线图与 PoC 验证点。

## License

MIT（规划中）
