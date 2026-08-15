// 中文文案（默认语言）。
// 本文件是文案的唯一权威来源：en.ts 以 typeof zh 为类型约束，zh 与 en 结构必须一一对应
// （新增/删除/改错 key 时 en.ts 编译直接报错）。
// 注意：zh 文案必须与改造前页面现状逐字一致（含中英混合的组件名），避免视觉回归。
export const zh = {
  app: {
    title: 'Yzen-UI · AI 科技风组件库',
  },
  sidebar: {
    themeToggle: '主题切换',
    light: '浅色模式',
    dark: '深色模式',
    brand: 'Yzen-UI for AI-native interfaces.',
    navAria: 'Components',
    language: '切换语言',
    zh: '中',
    en: 'EN',
    cardTitle: 'Yzen-UI',
    cardSub: 'Build AI-native interfaces · 个人组件基座',
    version: 'v1.0 · MIT',
  },
  section: {
    copyCode: '复制代码',
    copied: '已复制',
    viewCode: '查看代码',
    copy: '复制',
    close: '关闭',
  },
  switcher: {
    aria: '变体切换',
  },
}

export type Messages = typeof zh
