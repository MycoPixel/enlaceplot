import { chartEls } from './charts'
import { colourConflicts, itemColours } from './palettes'
import { creditsText, uncreditedImageCount } from './credits'
import type { Doc, Item } from './types'

export type PreflightIssue = {
  level: 'warn' | 'info'
  key: string
  vars?: Record<string, string | number>
}

const MIN_TEXT_MM = 1.5
const MIN_LINE_MM = 0.2
const MIN_CONTRAST = 3

const rgb = (hex: string): [number, number, number] | null => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const luminance = ([r, g, b]: [number, number, number]) => {
  const f = (v: number) => {
    const n = v / 255
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

const contrast = (a: string, b: string) => {
  const ra = rgb(a)
  const rb = rgb(b)
  if (!ra || !rb) return null
  const la = luminance(ra)
  const lb = luminance(rb)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const textSizes = (item: Item): number[] => {
  if (item.type === 'text') return [item.fontSize]
  if (item.type === 'marker') return [item.fontSize]
  if (item.type === 'chart') return chartEls(item).flatMap((el) => (el.kind === 'text' ? [el.size] : []))
  return []
}

export function preflight(
  doc: Doc,
  visible: Item[],
  width: number,
  widthMm: number,
  dpi: number,
  format: 'png' | 'svg' | 'pdf',
  withCredits: boolean,
): PreflightIssue[] {
  const mm = (px: number) => (px * widthMm) / Math.max(1, width)
  const issues: PreflightIssue[] = []

  const smallText = visible.flatMap(textSizes).filter((size) => mm(size) < MIN_TEXT_MM)
  if (smallText.length) {
    issues.push({
      level: 'warn',
      key: 'Text is smaller than {mm} mm at this export size ({n} items).',
      vars: { mm: MIN_TEXT_MM, n: smallText.length },
    })
  }

  const thinLines: number[] = []
  for (const item of visible) {
    if (item.type === 'shape' && item.strokeWidth > 0) thinLines.push(item.strokeWidth)
    if (item.type === 'arrow') thinLines.push(item.strokeWidth)
    if (item.type === 'marker' && item.strokeWidth > 0) thinLines.push(item.strokeWidth)
  }
  const thin = thinLines.filter((w) => mm(w) < MIN_LINE_MM)
  if (thin.length) {
    issues.push({
      level: 'warn',
      key: 'Lines are thinner than {mm} mm at this export size ({n} items).',
      vars: { mm: MIN_LINE_MM, n: thin.length },
    })
  }

  const background = doc.transparent ? '#FFFFFF' : doc.background
  const low: string[] = []
  for (const item of visible) {
    if (item.type === 'text') {
      const ratio = contrast(item.fill, background)
      if (ratio !== null && ratio < MIN_CONTRAST) low.push(item.id)
    }
    if (item.type === 'marker') {
      const ratio = contrast(item.textFill, item.fill)
      if (ratio !== null && ratio < MIN_CONTRAST) low.push(item.id)
    }
  }
  if (low.length) {
    issues.push({
      level: 'warn',
      key: 'Some text has low contrast against its background ({n} items).',
      vars: { n: low.length },
    })
  }

  const scope: Doc = { ...doc, items: visible }
  const conflicts = colourConflicts(visible.flatMap(itemColours))
  if (conflicts.length) {
    issues.push({
      level: 'warn',
      key: 'Colour-blind readers may find {n} colour pairs hard to tell apart.',
      vars: { n: conflicts.length },
    })
  }

  if (format === 'png' && dpi < 300) {
    issues.push({
      level: 'warn',
      key: 'PNG is set to {dpi} dpi; journals often ask for 300 dpi or more.',
      vars: { dpi },
    })
  }

  if (creditsText(scope) && !withCredits) {
    issues.push({
      level: 'info',
      key: 'This figure uses artwork that needs credit, but the credit line is off.',
    })
  }

  const uncredited = uncreditedImageCount(scope)
  if (uncredited > 0) {
    issues.push({
      level: 'warn',
      key: '{n} imported images have no author or licence.',
      vars: { n: uncredited },
    })
  }

  return issues
}
