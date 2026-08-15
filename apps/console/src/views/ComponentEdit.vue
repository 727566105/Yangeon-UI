<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoStage, validateRegistry } from '@yzen-ui/shared'
import type { Platform, RegistryCategory, RegistryEntry, Variant, LocalizedText } from '@yzen-ui/shared'
import { saveRegistry, fetchRegistry } from '../api'
import { useI18n } from '../i18n'

const props = defineProps<{
  entry: RegistryEntry | undefined
  categories: RegistryCategory[]
  platforms: Platform[]
  /** 新建模式下的组件 key（entry 为 undefined 时使用） */
  entryKey?: string
}>()
const emit = defineEmits<{ (e: 'back'): void; (e: 'saved'): void }>()

const { t, localized } = useI18n()

// 新建条目模板（收录向导生成文件后补元信息：PRD 7.5 收录流程）
function createDraft(key: string): RegistryEntry {
  return {
    key,
    name: { zh: '', en: '' },
    description: { zh: '', en: '' },
    category: props.categories[0]?.key ?? 'basic',
    platform: props.platforms[0]?.key ?? 'desktop',
    tags: [{ zh: '', en: '' }],
    order: 0, // 保存时按 max+1 分配
    visible: true,
    source: `components/${key}`,
    variants: [{ id: 'default', label: { zh: '默认', en: 'Default' }, group: { zh: '', en: '' }, props: {} }],
  }
}

// 编辑用深拷贝副本（避免直接污染列表数据；保存时整体提交）。
// 注意：props.entry 是 Vue 响应式代理，structuredClone 会抛 DataCloneError，
// registry 是纯 JSON 数据，用 JSON 深拷贝最稳。
const draft = ref<RegistryEntry>(
  props.entry
    ? normalizeVariants(JSON.parse(JSON.stringify(props.entry)) as RegistryEntry)
    : createDraft(props.entryKey ?? ''),
)

// 变体规范化：group 为可选字段，旧数据缺失时补空对象（模板 v-model 需要可写路径）
function normalizeVariants(entry: RegistryEntry): RegistryEntry {
  for (const v of entry.variants) {
    if (!v.group) v.group = { zh: '', en: '' }
  }
  return entry
}

const activeVariant = ref(0)
const saving = ref(false)
const savedOk = ref(false)
const errors = ref<string[]>([])

// 预览变体：当前语言 label + id + props（DemoStage 只消费 id/props）
const previewVariants = computed(() =>
  draft.value.variants.map((v) => ({ id: v.id, props: v.props })),
)

function setLt(target: LocalizedText, lang: 'zh' | 'en', value: string) {
  target[lang] = value
}

function addTag() {
  draft.value.tags.push({ zh: '', en: '' })
}
function removeTag(i: number) {
  draft.value.tags.splice(i, 1)
}

function addVariant() {
  const base = draft.value.variants.length
  draft.value.variants.push({
    id: `variant-${base + 1}`,
    label: { zh: '', en: '' },
    group: { zh: '', en: '' },
    props: {},
  })
}
function removeVariant(i: number) {
  draft.value.variants.splice(i, 1)
  if (activeVariant.value >= draft.value.variants.length) {
    activeVariant.value = Math.max(0, draft.value.variants.length - 1)
  }
}
function moveVariant(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= draft.value.variants.length) return
  const arr = draft.value.variants
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

// props JSON 编辑（解析失败时保留原值并提示）
const propsJson = ref<Record<string, string>>({})
watch(
  () => draft.value.variants,
  (variants) => {
    propsJson.value = Object.fromEntries(
      variants.map((v, i) => [String(i), JSON.stringify(v.props ?? {}, null, 2)]),
    )
  },
  { deep: true, immediate: true },
)
function applyPropsJson(i: number) {
  const raw = propsJson.value[String(i)]
  try {
    const parsed = JSON.parse(raw || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      draft.value.variants[i].props = parsed
      errors.value = errors.value.filter((e) => !e.startsWith(`变体 ${i + 1} props JSON`))
    } else {
      errors.value.push(`变体 ${i + 1} props JSON 必须是对象`)
    }
  } catch {
    errors.value.push(`变体 ${i + 1} props JSON 解析失败`)
  }
}

