import type { FontId, Item } from './types'

export type ItemStyle = {
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  radius?: number
  textFill?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  font?: FontId
  head?: 'end' | 'both' | 'none' | 'inhibit'
  dashed?: boolean
  colors?: Record<string, string>
  smilesColor?: boolean
  size?: number
  layers?: 1 | 2
  gap?: number
  spacing?: number
  jitter?: number
  seriesColors?: string[]
  showGrid?: boolean
}

export function styleOf(item: Item): ItemStyle {
  switch (item.type) {
    case 'icon':
      return { opacity: item.opacity, colors: item.colors }
    case 'image':
      return { opacity: item.opacity, ...(item.smiles ? { smilesColor: item.smilesColor } : {}) }
    case 'shape':
      return {
        fill: item.fill,
        stroke: item.stroke,
        strokeWidth: item.strokeWidth,
        opacity: item.opacity,
        radius: item.radius,
      }
    case 'text':
      return {
        fill: item.fill,
        fontSize: item.fontSize,
        bold: item.bold,
        italic: item.italic,
        align: item.align,
        font: item.font ?? 'sans',
      }
    case 'arrow':
      return { stroke: item.stroke, strokeWidth: item.strokeWidth, head: item.head, dashed: item.dashed }
    case 'membrane':
      return {
        opacity: item.opacity,
        colors: item.colors,
        size: item.size,
        layers: item.layers,
        gap: item.gap,
        spacing: item.spacing,
        jitter: item.jitter,
      }
    case 'marker':
      return {
        fill: item.fill,
        stroke: item.stroke,
        strokeWidth: item.strokeWidth,
        textFill: item.textFill,
        fontSize: item.fontSize,
        size: item.size,
      }
    case 'chart':
      return {
        opacity: item.opacity,
        seriesColors: item.series.map((s) => s.color),
        showGrid: item.showGrid,
      }
  }
}

export function applyStyle(item: Item, s: ItemStyle): Item {
  const colors = 'colors' in s ? { colors: s.colors } : {}
  switch (item.type) {
    case 'icon':
      return { ...item, opacity: s.opacity ?? item.opacity, ...colors }
    case 'image':
      return { ...item, opacity: s.opacity ?? item.opacity, smilesColor: s.smilesColor ?? item.smilesColor }
    case 'shape':
      return {
        ...item,
        fill: s.fill ?? item.fill,
        stroke: s.stroke ?? item.stroke,
        strokeWidth: s.strokeWidth ?? item.strokeWidth,
        opacity: s.opacity ?? item.opacity,
        radius: s.radius ?? item.radius,
      }
    case 'text':
      return {
        ...item,
        fill: s.fill ?? item.fill,
        fontSize: s.fontSize ?? item.fontSize,
        bold: s.bold ?? item.bold,
        italic: s.italic ?? item.italic,
        align: s.align ?? item.align,
        font: s.font ?? item.font,
      }
    case 'arrow':
      return {
        ...item,
        stroke: s.stroke ?? item.stroke,
        strokeWidth: s.strokeWidth ?? item.strokeWidth,
        head: s.head ?? item.head,
        dashed: s.dashed ?? item.dashed,
      }
    case 'membrane':
      return {
        ...item,
        opacity: s.opacity ?? item.opacity,
        size: s.size ?? item.size,
        layers: s.layers ?? item.layers,
        gap: s.gap ?? item.gap,
        spacing: s.spacing ?? item.spacing,
        jitter: s.jitter ?? item.jitter,
        ...colors,
      }
    case 'marker':
      return {
        ...item,
        fill: s.fill ?? item.fill,
        stroke: s.stroke ?? item.stroke,
        strokeWidth: s.strokeWidth ?? item.strokeWidth,
        textFill: s.textFill ?? item.textFill,
        fontSize: s.fontSize ?? item.fontSize,
        size: s.size ?? item.size,
      }
    case 'chart':
      return {
        ...item,
        opacity: s.opacity ?? item.opacity,
        showGrid: s.showGrid ?? item.showGrid,
        series: s.seriesColors
          ? item.series.map((series, i) => ({ ...series, color: s.seriesColors?.[i] ?? series.color }))
          : item.series,
      }
  }
}
