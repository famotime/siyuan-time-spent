import {
  expect,
  test,
} from '@playwright/test'

for (const theme of ['light', 'dark', 'custom']) {
  for (const form of ['zen', 'chrono', 'hourglass']) {
    test(`renders ${form} in ${theme}`, async ({ page }, testInfo) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`/?theme=${theme}&form=${form}&state=focus`)
      const panel = page.getByRole('dialog')
      await expect(panel).toBeVisible()
      await expect(panel.locator('.stage-time')).toHaveText('18:42')
      await expect(panel).toContainText('今日')
      await page.addStyleTag({ content: 'svg { fill: currentColor; }' })
      const fill = await panel
        .locator('.stage-dial svg')
        .evaluate((svg) => getComputedStyle(svg).fill)
      expect(fill).toBe('none')
      await panel.screenshot({
        path: testInfo.outputPath(`${form}-${theme}.png`),
      })
      expect(errors).toEqual([])
    })
  }
}

test('custom time, native keyboard activation and non-modal editing', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  const panel = page.getByRole('dialog')
  const slider = panel.locator('input[type="range"]')
  await slider.fill('27')
  await slider.dispatchEvent('input')
  await expect(panel.locator('.stage-time')).toHaveText('27:00')
  const start = panel.getByRole('button', { name: '开始专注' })
  await start.focus()
  await page.keyboard.press('Space')
  await expect(
    panel.getByRole('button', {
      name: '暂停',
      exact: true,
    }),
  ).toBeVisible()
  await expect(panel.getByRole('button', { name: '继续专注' })).toHaveCount(0)
  await panel
    .getByRole('button', {
      name: '暂停',
      exact: true,
    })
    .click()
  await panel.getByRole('button', { name: '放弃', exact: true }).click()
  await expect(panel.getByRole('button', { name: '确认放弃' })).toBeVisible()
  await panel.getByRole('button', { name: '继续专注', exact: true }).click()
  await expect(panel.getByRole('button', { name: '放弃' })).toBeVisible()
  await panel.screenshot({ path: testInfo.outputPath('paused.png') })
  const editor = page.getByRole('textbox', { name: '示例笔记编辑器' })
  await editor.click()
  await page.keyboard.type(' Still writing.')
  await expect(panel).toHaveCount(0)
  await expect(editor).toBeFocused()
  await expect(editor).toContainText('Still writing.')
  await page.locator('.sy-pomo-capsule').click()
  await expect(page.getByRole('button', { name: '继续专注' })).toBeVisible()
})

test('Escape closes the panel and returns focus to capsule', async ({
  page,
}) => {
  await page.goto('/')
  const panel = page.getByRole('dialog')
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(page.locator('.sy-pomo-capsule')).toBeFocused()
})

for (const state of ['idle', 'away', 'break', 'long-break', 'saved', 'error']) {
  test(`small screen ${state}`, async ({ page }, testInfo) => {
    await page.setViewportSize({
      width: 320,
      height: 640,
    })
    await page.goto(`/?state=${state}&longTitle=1`)
    const panel = page.getByRole('dialog')
    await expect(panel).toBeVisible()
    const bounds = await panel.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(15)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(305)
    expect(bounds!.y).toBeGreaterThanOrEqual(15)
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    await panel.screenshot({ path: testInfo.outputPath(`narrow-${state}.png`) })
    if (state === 'error') await expect(panel).toContainText('专注记录未保存')
    if (state === 'away') {
      await expect(panel).toContainText('计时仍继续')
      await expect(panel.getByRole('button', { name: '继续专注' })).toHaveCount(
        0,
      )
    }
  })
}

test('long time, English and reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({
    width: 375,
    height: 720,
  })
  await page.goto('/?lang=en_US')
  const panel = page.getByRole('dialog')
  const slider = panel.locator('input[type="range"]')
  await slider.fill('90')
  await slider.dispatchEvent('input')
  await expect(panel.locator('.stage-time')).toHaveText('90:00')
  const fits = await panel
    .locator('.stage-time')
    .evaluate(
      (el) =>
        el.getBoundingClientRect().width
        <= el.parentElement!.getBoundingClientRect().width,
    )
  expect(fits).toBe(true)
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              a.playState === 'running'
              && a.effect?.getTiming().iterations === Infinity,
          )
          .length,
    ),
  ).toBe(0)
  await panel.screenshot({ path: testInfo.outputPath('english-90.png') })
})