// 本地校验 + 保存
async function save() {
  errors.value = []
  // 提交副本：双空 group 视为未设置并剥离（不修改 draft，避免模板 v-model 路径失效）
  const submit: RegistryEntry = {
    ...draft.value,
    variants: draft.value.variants.map((v) =>
      v.group?.zh?.trim() || v.group?.en?.trim()
        ? v
        : { id: v.id, label: v.label, props: v.props },
    ),
  }
  const result = validateRegistry([submit], [submit.key])
  if (!result.ok) {
    errors.value = result.errors
    return
  }
  saving.value = true
  try {
    // 服务端会再次校验（含组件存在性与分类存在性），本地只校验单条
    const all = await fetchRegistry()
    const idx = all.findIndex((e) => e.key === submit.key)
    if (idx >= 0) {
      all[idx] = submit
    } else {
      // 新建条目：分配 order（max + 1），避免与现有组件冲突
      submit.order = Math.max(0, ...all.map((e) => e.order)) + 1
      all.push(submit)
    }
    const res = await saveRegistry(all)
    if (res.ok) {
      savedOk.value = true
      setTimeout(() => emit('saved'), 600)
    } else {
      errors.value = res.errors
    }
  } catch (e) {
    errors.value = [e instanceof Error ? e.message : String(e)]
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="edit" v-if="draft">
    <div class="edit__head">
      <button type="button" class="edit__back" @click="$emit('back')">← {{ t('common.back') }}</button>
      <h2 class="edit__title">{{ t('edit.title') }}: <code>{{ draft.key }}</code></h2>
      <button
        type="button"
        class="edit__save"
        :disabled="saving"
        @click="save"
      >{{ saving ? t('common.saving') : t('edit.save') }}</button>
    </div>

    <p v-if="savedOk" class="edit__toast">{{ t('edit.saved') }}</p>
    <ul v-if="errors.length" class="edit__errors">
      <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
    </ul>

    <div class="edit__layout">
      <!-- 左：表单 -->
      <form class="edit__form" @submit.prevent>
        <section class="edit__section">
          <h3 class="edit__section-title">{{ t('edit.name') }}</h3>
          <div class="edit__grid">
            <label class="edit__field">
              <span class="edit__label">{{ t('common.zh') }}</span>
              <input v-model="draft.name.zh" class="edit__input" type="text" />
            </label>
            <label class="edit__field">
              <span class="edit__label">{{ t('common.en') }}</span>
              <input v-model="draft.name.en" class="edit__input" type="text" />
            </label>
          </div>
        </section>

        <section class="edit__section">
          <h3 class="edit__section-title">{{ t('edit.description') }}</h3>
          <div class="edit__grid">
            <label class="edit__field">
              <span class="edit__label">{{ t('common.zh') }}</span>
              <input v-model="draft.description.zh" class="edit__input" type="text" />
            </label>
            <label class="edit__field">
              <span class="edit__label">{{ t('common.en') }}</span>
              <input v-model="draft.description.en" class="edit__input" type="text" />
            </label>
          </div>
        </section>

        <section class="edit__section">
          <h3 class="edit__section-title">{{ t('edit.category') }} / {{ t('edit.platform') }} / {{ t('edit.order') }} / {{ t('edit.visible') }}</h3>
          <div class="edit__row">
            <select v-model="draft.category" class="edit__input edit__input--sm">
              <option v-for="c in categories" :key="c.key" :value="c.key">{{ localized(c.label) }}</option>
            </select>
            <select v-model="draft.platform" class="edit__input edit__input--sm">
              <option v-for="p in platforms" :key="p.key" :value="p.key">{{ localized(p.label) }}</option>
            </select>
            <input v-model.number="draft.order" class="edit__input edit__input--sm" type="number" min="1" />
            <label class="edit__check">
              <input v-model="draft.visible" type="checkbox" />
              {{ t('edit.visible') }}
            </label>
          </div>
        </section>

        <section class="edit__section">
          <h3 class="edit__section-title">
            {{ t('edit.tags') }}
            <button type="button" class="edit__mini-btn" @click="addTag">+ {{ t('edit.tagAdd') }}</button>
          </h3>
          <div v-for="(tag, i) in draft.tags" :key="i" class="edit__grid">
            <label class="edit__field">
              <span class="edit__label">{{ t('common.zh') }}</span>
              <input v-model="tag.zh" class="edit__input" type="text" />
            </label>
            <label class="edit__field">
              <span class="edit__label">{{ t('common.en') }}</span>
              <input v-model="tag.en" class="edit__input" type="text" />
            </label>
            <button type="button" class="edit__mini-btn edit__mini-btn--danger" @click="removeTag(i)">✕</button>
          </div>
        </section>

        <section class="edit__section">
          <h3 class="edit__section-title">
            {{ t('edit.variants') }}
            <button type="button" class="edit__mini-btn" @click="addVariant">+ {{ t('edit.variantAdd') }}</button>
          </h3>
          <div v-for="(v, i) in draft.variants" :key="i" class="edit__variant" :class="{ 'edit__variant--active': activeVariant === i }">
            <div class="edit__variant-head">
              <span class="edit__variant-index">{{ i + 1 }}</span>
              <input v-model="v.id" class="edit__input edit__input--sm" :placeholder="t('edit.variantId')" />
              <button type="button" class="edit__mini-btn" :disabled="i === 0" @click="moveVariant(i, -1)">↑</button>
              <button type="button" class="edit__mini-btn" :disabled="i === draft.variants.length - 1" @click="moveVariant(i, 1)">↓</button>
              <button type="button" class="edit__mini-btn edit__mini-btn--danger" @click="removeVariant(i)">✕</button>
              <button
                type="button"
                class="edit__mini-btn edit__mini-btn--preview"
                @click="activeVariant = i"
              >{{ t('edit.preview') }}</button>
            </div>
            <div class="edit__grid">
              <label class="edit__field">
                <span class="edit__label">{{ t('edit.variantLabel') }} · {{ t('common.zh') }}</span>
                <input v-model="v.label.zh" class="edit__input" type="text" />
              </label>
              <label class="edit__field">
                <span class="edit__label">{{ t('edit.variantLabel') }} · {{ t('common.en') }}</span>
                <input v-model="v.label.en" class="edit__input" type="text" />
              </label>
              <label class="edit__field">
                <span class="edit__label">{{ t('edit.variantGroup') }} · {{ t('common.zh') }}</span>
                <input v-model="v.group.zh" class="edit__input" type="text" :placeholder="t('edit.variantGroupHint')" />
              </label>
              <label class="edit__field">
                <span class="edit__label">{{ t('edit.variantGroup') }} · {{ t('common.en') }}</span>
                <input v-model="v.group.en" class="edit__input" type="text" :placeholder="t('edit.variantGroupHint')" />
              </label>
            </div>
            <div class="edit__field">
              <span class="edit__label">{{ t('edit.variantProps') }}</span>
              <textarea
                :value="propsJson[String(i)]"
                class="edit__textarea"
                rows="3"
                spellcheck="false"
                @input="(ev) => { propsJson[String(i)] = (ev.target as HTMLTextAreaElement).value; applyPropsJson(i) }"
              />
            </div>
          </div>
        </section>
      </form>

      <!-- 右：实时预览（PRD 7.4：与 Showcase 同一渲染路径） -->
      <aside class="edit__preview">
        <h3 class="edit__section-title">{{ t('edit.preview') }}</h3>
        <div class="edit__preview-surface">
          <DemoStage
            :entry-key="draft.key"
            :variant-index="activeVariant"
            :variants="previewVariants"
          />
        </div>
        <div class="edit__preview-switcher">
          <button
            v-for="(v, i) in draft.variants"
            :key="i"
            type="button"
            class="edit__preview-chip"
            :class="{ 'edit__preview-chip--active': activeVariant === i }"
            @click="activeVariant = i"
          >{{ localized(v.label) || v.id }}</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.edit__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.edit__back {
  border: none;
  background: transparent;
  padding: 6px 10px;
  border-radius: var(--yz-radius-control);
  font-size: 13px;
  color: var(--yz-ink-2);
  cursor: pointer;
}
.edit__back:hover { background: var(--yz-hover); color: var(--yz-ink); }
.edit__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.edit__title code {
  font-family: var(--yz-font-mono);
  font-size: 14px;
  color: var(--yz-accent);
}
.edit__save {
  margin-left: auto;
  height: 32px;
  padding: 0 18px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: var(--yz-ink);
  color: var(--yz-canvas);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(16, 24, 40, 0.1);
  transition: transform 150ms var(--yz-ease-out-strong);
}
.edit__save:active { transform: scale(0.97); }
.edit__save:disabled { opacity: 0.6; cursor: default; }
.edit__toast {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-green) 15%, transparent);
  color: var(--yz-ink);
  font-size: 12.5px;
}
.edit__errors {
  margin: 0 0 12px;
  padding: 10px 12px 10px 28px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-tag-red) 12%, transparent);
  color: var(--yz-ink);
  font-size: 12.5px;
}
.edit__errors li { margin: 2px 0; }
.edit__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
  gap: 24px;
  align-items: start;
}
@media (max-width: 960px) {
  .edit__layout { grid-template-columns: 1fr; }
}
.edit__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.edit__section {
  padding: 16px;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.edit__section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--yz-ink-2);
}
.edit__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 8px;
}
.edit__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.edit__label {
  font-size: 11.5px;
  color: var(--yz-ink-3);
}
.edit__input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-surface);
  color: var(--yz-ink);
  font-size: 13px;
  outline: none;
  transition: box-shadow 150ms var(--yz-ease-out-strong), border-color 150ms var(--yz-ease-out-strong);
}
.edit__input:focus {
  border-color: var(--yz-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--yz-accent) 20%, transparent);
}
.edit__input--sm { width: 110px; }
.edit__textarea {
  padding: 8px 10px;
  border: 1px solid var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-inset);
  color: var(--yz-ink-2);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}
