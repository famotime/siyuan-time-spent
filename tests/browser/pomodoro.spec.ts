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
      await expect(panel).toContainText('今日已记录')
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
  await panel
    .getByRole('button', {
      name: '自定义',
      exact: true,
    })
    .click()
  await panel.getByRole('spinbutton').fill('27')
  await panel.getByRole('button', { name: '应用时长' }).click()
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
  await panel.getByRole('button', { name: '记录打断' }).click()
  await panel.getByRole('textbox').fill('测试：临时回复消息')
  await panel
    .getByRole('button', {
      name: '记录',
      exact: true,
    })
    .click()
  await expect(panel).toContainText('测试：临时回复消息')
  await panel.screenshot({ path: testInfo.outputPath('paused-note.png') })
  const editor = page.getByRole('textbox', { name: '示例笔记编辑器' })
  await editor.click()
  await page.keyboard.type(' Still writing.')
  await expect(panel).toHaveCount(0)
  await expect(editor).toBeFocused()
  await expect(editor).toContainText('Still writing.')
  await page.locator('.sy-pomo-capsule').click()
  await expect(page.getByRole('button', { name: '继续专注' })).toBeVisible()
})

test('Escape closes the inner edit first, then returns focus', async ({
  page,
}) => {
  await page.goto('/')
  const panel = page.getByRole('dialog')
  await panel
    .getByRole('button', {
      name: '自定义',
      exact: true,
    })
    .click()
  await panel.getByRole('spinbutton').fill('180')
  await page.keyboard.press('Escape')
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('spinbutton')).toHaveCount(0)
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
  await panel
    .getByRole('button', {
      name: 'Custom',
      exact: true,
    })
    .click()
  await panel.getByRole('spinbutton').fill('180')
  await panel.getByRole('button', { name: 'Apply duration' }).click()
  await expect(panel.locator('.stage-time')).toHaveText('180:00')
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
  await panel.screenshot({ path: testInfo.outputPath('english-180.png') })
})
