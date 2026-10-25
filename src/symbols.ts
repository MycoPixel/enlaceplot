import { detachOutside, remapAnchors } from './connectors'
import { uid } from './defaults'
import { translateItem, unionAabb } from './geometry'
import type { Item, Pt } from './types'

export type SavedSymbol = {
  id: string
  name: string
  updatedAt: number
  w: number
  h: number
  items: Item[]
  thumb: string
}

export function symbolFromSelection(items: Item[]): { items: Item[]; w: number; h: number } | null {
  const chosen = items.filter((i) => !i.hidden)
  if (!chosen.length) return null
  const groups = new Map<string, string>()
  const ids = new Map<string, string>()
  const copies = chosen.map((item) => {
    const copy = structuredClone(item) as Item
    copy.id = uid()
    ids.set(item.id, copy.id)
    if (item.group) {
      if (!groups.has(item.group)) groups.set(item.group, uid())
      copy.group = groups.get(item.group)
    }
    delete copy.locked
    return copy
  })
  const linked = remapAnchors(copies, ids)
  const kept = new Set(linked.map((i) => i.id))
  const detached = linked.map((i) => (i.type === 'arrow' ? detachOutside(i, kept) : i))
  const box = unionAabb(detached)
  return {
    items: detached.map((i) => translateItem(i, -box.x, -box.y)),
    w: Math.max(1, box.w),
    h: Math.max(1, box.h),
  }
}

export function instantiateSymbol(sym: SavedSymbol, at: Pt): Item[] {
  const groups = new Map<string, string>()
  const ids = new Map<string, string>()
  const copies = sym.items.map((item) => {
    const copy = structuredClone(item) as Item
    copy.id = uid()
    ids.set(item.id, copy.id)
    if (item.group) {
      if (!groups.has(item.group)) groups.set(item.group, uid())
      copy.group = groups.get(item.group)
    }
    delete copy.locked
    return copy
  })
  const linked = remapAnchors(copies, ids)
  const kept = new Set(linked.map((i) => i.id))
  const detached = linked.map((i) => (i.type === 'arrow' ? detachOutside(i, kept) : i))
  const dx = at.x - sym.w / 2
  const dy = at.y - sym.h / 2
  return detached.map((i) => translateItem(i, dx, dy))
}
