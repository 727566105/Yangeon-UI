<script setup lang="ts">
import { useI18n } from '../i18n'

// 开发接入说明页：CLI（@yzen-ui/cli）与 MCP（@yzen-ui/mcp-server）的配置与调用方式。
// 文案全部走 i18n（zh/en 一一对应），代码示例用双语无关的字面文本。
const { t } = useI18n()

// 代码示例（与文案分离，避免 i18n 里塞大段代码）
const cliCode = `# 运行方式（Node 22.18+）
pnpm --filter @yzen-ui/cli dev -- <命令>
# 或全局安装后直接使用
yz <命令>

# 常用命令
yz components list --platform desktop          # 组件清单（可按分类/端/关键词筛选）
yz components get breadcrumb --variants       # 组件详情：源码 / demo / 变体
yz platforms list                             # 平台（端）清单
yz tokens --json                              # 设计 token
yz style-guide                                # 开发规范摘要
yz docs PRD                                   # 项目文档
yz init                                       # 生成 yz-guide.md`

const mcpCode = `{
  "mcpServers": {
    "yzen-ui": {
      "command": "yz-mcp"
    }
  }
}

# 本地源码运行（可选）
# pnpm --filter @yzen-ui/mcp-server dev`
</script>

<template>
  <div class="dev">
    <h2 class="dev__title">{{ t('dev.title') }}</h2>
    <p class="dev__subtitle">{{ t('dev.subtitle') }}</p>

    <div class="dev__grid">
      <!-- CLI -->
      <section class="dev__card">
        <h3 class="dev__card-title">{{ t('dev.cliTitle') }}</h3>
        <p class="dev__card-desc">{{ t('dev.cliDesc') }}</p>
        <h4 class="dev__card-sub">{{ t('dev.cliRun') }}</h4>
        <pre class="dev__code">{{ cliCode }}</pre>
        <h4 class="dev__card-sub">{{ t('dev.cliCommands') }}</h4>
        <ul class="dev__list">
          <li>{{ t('dev.cliList') }}</li>
          <li>{{ t('dev.cliGet') }}</li>
          <li>{{ t('dev.cliPlatforms') }}</li>
          <li>{{ t('dev.cliTokens') }}</li>
          <li>{{ t('dev.cliStyle') }}</li>
          <li>{{ t('dev.cliDocs') }}</li>
          <li>{{ t('dev.cliInit') }}</li>
        </ul>
      </section>

      <!-- MCP -->
      <section class="dev__card">
        <h3 class="dev__card-title">{{ t('dev.mcpTitle') }}</h3>
        <p class="dev__card-desc">{{ t('dev.mcpDesc') }}</p>
        <h4 class="dev__card-sub">{{ t('dev.mcpConfig') }}</h4>
        <pre class="dev__code">{{ mcpCode }}</pre>
        <h4 class="dev__card-sub">{{ t('dev.mcpTools') }}</h4>
        <p class="dev__tools">{{ t('dev.mcpToolsDesc') }}</p>
      </section>
    </div>

    <p class="dev__hint">{{ t('dev.hint') }}</p>
  </div>
</template>

<style scoped>
.dev {
  max-width: 860px;
}
.dev__title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--yz-ink);
}
.dev__subtitle {
  margin: 0 0 18px;
  font-size: 12.5px;
  color: var(--yz-ink-3);
}
.dev__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 900px) {
  .dev__grid {
    grid-template-columns: 1fr;
  }
}
.dev__card {
  border-radius: var(--yz-radius-window);
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
  padding: 18px;
}
.dev__card-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--yz-ink);
}
.dev__card-desc {
  margin: 0 0 14px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--yz-ink-2);
}
.dev__card-sub {
  margin: 14px 0 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-3);
}
.dev__code {
  margin: 0;
  padding: 12px;
  border-radius: var(--yz-radius-control);
  background: var(--yz-inset);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--yz-ink-2);
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
  -webkit-user-select: text;
}
.dev__list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--yz-ink-2);
}
.dev__tools {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--yz-ink-2);
  user-select: text;
  -webkit-user-select: text;
}
.dev__hint {
  margin: 16px 0 0;
  padding: 10px 12px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--yz-accent) 25%, transparent);
  font-size: 12.5px;
  color: var(--yz-ink-2);
}
</style>
