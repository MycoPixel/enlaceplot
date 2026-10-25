import { useSyncExternalStore } from 'react'

export type ThemeId = 'light' | 'dark' | 'grape' | 'abyss' | 'ember' | 'sand' | 'sage' | 'sky'

type ThemeMeta = {
  id: ThemeId
  label: string
  /** accent shown in the picker, and used for the browser toolbar */
  swatch: string
  themeColor: string
  dark: boolean
}

export const THEMES: ThemeMeta[] = [
  { id: 'light', label: 'Light', swatch: '#463c9b', themeColor: '#f5f8fa', dark: false },
  { id: 'dark', label: 'Dark', swatch: '#8b87f0', themeColor: '#1c2228', dark: true },
  { id: 'grape', label: 'Grape', swatch: '#c084fc', themeColor: '#221631', dark: true },
  { id: 'abyss', label: 'Abyss', swatch: '#2dd4bf', themeColor: '#0d2429', dark: true },
  { id: 'ember', label: 'Ember', swatch: '#f59e0b', themeColor: '#241a16', dark: true },
  { id: 'sand', label: 'Sand', swatch: '#b45309', themeColor: '#fbf6ef', dark: false },
  { id: 'sage', label: 'Sage', swatch: '#2f6b46', themeColor: '#f7faf4', dark: false },
  { id: 'sky', label: 'Sky', swatch: '#1d6fb8', themeColor: '#f5f9fd', dark: false },
]

const KEY = 'enlaceplot:theme'
const isTheme = (value: unknown): value is ThemeId => THEMES.some((t) => t.id === value)

/** index.html sets data-theme before first paint so a dark theme never flashes white. */
function detect(): ThemeId {
  if (typeof document !== 'undefined' && isTheme(document.documentElement.dataset.theme)) {
    return document.documentElement.dataset.theme
  }
  try {
    const saved = localStorage.getItem(KEY)
    if (isTheme(saved)) return saved
  } catch {
    /* storage can be unavailable; fall through to the system preference */
  }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const listeners = new Set<() => void>()
let theme: ThemeId = detect()
let version = 0

function emit() {
  version++
  listeners.forEach((l) => l())
}

export const getTheme = () => theme

export function applyTheme(next: ThemeId) {
  theme = next
  if (typeof document === 'undefined') return
  const meta = THEMES.find((t) => t.id === next) ?? THEMES[0]
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = meta.dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', meta.themeColor)
  emit()
}

export function initTheme() {
  applyTheme(theme)
}

export function setTheme(next: ThemeId) {
  if (next === theme) return
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* the choice just will not be remembered */
  }
  applyTheme(next)
}

export function useTheme(): ThemeId {
  useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    () => version,
  )
  return theme
}