.edit__row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.edit__check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--yz-ink-2);
}
.edit__mini-btn {
  border: none;
  background: transparent;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--yz-ink-3);
  cursor: pointer;
}
.edit__mini-btn:hover { background: var(--yz-hover); color: var(--yz-ink); }
.edit__mini-btn:disabled { opacity: 0.35; cursor: default; }
.edit__mini-btn--danger:hover { color: var(--yz-tag-red); }
.edit__mini-btn--preview { color: var(--yz-accent); }
.edit__variant {
  padding: 10px;
  margin-bottom: 8px;
  border-radius: var(--yz-radius-control);
  border: 1px solid var(--yz-line);
  background: var(--yz-surface);
}
.edit__variant--active { border-color: var(--yz-accent); }
.edit__variant-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.edit__variant-index {
  font-family: var(--yz-font-mono);
  font-size: 11px;
  color: var(--yz-ink-3);
}
.edit__preview {
  position: sticky;
  top: 76px;
}
.edit__preview-surface {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 272px;
  padding: 12px;
  border-radius: var(--yz-radius-window);
  background: var(--yz-canvas);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.edit__preview-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
}
.edit__preview-chip {
  border: none;
  background: var(--yz-field);
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  color: var(--yz-ink-2);
  cursor: pointer;
}
.edit__preview-chip--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong);
}
</style>
