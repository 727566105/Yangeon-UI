import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskRows from '../TaskRows.vue'
import type { TaskRow } from '../TaskRows.vue'

const tasks: TaskRow[] = [
  {
    id: 'verify',
    title: '核对传感器备案记录',
    meta: '12 台传感器',
    status: 'completed',
    details: [{ label: '匹配站点与链路 ID', value: '12/12' }],
  },
  {
    id: 'reorder',
    title: '生成观测任务清单',
    meta: '7 条观测序列',
    status: 'running',
    progress: 28,
    details: [{ label: '读取遥测导出', value: '3 个文件' }],
  },
  {
    id: 'emails',
    title: '起草极光预报简报',
    meta: '2 份草稿',
    status: 'queued',
    details: [{ label: '峰值时段预报', value: '草稿' }],
  },
]

describe('YzTaskRows', () => {
  it('renders rows with status badges: check, spinning ring, static ring', () => {
    const wrapper = mount(TaskRows, { props: { tasks } })
    expect(wrapper.findAll('.yz-task-rows__row')).toHaveLength(3)
    expect(wrapper.findAll('.yz-task-rows__title').map((n) => n.text())).toEqual([
      '核对传感器备案记录',
      '生成观测任务清单',
      '起草极光预报简报',
    ])
    expect(wrapper.find('.yz-task-rows__badge--completed').exists()).toBe(true)
    expect(wrapper.find('.yz-task-rows__badge-done').exists()).toBe(true)
    expect(wrapper.find('.yz-task-rows__ring-svg--spin').exists()).toBe(true)
    expect(wrapper.find('.yz-task-rows__pill').text()).toBe('已完成')
  })

  it('expands a row: collapse opens, chevron rotates, emits expand', async () => {
    const wrapper = mount(TaskRows, { props: { tasks } })
    const expand = wrapper.findAll('.yz-task-rows__expand')[0]
    await expand.trigger('click')
    expect(expand.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.yz-task-rows__collapse--open').exists()).toBe(true)
    expect(wrapper.find('.yz-task-rows__detail-label').text()).toBe('匹配站点与链路 ID')
    expect(wrapper.emitted('expand')).toEqual([['verify']])
    // 再点折叠
    await expand.trigger('click')
    expect(wrapper.emitted('expand')).toEqual([['verify'], [null]])
  })

  it('toggles completion via badge: emits update:tasks + complete', async () => {
    const wrapper = mount(TaskRows, { props: { tasks } })
    const badge = wrapper.find('.yz-task-rows__badge--queued')
    await badge.trigger('click')
    const updated = wrapper.emitted('update:tasks')![0][0] as TaskRow[]
    expect(updated[2].status).toBe('completed')
    expect(updated[0].status).toBe('completed')
    expect(wrapper.emitted('complete')).toEqual([[{ id: 'emails', completed: true }]])
  })

  it('reverts a completed task back to queued', async () => {
    const wrapper = mount(TaskRows, { props: { tasks } })
    await wrapper.find('.yz-task-rows__badge--completed').trigger('click')
    const updated = wrapper.emitted('update:tasks')![0][0] as TaskRow[]
    expect(updated[0].status).toBe('queued')
    expect(wrapper.emitted('complete')).toEqual([[{ id: 'verify', completed: false }]])
  })

  it('switches to list variant: flat rows without capsule shadow', () => {
    const wrapper = mount(TaskRows, { props: { tasks, variant: 'list' } })
    expect(wrapper.find('.yz-task-rows--list').exists()).toBe(true)
    expect(wrapper.find('.yz-task-rows__row--list').exists()).toBe(true)
    expect(wrapper.find('.yz-task-rows__row--capsules').exists()).toBe(false)
  })
})
