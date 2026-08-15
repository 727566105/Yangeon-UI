// 英文文案。以 Messages（typeof zh）为类型约束：与 zh 结构一一对应，
// 缺失/多余/类型不符的 key 会在编译期报错。
import type { Messages } from './zh'

export const en: Messages = {
  app: {
    title: 'Yzen-UI · AI-native UI Kit',
  },
  sidebar: {
    themeToggle: 'Toggle theme',
    light: 'Light mode',
    dark: 'Dark mode',
    brand: 'Yzen-UI for AI-native interfaces.',
    navAria: 'Components',
    language: 'Switch language',
    zh: '中',
    en: 'EN',
    cardTitle: 'Yzen-UI',
    cardSub: 'Build AI-native interfaces · personal component base',
    version: 'v1.0 · MIT',
  },
  section: {
    copyCode: 'Copy code',
    copied: 'Copied',
    viewCode: 'View code',
    copy: 'Copy',
    close: 'Close',
  },
  switcher: {
    aria: 'Switch variant',
  },
}
