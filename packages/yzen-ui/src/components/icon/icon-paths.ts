// 24×24 viewBox，stroke 风格线性图标（1.8 默认描边）
export const ICON_PATHS = {
  sparkles:
    '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4L12 3z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/>',
  search:
    '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  'arrow-right': '<path d="M4 12h16M14 6l6 6-6 6"/>',
  loading: '<path d="M21 12a9 9 0 1 1-6.2-8.56"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 5v-3.9c0-1 .1-1.6-.5-2.4 1.9-.2 3.9-1 3.9-4.2 0-1-.4-1.8-1-2.4.1-.3.4-1.3-.1-2.6 0 0-.8-.3-2.7 1a9.4 9.4 0 0 0-5 0c-1.9-1.3-2.7-1-2.7-1-.5 1.3-.2 2.3-.1 2.6-.6.6-1 1.4-1 2.4 0 3.2 2 4.2 3.9 4.2-.4.4-.6 1.1-.5 2V22"/>',
  terminal: '<path d="M4 17l6-5-6-5M12 19h8"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3 3.9M6.6 6.6A16 16 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.2-1.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warning: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  success: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
} as const

export type IconName = keyof typeof ICON_PATHS