// —— 槽位稳定性：主操作与页脚不跳位 ——
const slotBoxes = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const box = (selector: string) => {
      const el = document.querySelector(selector)
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return { y: Math.round(rect.y), h: Math.round(rect.height) }
    }
    return {
      primary: box('.st-pomo-button--primary'),
      footer: box('.pomo-footer'),
      stage: box('.pomo-stage-wrap'),
    }
  })

test('keeps the primary action and footer pinned while switching timer mode', async ({
  page,
}) => {
  await page.goto('/')
  const panel = page.getByRole('dialog')
  const before = await slotBoxes(page)
  await panel.getByRole('button', { name: '正计时', exact: true }).click()
  await page.waitForTimeout(300)
  const after = await slotBoxes(page)
  // 切换正计时/倒计时；主操作与页脚相对位移不超过 4px
  expect(Math.abs(after.primary!.y - before.primary!.y)).toBeLessThanOrEqual(4)
  expect(Math.abs(after.footer!.y - before.footer!.y)).toBeLessThanOrEqual(4)
  expect(Math.abs(after.footer!.h - before.footer!.h)).toBeLessThanOrEqual(4)
})

test('keeps running controls pinned while toggling discard confirmation', async ({
  page,
}) => {
  await page.goto('/?state=focus')
  const panel = page.getByRole('dialog')
  const before = await slotBoxes(page)
  await panel.getByRole('button', { name: '放弃', exact: true }).click()
  await expect(panel.getByRole('button', { name: '确认放弃' })).toBeVisible()
  await page.waitForTimeout(300)
  const afterDiscard = await slotBoxes(page)
  expect(
    Math.abs(afterDiscard.primary!.y - before.primary!.y),
  ).toBeLessThanOrEqual(4)
})

// —— 状态栏胶囊相位配色与读屏播报 ——
const capsuleColors = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const capsule = document.querySelector('.sy-pomo-capsule')!
    const style = getComputedStyle(capsule)
    return {
      background: style.backgroundColor,
      color: style.color,
    }
  })

test('colors the status capsule per phase', async ({ page }) => {
  await page.goto('/?state=focus')
  await page.waitForSelector('.sy-pomo-capsule')
  const focus = await capsuleColors(page)
  await page.goto('/?state=break')
  await page.waitForSelector('.sy-pomo-capsule')
  const rest = await capsuleColors(page)
  await page.goto('/?state=away')
  await page.waitForSelector('.sy-pomo-capsule')
  const frozen = await capsuleColors(page)
  // 三种运行时状态必须彼此可辨，且都不是待机的通配色
  expect(focus.color).not.toBe(rest.color)
  expect(focus.color).not.toBe(frozen.color)
  expect(rest.color).not.toBe(frozen.color)
  expect(focus.color).toBe('rgb(180, 83, 9)')
  expect(rest.color).toBe('rgb(15, 118, 110)')
  expect(frozen.color).toBe('rgb(71, 85, 105)')
})

test('announces a finished session to screen readers while the panel is closed', async ({
  page,
}) => {
  await page.goto('/?state=saved')
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  // 预览默认展开面板；关掉后面板仍在后台完成记录播报
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  const live = page.locator('.st-pomo-sr-only[role="status"]')
  await expect(live).toHaveText('本次专注已结束')
  // 只读屏不占位：1px 裁剪，不进入视觉布局
  const box = await live.boundingBox()
  expect(box!.width).toBeLessThanOrEqual(2)
})

// —— 触屏命中区 ——
test('meets the 44px touch floor on coarse pointers', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 780 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5178/')
  await page.waitForSelector('.sy-pomo-card')
  const sizes = await page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector(selector)
      return el ? Math.round(el.getBoundingClientRect().height) : null
    }
    return {
      doc: read('.pomo-document'),
      brand: read('.pomo-header__brand'),
      close: read('.pomo-header__close'),
      start: read('.st-pomo-button--primary'),
    }
  })
  expect(sizes.doc).toBeGreaterThanOrEqual(43)
  expect(sizes.brand).toBeGreaterThanOrEqual(28)
  expect(sizes.close).toBeGreaterThanOrEqual(43)
  expect(sizes.start).toBeGreaterThanOrEqual(43)
  await context.close()
})

