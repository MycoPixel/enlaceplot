import { COLOR_VISION } from './colorvision'
import type { ColorVision, Item } from './types'

export type ColourPalette = { id: string; label: string; colors: string[] }

export const PALETTES: ColourPalette[] = [
  {
    id: 'okabe-ito',
    label: 'Okabe–Ito',
    colors: ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000'],
  },
  {
    id: 'tol-bright',
    label: 'Tol Bright',
    colors: ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB'],
  },
  {
    id: 'tol-muted',
    label: 'Tol Muted',
    colors: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255', '#AA4499'],
  },
  {
    id: 'greys',
    label: 'Greys',
    colors: ['#111111', '#444444', '#777777', '#AAAAAA', '#DDDDDD'],
  },
]

const HEX = /^#([0-9a-f]{6})$/i
const parse = (hex: string): [number, number, number] | null => {
  const m = HEX.exec(hex)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const linear = (v: number) => {
  const n = v / 255
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
}

const simulate = (rgb: [number, number, number], vision: Exclude<ColorVision, 'normal'>): [number, number, number] => {
  const m = COLOR_VISION[vision].values.split(/\s+/).map(Number)
  const [r, g, b] = rgb.map(linear)
  return [
    Math.max(0, r * m[0] + g * m[1] + b * m[2]),
    Math.max(0, r * m[5] + g * m[6] + b * m[7]),
    Math.max(0, r * m[10] + g * m[11] + b * m[12]),
  ]
}

const lab = (rgb: [number, number, number]): [number, number, number] => {
  const [r, g, b] = rgb
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116)
  const fx = f(x)
  const fy = f(y)
  const fz = f(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

const distance = (a: [number, number, number], b: [number, number, number]) => {
  const la = lab(a)
  const lb = lab(b)
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2])
}

export type ColourConflict = { a: string; b: string; vision: Exclude<ColorVision, 'normal'>; distance: number }

export function colourConflicts(colors: string[]): ColourConflict[] {
  const unique = [...new Set(colors.map((c) => c.toLowerCase()))].filter((c) => parse(c))
  const out: ColourConflict[] = []
  for (const vision of ['deuteranopia', 'protanopia'] as const) {
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const a = parse(unique[i])
        const b = parse(unique[j])
        if (!a || !b) continue
        const d = distance(simulate(a, vision), simulate(b, vision))
        if (d < 10) out.push({ a: unique[i], b: unique[j], vision, distance: Math.round(d * 10) / 10 })
      }
    }
  }
  return out.sort((x, y) => x.distance - y.distance)
}

export function itemColours(item: Item): string[] {
  switch (item.type) {
    case 'shape':
      return [item.fill, item.stroke].filter((c) => HEX.test(c))
    case 'text':
      return [item.fill].filter((c) => HEX.test(c))
    case 'marker':
      return [item.fill, item.stroke, item.textFill].filter((c) => HEX.test(c))
    case 'arrow':
      return [item.stroke].filter((c) => HEX.test(c))
    case 'chart':
      return item.series.map((s) => s.color).filter((c) => HEX.test(c))
    case 'icon':
    case 'membrane':
      return Object.values(item.colors ?? {}).filter((c) => HEX.test(c))
    case 'image':
      return []
  }
}

const ink = (hex: string) => {
  const rgb = parse(hex)
  if (!rgb) return '#13262F'
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
  return lum > 0.55 ? '#13262F' : '#FFFFFF'
}

export function paintWithPalette(item: Item, colors: string[], index: number): Item {
  const color = colors[index % colors.length]
  switch (item.type) {
    case 'shape':
      return { ...item, fill: color }
    case 'text':
      return { ...item, fill: color }
    case 'marker':
      return { ...item, fill: color, textFill: ink(color) }
    case 'arrow':
      return { ...item, stroke: color }
    case 'chart':
      return { ...item, series: item.series.map((s, i) => ({ ...s, color: colors[i % colors.length] })) }
    default:
      return item
  }
}
