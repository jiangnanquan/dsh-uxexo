import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const FEATURE_KEYS = Object.freeze(['layout', 'fold', 'usage', 'quietnew'])
export const FEATURE_DEFAULTS = Object.freeze({ layout: true, fold: true, usage: true, quietnew: false })

export const THEME_KEYS = Object.freeze([
  'off',
  // 第一部 · 经典 CRT
  'green-phosphor', 'amber-phosphor', 'matrix-rain', 'cyberpunk-2077', 'radar-red', 'weyland-corp', 'nerv-magi',
  // 第二部 · 纸面浅色
  'p4-white', 'everforest-light', 'parchment-classic', 'solarized-light', 'catppuccin-latte',
  // 第三部 · 现代
  'tokyo-night', 'tokyo-night-day', 'kanagawa-wave', 'kanagawa-lotus', 'rose-pine', 'rose-pine-dawn', 'catppuccin-mocha',
  // 第三部 · AI 品牌
  'claude-light', 'claude-dark', 'openai-light', 'openai-dark', 'gemini-light', 'gemini-dark',
])

export const ENUM_KEYS = Object.freeze({
  theme: THEME_KEYS,
  font: Object.freeze(['off', 'auto', 'sans-mono', 'sans-term', 'noto', 'maple']),
  fontweight: Object.freeze(['regular', 'semibold']),
  ink: Object.freeze(['theme', 'deep', 'black']),
})

export const ENUM_DEFAULTS = Object.freeze({
  theme: 'solarized-light',
  font: 'auto',
  fontweight: 'semibold',
  ink: 'deep',
})

export const DEFAULT_SETTINGS = Object.freeze({
  rev: 2,
  master: true,
  ...ENUM_DEFAULTS,
  ...FEATURE_DEFAULTS,
})

function configPath(options = {}) {
  if (typeof options.filePath === 'string' && options.filePath !== '') return options.filePath
  const home = options.home || (process.env.DSH_HOME || join(homedir(), '.dsh'))
  return join(home, 'dsh-uxexo', 'settings.json')
}

export function normalizeSettings(raw) {
  const out = { ...DEFAULT_SETTINGS }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return out
  if (typeof raw.master === 'boolean') out.master = raw.master
  for (const key of FEATURE_KEYS) if (typeof raw[key] === 'boolean') out[key] = raw[key]
  for (const [key, allowed] of Object.entries(ENUM_KEYS)) {
    let value = raw[key]
    if (value === true) value = DEFAULT_SETTINGS[key]
    else if (value === false) value = 'off'
    if (typeof value === 'string' && allowed.includes(value)) out[key] = value
  }
  if (raw.rev === undefined) {
    if (raw.ink === undefined || raw.ink === 'theme') out.ink = 'deep'
    if (raw.fontweight === undefined || raw.fontweight === 'regular') out.fontweight = 'semibold'
  }
  return out
}

export function readSettings(options = {}) {
  try {
    const value = JSON.parse(readFileSync(configPath(options), 'utf8'))
    if (value === null || typeof value !== 'object' || value.schema !== 1 || value.settings === undefined) return null
    return normalizeSettings(value.settings)
  } catch (_) {
    return null
  }
}

export function writeSettings(raw, options = {}) {
  const file = configPath(options)
  const dir = dirname(file)
  const settings = normalizeSettings(raw)
  const temp = file + '.tmp-' + process.pid + '-' + Date.now() + '-' + Math.random().toString(36).slice(2)
  mkdirSync(dir, { recursive: true })
  try {
    writeFileSync(temp, JSON.stringify({ schema: 1, settings }, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 })
    renameSync(temp, file)
  } catch (error) {
    try { unlinkSync(temp) } catch (_) {}
    throw error
  }
  return settings
}
