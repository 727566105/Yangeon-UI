import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FineTuneCard from '../FineTuneCard.vue'

function visibleRect() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 10,
    bottom: 300,
    left: 10,
    right: 300,
    width: 290,
    height: 290,
    x: 10,
    y: 10,
    toJSON: () => ({}),
  } as DOMRect)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('YzFineTuneCard', () => {
  it('renders title, four params with source values and layout buttons', () => {
    const wrapper = mount(FineTuneCard)
    expect(wrapper.find('.yz-fine-tune-card__title').text()).toBe('Flavor card')
    expect(wrapper.find('.yz-fine-tune-card__shimmer').text()).toBe('Adjust')
    const inputs = wrapper.findAll('.yz-fine-tune-card__input')
    expect(inputs).toHaveLength(4)
    expect((inputs[0].element as HTMLInputElement).value).toBe('324') // W
    expect((inputs[1].element as HTMLInputElement).value).toBe('96') // H
    expect((inputs[2].element as HTMLInputElement).value).toBe('28') // Radius
    expect((inputs[3].element as HTMLInputElement).value).toBe('100') // Opacity
    const sliders = wrapper.findAll('[role="slider"]')
    expect(sliders).toHaveLength(4)
    expect(sliders[0].attributes('aria-valuenow')).toBe('324')
    expect(sliders[0].attributes('aria-valuemin')).toBe('40')
    expect(sliders[3].attributes('aria-valuemax')).toBe('100')
    // 布局按钮：row 激活
    const btns = wrapper.findAll('.yz-fine-tune-card__layout-btn')
    expect(btns).toHaveLength(3)
    expect(btns[0].attributes('aria-pressed')).toBe('true')
    expect(btns[1].attributes('aria-pressed')).toBe('false')
    // Type 占位
    expect(wrapper.find('.yz-fine-tune-card__select-text').text()).toBe('Select type')
  })

  it('switches layout and emits update:layout + change; thumb transform follows', async () => {
    const wrapper = mount(FineTuneCard)
    const btns = wrapper.findAll('.yz-fine-tune-card__layout-btn')
    await btns[2].trigger('click') // grid
    expect(btns[2].attributes('aria-pressed')).toBe('true')
    expect(btns[0].attributes('aria-pressed')).toBe('false')
    expect(wrapper.emitted('update:layout')).toEqual([['grid']])
    expect(wrapper.emitted('change')).toEqual([['grid']])
    expect((wrapper.find('.yz-fine-tune-card__thumb').element as HTMLElement).style.transform).toContain('translateX(200%)')
    // 点击同一项不重复 emit
    await btns[2].trigger('click')
    expect(wrapper.emitted('update:layout')).toEqual([['grid']])
  })

  it('clamps numeric input on blur and emits update:width; keyboard arrow steps slider', async () => {
    const wrapper = mount(FineTuneCard)
    const wInput = wrapper.findAll('.yz-fine-tune-card__input')[0]
    await wInput.setValue('2000')
    // 输入即时 emit 未截断值
    expect(wrapper.emitted('update:width')).toEqual([[2000]])
    await wInput.trigger('blur')
    // blur 夹取到 max 999 并同步显示
    expect(wrapper.emitted('update:width')).toEqual([[2000], [999]])
    expect((wInput.element as HTMLInputElement).value).toBe('999')
    // 键盘方向键（H 96 + step 1 → 97）
    const hSlider = wrapper.findAll('[role="slider"]')[1]
    await hSlider.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:height')).toEqual([[97]])
    // Home 跳 min
    await hSlider.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:height')?.at(-1)).toEqual([24])
  })

  it('opens type menu, selects option from types prop and emits update:type + update:open', async () => {
    const wrapper = mount(FineTuneCard)
    const select = wrapper.find('.yz-fine-tune-card__select')
    await select.trigger('click')
    expect(select.attributes('aria-expanded')).toBe('true')
    expect(wrapper.emitted('update:open')).toEqual([[true]])
    const options = wrapper.findAll('.yz-fine-tune-card__menu-option')
    expect(options).toHaveLength(3)
    expect(options[0].text()).toContain('观测文本')
    await options[1].trigger('click') // 光谱图像
    expect(wrapper.emitted('update:type')).toEqual([['光谱图像']])
    expect(select.attributes('aria-expanded')).toBe('false')
    // 选中项显示在按钮上（与 types prop 同源）
    expect(wrapper.find('.yz-fine-tune-card__select-text').text()).toBe('光谱图像')
  })

  it('guards empty params and empty types without runtime errors', () => {
    const wrapper = mount(FineTuneCard, { props: { params: [], types: [] } })
    expect(wrapper.findAll('.yz-fine-tune-card__input')).toHaveLength(0)
    expect(wrapper.find('.yz-fine-tune-card__select-text').text()).toBe('Select type')
    expect(wrapper.text()).toContain('Type')
  })
})
