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
  categories: {
    basic: '基础组件',
    ai: 'AI 场景',
    advanced: '进阶组件',
  },
  // 注册表展示文案（原 registry.json 的 name/description/tags/变体 label 迁出至此；
  // registry.json 只保留数据字段，key 与之对应）
  registry: {
    entries: {
      button: {
        name: 'Button 按钮',
        description: '发光、渐变、AI 加载状态一应俱全的按钮',
        tags: ['基础', '交互'],
        variants: { solid: '实心', outline: '描边', glow: '发光', 'ai-loading': 'AI 加载' },
      },
      input: {
        name: 'Input 输入框',
        description: '磨砂质感、聚焦发光边框、一键智能清空',
        tags: ['基础', '表单'],
        variants: { default: '默认', clearable: '可清空', search: '搜索' },
      },
      card: {
        name: 'Card 卡片',
        description: '玻璃拟态、光影渐变、悬浮抬升的容器',
        tags: ['基础', '容器'],
        variants: { default: '默认', glass: '玻璃', gradient: '渐变', hoverable: '悬浮' },
      },
      icon: {
        name: 'Icon 图标',
        description: '20 枚内置线性科技图标，随字重与主题变色',
        tags: ['基础', '图形'],
        variants: { default: '默认', 'ai-sparkles': 'AI 星光', loading: '加载' },
      },
      layout: {
        name: 'Layout 布局',
        description: '容器 + 24 栅格，响应式断点自由组合',
        tags: ['基础', '布局'],
        variants: { grid: '栅格', gutter: '间距' },
      },
      typography: {
        name: 'Typography 排版',
        description: '统一科技风文本与标题，七阶色、四级字号',
        tags: ['基础', '文字'],
        variants: { default: '默认', secondary: '次要', accent: '强调' },
      },
      'ai-loading': {
        name: 'AI Loading 智能加载',
        description: '像素波浪、点阵跳动、轨道旋转三形态 AI 加载器，渐变扫光文字与计时',
        tags: ['AI', '加载'],
        variants: { drive: '驱动', dots: '点阵', orbit: '轨道' },
      },
      'code-block': {
        name: 'Code Block 代码块',
        description: 'Agent 生成的代码逐行流式入场，文件头与一键复制',
        tags: ['AI', '代码'],
        variants: { typescript: 'TypeScript', python: 'Python', 'no-stream': '不流式' },
      },
      thinking: {
        name: 'Thinking 思考过程',
        description: '可折叠的推理步骤——思考、检索、编码与完成状态，等宽时间戳与渐变扫光标题',
        tags: ['AI', '推理'],
        variants: { collapsed: '折叠', expanded: '展开' },
      },
      'tool-chips': {
        name: 'Tool Chips 工具调用',
        description: 'Agent 代码编辑与函数调用的紧凑 chips，带计数摘要的可折叠列表',
        tags: ['AI', '工具'],
        variants: { expanded: '展开', collapsed: '折叠' },
      },
      'prompt-bar': {
        name: 'Prompt Bar 输入条',
        description: '带附件、模型选择、语音与发送的 AI 输入条，textarea 自动高度',
        tags: ['AI', '输入'],
        variants: { default: '默认', aurora: '极光', pill: '胶囊' },
      },
      'streaming-text': {
        name: 'Streaming Text 流式文本',
        description: '打字机逐段揭示的回答文本，光标闪烁、来源折叠面板与追问建议，完成后浮现操作按钮',
        tags: ['AI', '流式'],
        variants: { streaming: '流式中', fast: '快速', complete: '已完成' },
      },
      'chat-composer': {
        name: 'Chat Composer 对话输入区',
        description: '带标签页、推理消息与多行输入发送的对话面板，发送后自动追加消息与模拟回复',
        tags: ['AI', '对话'],
        variants: { default: '默认', sensors: '传感器', 'no-reply': '无回复' },
      },
      'approval-card': {
        name: 'Approval Card 审批卡片',
        description: 'AI 行动前的人工确认卡片：选项单选或自定义回复，待处理与已批准两种按钮态',
        tags: ['AI', '审批'],
        variants: { pending: '待处理', approved: '已批准' },
      },
      'task-rows': {
        name: 'Task Rows 任务行',
        description: 'AI 任务实时状态列表：已完成勾选、执行中旋转进度环、排队圆环，明细可折叠',
        tags: ['AI', '任务'],
        variants: { capsules: '胶囊', list: '列表' },
      },
      search: {
        name: 'Search 指令搜索',
        description: '命令式搜索卡片：实时过滤结果与空状态，支持 ⌘K 或 / 快捷键聚焦',
        tags: ['AI', '搜索'],
        variants: { 'with-results': '有结果', empty: '空状态' },
      },
      'context-cards': {
        name: 'Context Cards 上下文卡片',
        description: '检索知识分块列表：标题与字符数栏、正文与来源附件胶囊（PDF/CSV 徽章），入场错峰动画',
        tags: ['AI', '上下文'],
        variants: { default: '默认', 'three-chunks': '三个分块', static: '静态' },
      },
      'recommendation-card': {
        name: 'Recommendation Card 推荐卡片',
        description: 'Agent 建议与置信度计量条，备选方案可折叠面板与一键接受',
        tags: ['AI', '建议'],
        variants: { default: '默认', alternatives: '备选方案', 'low-confidence': '低置信度' },
      },
      'insight-cards': {
        name: 'Insight Cards 洞察卡片',
        description: '分页式 Agent 洞察：提及与数据高亮正文、双序列实时趋势图（图例可开关）与追问建议',
        tags: ['AI', '洞察'],
        variants: { default: '默认', 'static-chart': '静态图表', 'five-insights': '五条洞察' },
      },
      'diff-table': {
        name: 'Diff Table 差异表格',
        description: 'AI 提议的表格变更：点击行接受/撤销（供应商划线删除），底部建议插入行可折叠预览',
        tags: ['AI', '表格'],
        variants: { default: '默认', expanded: '展开建议', empty: '空数据' },
      },
      'filter-table': {
        name: 'Filter Table 可筛选表格',
        description: '状态 chips 实时重组数据：未命中行折叠退场，筛选计数自动计算，空结果有守卫',
        tags: ['AI', '表格'],
        variants: { default: '默认', done: '已完成筛选', empty: '空数据' },
      },
      'sidebar-nav': {
        name: 'Sidebar Nav 侧边导航',
        description: '工作区导航：选中态滑动指示条、工作区切换折叠菜单、Quick search 实时过滤与 / 快捷键',
        tags: ['AI', '导航'],
        variants: { default: '默认', storm: '磁暴监测组', 'empty-group': '空分组' },
      },
      'records-table': {
        name: 'Records Table 记录表格',
        description: '极光观测记录数据表格，等宽数据元素与状态徽章',
        tags: ['AI', '数据'],
        variants: { default: '默认', empty: '空数据' },
      },
      'fine-tune-card': {
        name: 'Fine-tune Card 微调卡片',
        description: 'AI 模型微调参数控制卡，滑块与配置摘要',
        tags: ['AI', '配置'],
        variants: { default: '默认', training: '训练中' },
      },
      'selection-actions': {
        name: 'Selection Actions 选择操作',
        description: '选中文本后浮现的 AI 编辑操作条，描述输入与一键改写',
        tags: ['AI', '编辑'],
        variants: { hidden: '隐藏', visible: '显示', entered: '已输入' },
      },
    },
  },
}

export type Messages = typeof zh
