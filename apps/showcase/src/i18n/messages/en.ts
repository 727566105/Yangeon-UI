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
  categories: {
    basic: 'Basic',
    ai: 'AI',
    advanced: 'Advanced',
  },
  registry: {
    entries: {
      button: {
        name: 'Button',
        description: 'Glow, gradient and AI loading states in one button',
        tags: ['Basic', 'Interactive'],
        variants: { solid: 'Solid', outline: 'Outline', glow: 'Glow', 'ai-loading': 'AI Loading' },
      },
      input: {
        name: 'Input',
        description: 'Frosted surface, glowing focus ring and one-tap smart clear',
        tags: ['Basic', 'Form'],
        variants: { default: 'Default', clearable: 'Clearable', search: 'Search' },
      },
      card: {
        name: 'Card',
        description: 'Glassmorphism, light gradient and hover-lift container',
        tags: ['Basic', 'Container'],
        variants: { default: 'Default', glass: 'Glass', gradient: 'Gradient', hoverable: 'Hoverable' },
      },
      icon: {
        name: 'Icon',
        description: '20 built-in linear tech icons, tinted by weight and theme',
        tags: ['Basic', 'Graphics'],
        variants: { default: 'Default', 'ai-sparkles': 'AI Sparkles', loading: 'Loading' },
      },
      layout: {
        name: 'Layout',
        description: 'Container with 24-column grid and responsive breakpoints',
        tags: ['Basic', 'Layout'],
        variants: { grid: 'Grid', gutter: 'Gutter' },
      },
      typography: {
        name: 'Typography',
        description: 'Unified tech-style text and headings across seven tones and four sizes',
        tags: ['Basic', 'Typography'],
        variants: { default: 'Default', secondary: 'Secondary', accent: 'Accent' },
      },
      'ai-loading': {
        name: 'AI Loading',
        description: 'Three AI loaders — pixel wave, dot matrix and orbiting ring — with shimmer text and timer',
        tags: ['AI', 'Loading'],
        variants: { drive: 'Drive', dots: 'Dots', orbit: 'Orbit' },
      },
      'code-block': {
        name: 'Code Block',
        description: 'Agent-generated code streams in line by line, with file header and one-click copy',
        tags: ['AI', 'Code'],
        variants: { typescript: 'TypeScript', python: 'Python', 'no-stream': 'No Stream' },
      },
      thinking: {
        name: 'Thinking',
        description: 'Collapsible reasoning steps — think, search, code and done — with timestamps and shimmer title',
        tags: ['AI', 'Reasoning'],
        variants: { collapsed: 'Collapsed', expanded: 'Expanded' },
      },
      'tool-chips': {
        name: 'Tool Chips',
        description: 'Compact chips for agent code edits and function calls, with collapsible counted summary',
        tags: ['AI', 'Tools'],
        variants: { expanded: 'Expanded', collapsed: 'Collapsed' },
      },
      'prompt-bar': {
        name: 'Prompt Bar',
        description: 'AI prompt bar with attachments, model picker, voice and send; auto-growing textarea',
        tags: ['AI', 'Input'],
        variants: { default: 'Default', aurora: 'Aurora', pill: 'Pill' },
      },
      'streaming-text': {
        name: 'Streaming Text',
        description: 'Typewriter answer text revealed segment by segment, with caret, collapsible sources and follow-ups',
        tags: ['AI', 'Streaming'],
        variants: { streaming: 'Streaming', fast: 'Fast', complete: 'Complete' },
      },
      'chat-composer': {
        name: 'Chat Composer',
        description: 'Chat panel with tabs, reasoning messages and multi-line send; appends messages and a simulated reply',
        tags: ['AI', 'Chat'],
        variants: { default: 'Default', sensors: 'Sensors', 'no-reply': 'No Reply' },
      },
      'approval-card': {
        name: 'Approval Card',
        description: 'Human-in-the-loop confirmation card: pick an option or reply free-form, with pending and approved states',
        tags: ['AI', 'Approval'],
        variants: { pending: 'Pending', approved: 'Approved' },
      },
      'task-rows': {
        name: 'Task Rows',
        description: 'Live AI task status list: done checkmarks, spinning progress rings, queued dots and collapsible details',
        tags: ['AI', 'Tasks'],
        variants: { capsules: 'Capsules', list: 'List' },
      },
      search: {
        name: 'Search',
        description: 'Command-style search card with live filtering and empty state; ⌘K or / to focus',
        tags: ['AI', 'Search'],
        variants: { 'with-results': 'With results', empty: 'Empty' },
      },
      'context-cards': {
        name: 'Context Cards',
        description: 'Retrieved knowledge chunks: titles and character counts, bodies and source attachment pills (PDF/CSV badges)',
        tags: ['AI', 'Context'],
        variants: { default: 'Default', 'three-chunks': 'Three chunks', static: 'Static' },
      },
      'recommendation-card': {
        name: 'Recommendation Card',
        description: 'Agent recommendation with confidence bar, collapsible alternatives and one-click accept',
        tags: ['AI', 'Suggestions'],
        variants: { default: 'Default', alternatives: 'Alternatives', 'low-confidence': 'Low confidence' },
      },
      'insight-cards': {
        name: 'Insight Cards',
        description: 'Paginated agent insights: highlighted mentions and data, live dual-series trend chart and follow-ups',
        tags: ['AI', 'Insights'],
        variants: { default: 'Default', 'static-chart': 'Static chart', 'five-insights': 'Five insights' },
      },
      'diff-table': {
        name: 'Diff Table',
        description: 'AI-proposed table changes: click rows to accept or revert with strikethrough, collapsible insert preview',
        tags: ['AI', 'Table'],
        variants: { default: 'Default', expanded: 'Expanded', empty: 'Empty' },
      },
      'filter-table': {
        name: 'Filter Table',
        description: 'Status chips re-sort rows live: unmatched rows collapse out, counts auto-calculate, guarded empty state',
        tags: ['AI', 'Table'],
        variants: { default: 'Default', done: 'Done', empty: 'Empty' },
      },
      'sidebar-nav': {
        name: 'Sidebar Nav',
        description: 'Workspace navigation: sliding indicator, collapsible workspace switcher, Quick search filtering and / shortcut',
        tags: ['AI', 'Navigation'],
        variants: { default: 'Default', storm: 'Storm group', 'empty-group': 'Empty group' },
      },
      'records-table': {
        name: 'Records Table',
        description: 'Aurora observation records in a data table with monospace data cells and status badges',
        tags: ['AI', 'Data'],
        variants: { default: 'Default', empty: 'Empty' },
      },
      'fine-tune-card': {
        name: 'Fine-tune Card',
        description: 'AI model fine-tuning controls with sliders and a config summary',
        tags: ['AI', 'Config'],
        variants: { default: 'Default', training: 'Training' },
      },
      'selection-actions': {
        name: 'Selection Actions',
        description: 'AI edit action bar floating over selected text, with description input and one-click rewrite',
        tags: ['AI', 'Editing'],
        variants: { hidden: 'Hidden', visible: 'Visible', entered: 'Entered' },
      },
    },
  },
}
