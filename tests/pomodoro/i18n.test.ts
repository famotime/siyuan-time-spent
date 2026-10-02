import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import fg from 'fast-glob'
import {
  expect,
  it,
} from 'vitest'
import en from '../../src/i18n/en_US.json'
import zh from '../../src/i18n/zh_CN.json'

it('defines static Pomodoro UI translation keys in both languages', () => {
  const files = fg.sync('src/components/Pomodoro/**/*.{ts,vue}')
  const keys = new Set(files.flatMap((file) => [...readFileSync(resolve(file), 'utf8').matchAll(/\bt\('([^']+)'/g)].map((match) => match[1])))
  const missing = [...keys].filter((key) => !(key in zh) || !(key in en))
  expect(missing).toEqual([])
})
