// yz CLI：开发消费型命令（只读组件库内容与规范，零缓存实时反映项目状态）
// 依赖 @yzen-ui/registry-core 项目感知层；命令输出人类可读 + --json 供脚本。
import { Command } from 'commander'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createProjectContext, findRepoRoot } from '@yzen-ui/registry-core'
import type { ComponentFilter } from '@yzen-ui/registry-core'

export interface RunOptions {
  /** 覆盖进程 cwd 的仓库根（测试注入） */
  root?: string
  /** 输出（测试捕获） */
  stdout?: (line: string) => void
}

export function run(argv: string[], opts: RunOptions = {}): void {
  const out = opts.stdout ?? ((line: string) => process.stdout.write(line + '\n'))
  const ctx = createProjectContext(opts.root)

  const program = new Command()
  program
    .name('yz')
    .description('Yzen-UI 组件库接入 CLI：查询组件内容与开发规范')
    .version('0.1.0')

  // yz components list / get（嵌套子命令）
  const components = program.command('components').description('组件查询')
  components
    .command('list')
    .description('组件清单（精简字段；支持筛选）')
    .option('--category <key>', '按分类筛选（如 ai）')
    .option('--keyword <text>', '按 key/名称/标签关键词筛选')
    .option('--limit <n>', '限制条数', parseInt)
    .option('--full', '输出全量字段（含描述/标签/变体）')
    .action((cmdOpts) => {
      const filter: ComponentFilter = {
        category: cmdOpts.category,
        keyword: cmdOpts.keyword,
        limit: cmdOpts.limit,
      }
      const list = ctx.listComponents(filter)
      if (cmdOpts.full) {
        out(JSON.stringify(list.map((c) => ctx.getComponent(c.key)), null, 2))
        return
      }
      out(JSON.stringify(list, null, 2))
    })

  components
    .command('get <key>')
    .description('组件详情 / 源码 / demo / 变体')
    .option('--source', '输出组件实现源码')
    .option('--demo', '输出 demo 用法示例源码')
    .option('--variants', '输出变体配置')
    .action((key, cmdOpts) => {
      const detail = ctx.getComponent(key)
      if (!detail) {
        out(`组件不存在: ${key}`)
        process.exitCode = 1
        return
      }
      if (cmdOpts.source) {
        out(ctx.readComponentSource(key) ?? '(源码缺失)')
        return
      }
      if (cmdOpts.demo) {
        out(ctx.readDemoSource(key) ?? '(demo 缺失)')
        return
      }
      if (cmdOpts.variants) {
        out(JSON.stringify(detail.variants, null, 2))
        return
      }
      out(JSON.stringify(detail, null, 2))
    })

  // yz tokens [--json]
  program
    .command('tokens')
    .description('设计 token（浅色默认 + 深色覆盖，按分组）')
    .option('--json', '输出 JSON')
    .action((cmdOpts) => {
      const tokens = ctx.getDesignTokens()
      if (cmdOpts.json) {
        out(JSON.stringify(tokens, null, 2))
        return
      }
      for (const group of tokens.light) {
        out(`\n[${group.group}]`)
        for (const t of group.tokens) out(`  ${t.name}: ${t.value}`)
      }
      if (tokens.dark.length) {
        out('\n[深色覆盖 dark]')
        for (const group of tokens.dark) {
          for (const t of group.tokens) out(`  ${t.name}: ${t.value}`)
        }
      }
    })

  // yz style-guide
  program
    .command('style-guide')
    .description('组件开发规范摘要')
    .action(() => out(ctx.getStyleGuide()))

  // yz info
  program
    .command('info')
    .description('项目结构概览')
    .action(() => {
      const info = ctx.getProjectInfo()
      out(`仓库根: ${info.root}`)
      out(`apps: ${info.apps.join(', ') || '(无)'}`)
      out(`packages: ${info.packages.join(', ') || '(无)'}`)
      out(`组件数: ${info.componentCount} | 分类数: ${info.categoryCount}`)
      out(`registry: ${info.hasRegistry ? '✓' : '✗'} | docs: ${info.hasDocs ? '✓' : '✗'}`)
    })

  // yz docs [name]
  program
    .command('docs [name]')
    .description('项目文档（按名称筛选，省略列出全部）')
    .action((name?: string) => {
      const docs = ctx.readDocs(name)
      if (!docs.length) {
        out('未找到文档')
        return
      }
      for (const d of docs) {
        out(`\n===== ${d.name} =====\n${d.content.slice(0, 2000)}${d.content.length > 2000 ? '\n…(截断)' : ''}`)
      }
    })

  // yz init [--out <dir>]
  program
    .command('init')
    .description('生成《组件库接入指南》到当前目录（yz-guide.md）')
    .option('--out <dir>', '输出目录', '.')
    .action((cmdOpts) => {
      const guide = `${ctx.getStyleGuide()}

## 快速接入
\`\`\`bash
pnpm add yzen-ui
\`\`\`
\`\`\`ts
// main.ts
import 'yzen-ui/style.css'
\`\`\`
\`\`\`vue
<script setup lang="ts">
import { YzButton } from 'yzen-ui'
</script>
<template>
  <YzButton>Send</YzButton>
</template>
\`\`\`
深色主题：<html data-theme="dark"> 自动切换。\n`
      const target = join(cmdOpts.out, 'yz-guide.md')
      writeFileSync(target, guide, 'utf8')
      out(`已生成 ${target}`)
    })

  // from: 'user' —— argv 为纯用户参数（不含 node/script 前两项）
  program.parse(argv, { from: 'user' })
}

/** 仓库根发现（供 bin 提示） */
export function cliFindRoot(): string | null {
  return findRepoRoot()
}
