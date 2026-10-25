import { useSyncExternalStore } from 'react'
import raw from './icons.json'
import rawBioart from './icons.bioart.json'
import rawCommons from './icons.commons.json'
import rawPhylopic from './icons.phylopic.json'
import rawHealth from './icons.healthicons.json'
import rawScidraw from './icons.scidraw.json'
import rawReactome from './icons.reactome.json'
import rawTogotv from './icons.togotv.json'
import rawCustom from './icons.custom.json'
import type { IconMeta, Item } from './types'

type LicenseKey = 'cc0' | 'mit' | 'by25' | 'by3' | 'by4' | 'pd'
type RawIcon = {
  id: string
  label: string
  category: string
  author: string
  license: LicenseKey
  inline: boolean
  viewBox: number[]
}
type RawBioartIcon = RawIcon & {
  collection: string
  date: string
  entry: number
  doi: string
}
type RawCommonsIcon = RawIcon & {
  /** Commons names the license of each file on its own, so the url comes per file. */
  licenseUrl: string
  /** File name on Commons, used to build the link back to the file page. */
  file: string
}
const { authors, icons: rawIcons } = raw as unknown as { authors: Record<string, string>; icons: RawIcon[] }
const { icons: rawBioartIcons } = rawBioart as unknown as { icons: RawBioartIcon[] }
const { icons: rawCommonsIcons } = rawCommons as unknown as { icons: RawCommonsIcon[] }
type RawPhylopicIcon = RawIcon & { licenseUrl: string; uuid: string }
const { icons: rawPhylopicIcons } = rawPhylopic as unknown as { icons: RawPhylopicIcon[] }
type RawHealthIcon = RawIcon & { licenseUrl: string; style: string; healthCategory: string; tags: string[] }
const { icons: rawHealthIcons } = rawHealth as unknown as { icons: RawHealthIcon[] }
const { icons: rawCustomIcons } = rawCustom as unknown as { icons: RawIcon[] }
type RawScidrawIcon = RawIcon & { uuid: string; date: string; doi: string }
const { icons: rawScidrawIcons } = rawScidraw as unknown as { icons: RawScidrawIcon[] }
type RawReactomeIcon = RawIcon & { cat: string }
const { icons: rawReactomeIcons } = rawReactome as unknown as { icons: RawReactomeIcon[] }
type RawTogotvIcon = RawIcon & { date: string; doi: string }
const { icons: rawTogotvIcons } = rawTogotv as unknown as { icons: RawTogotvIcon[] }

// icons.json stores only what varies per icon; the rest is derived here.
const LICENSES = {
  cc0: { name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  mit: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  by25: { name: 'CC BY 2.5', url: 'https://creativecommons.org/licenses/by/2.5/' },
  by3: { name: 'CC BY 3.0', url: 'https://creativecommons.org/licenses/by/3.0/' },
  by4: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  // NIH BioArt Source marks its own illustrations "Public Domain" and links to its FAQ for the terms.
  pd: { name: 'Public Domain', url: 'https://bioart.niaid.nih.gov/faqs#usage-restrictions-bioart' },
}

const fromBioicons = (r: RawIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES[r.license].name,
  licenseUrl: LICENSES[r.license].url,
  author: r.author,
  authorUrl: authors[r.author] ?? '',
  source: 'https://bioicons.com',
})

const fromBioart = (r: RawBioartIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES[r.license].name,
  licenseUrl: LICENSES[r.license].url,
  author: r.author,
  authorUrl: '',
  source: `https://bioart.niaid.nih.gov/bioart/${r.entry}`,
  collection: r.collection,
  date: r.date,
  doi: r.doi,
})

const fromCommons = (r: RawCommonsIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES[r.license].name,
  licenseUrl: r.licenseUrl || LICENSES[r.license].url,
  author: r.author,
  authorUrl: '',
  source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(r.file)}`,
  via: 'Wikimedia Commons',
})

const fromPhylopic = (r: RawPhylopicIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES[r.license].name,
  licenseUrl: r.licenseUrl || LICENSES[r.license].url,
  author: r.author,
  authorUrl: '',
  source: `https://www.phylopic.org/images/${r.uuid}`,
  via: 'PhyloPic',
})

const fromHealth = (r: RawHealthIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES.cc0.name,
  licenseUrl: r.licenseUrl,
  author: r.author,
  authorUrl: '',
  source: `https://healthicons.org/icon/${r.style}/${r.healthCategory}/${r.id.replace(/^health-/, '')}`,
  via: 'Health Icons',
  /** Their own keywords, so a search finds "measles" as well as "Rash". */
  tags: r.tags,
})

const fromCustom = (r: RawIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES[r.license].name,
  licenseUrl: LICENSES[r.license].url,
  author: r.author,
  authorUrl: '',
  source: '',
  custom: true,
})

// SciDraw credits its contributors: every drawing page carries the author, the license and a DOI.
const fromScidraw = (r: RawScidrawIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES[r.license].name,
  licenseUrl: LICENSES[r.license].url,
  author: r.author,
  authorUrl: '',
  source: `https://scidraw.io/drawings/${r.uuid}`,
  via: 'SciDraw',
})

// Reactome's icon library is part of its CC BY 4.0 content; the category page lists each icon.
const fromReactome = (r: RawReactomeIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES[r.license].name,
  licenseUrl: LICENSES[r.license].url,
  author: r.author,
  authorUrl: '',
  source: `https://reactome.org/icon-lib/${r.cat}`,
  via: 'Reactome',
})

// DBCLS TogoTV asks for the credit "© 2016 DBCLS TogoTV / CC-BY-4.0"; the group line carries it.
const fromTogotv = (r: RawTogotvIcon): IconMeta => ({
  id: r.id,
  label: r.label,
  category: r.category,
  file: `icons/${r.id}.svg`,
  inline: r.inline,
  viewBox: r.viewBox,
  license: LICENSES[r.license].name,
  licenseUrl: LICENSES[r.license].url,
  author: r.author,
  authorUrl: '',
  source: 'https://togotv.dbcls.jp/pics',
  via: 'TogoTV',
})

export const ICONS: IconMeta[] = [
  ...rawIcons.map(fromBioicons),
  ...rawBioartIcons.map(fromBioart),
  ...rawCommonsIcons.map(fromCommons),
  ...rawPhylopicIcons.map(fromPhylopic),
  ...rawHealthIcons.map(fromHealth),
  ...rawScidrawIcons.map(fromScidraw),
  ...rawReactomeIcons.map(fromReactome),
  ...rawTogotvIcons.map(fromTogotv),
  ...rawCustomIcons.map(fromCustom),
]
export const ICON_BY_ID = new Map(ICONS.map((i) => [i.id, i]))
export const CATEGORIES = Array.from(new Set(ICONS.map((i) => i.category))).sort((a, b) =>
  a.localeCompare(b),
)

export const iconUrl = (meta: IconMeta) => new URL(meta.file, document.baseURI).href

export type ParsedIcon =
  | {
      status: 'ready'
      inline: boolean
      /** Inline icons: the markup inside <svg>, with colours swapped for __C0__ style tokens. */
      inner: string
      /** Icons that carry their own <style>: the whole file as text, also tokenised. */
      svgText: string
      /** Colours used by the icon (#rrggbb), most used first. Index matches the tokens. */
      palette: string[]
    }
  | { status: 'error' }

const cache = new Map<string, ParsedIcon>()
const pending = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
let version = 0

const emit = () => {
  version++
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** Re-renders a component whenever another icon finishes loading. */
export const useIconCacheVersion = () => useSyncExternalStore(subscribe, () => version)

export const getIcon = (id: string) => cache.get(id)

const SVG_NS = 'http://www.w3.org/2000/svg'
const OK_ATTR_NS = new Set([
  null,
  SVG_NS,
  'http://www.w3.org/1999/xlink',
  'http://www.w3.org/XML/1998/namespace',
  'http://www.w3.org/2000/xmlns/',
])
const P = '__P__' // placeholder replaced by a per-item prefix so ids never collide

export function toBase64(s: string) {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}


const NAMED: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  gray: '#808080',
  grey: '#808080',
  brown: '#a52a2a',
  cyan: '#00ffff',
  magenta: '#ff00ff',
}
const COLOR_PROPS = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color']
const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')

/** Any simple CSS colour as #rrggbb, or null when it is not one (none, url(...), currentColor, alpha forms). */
export function normColor(raw: string): string | null {
  const v = raw.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  const m = v.match(/^rgb\(\s*([\d.]+)(%?)\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*\)$/)
  if (m) {
    const k = m[2] ? 2.55 : 1
    return `#${hex2(+m[1] * k)}${hex2(+m[3] * k)}${hex2(+m[4] * k)}`
  }
  return NAMED[v] ?? null
}

/** Pulls every plain colour out of the icon into tokens, so a figure can swap them without touching the file. */
function tokenizeColors(all: Element[]) {
  const order: string[] = []
  const counts = new Map<string, number>()
  const token = (c: string) => {
    let i = order.indexOf(c)
    if (i === -1) {
      i = order.push(c) - 1
    }
    counts.set(c, (counts.get(c) ?? 0) + 1)
    return `__C${i}__`
  }
  const inCss = (css: string) =>
    css.replace(
      new RegExp(`(^|[;{\\s])(${COLOR_PROPS.join('|')})(\\s*:\\s*)([^;}"'\\n]+)`, 'gi'),
      (whole, pre: string, prop: string, colon: string, val: string) => {
        const c = normColor(val.replace(/!important/i, ''))
        return c ? `${pre}${prop}${colon}${token(c)}` : whole
      },
    )
  for (const el of all) {
    for (const prop of COLOR_PROPS) {
      const v = el.getAttribute(prop)
      const c = v ? normColor(v) : null
      if (c) el.setAttribute(prop, token(c))
    }
    const st = el.getAttribute('style')
    if (st) el.setAttribute('style', inCss(st))
    if (el.localName === 'style' && el.textContent) el.textContent = inCss(el.textContent)
  }
  const palette = [...order].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
  // tokens were numbered in first-seen order; remap them so index 0 is the most used colour
  const remap = new Map(order.map((c, i) => [i, palette.indexOf(c)]))
  return { palette, remap }
}

/** Puts real colours back in place of the tokens, using the item's replacements where it has any. */
export function resolveColors(text: string, palette: string[], colors?: Record<string, string>) {
  if (!palette.length) return text
  return text.replace(/__C(\d+)__/g, (_m, i: string) => {
    const orig = palette[Number(i)] ?? '#000000'
    return colors?.[orig] ?? orig
  })
}

const dataUriCache = new Map<string, string>()
/** Isolated (<style>) icons are drawn as images, so recolouring means building a fresh data URI. */
export function iconDataUri(id: string, parsed: Extract<ParsedIcon, { status: 'ready' }>, colors?: Record<string, string>) {
  const key = `${id}|${colors ? JSON.stringify(colors) : ''}`
  let uri = dataUriCache.get(key)
  if (!uri) {
    uri = `data:image/svg+xml;base64,${toBase64(resolveColors(parsed.svgText, parsed.palette, colors))}`
    if (dataUriCache.size > 400) dataUriCache.clear()
    dataUriCache.set(key, uri)
  }
  return uri
}

/** Removes scripts, editor metadata, foreign namespaces and event handlers from a parsed SVG tree. */
export function stripUnsafe(root: Element): Element[] {
  const drop: Element[] = []
  root.querySelectorAll('*').forEach((el) => {
    if (
      el.namespaceURI !== SVG_NS ||
      ['script', 'foreignObject', 'metadata', 'title', 'desc'].includes(el.localName)
    ) {
      drop.push(el)
    }
  })
  drop.forEach((el) => el.remove())
  const all = [root, ...Array.from(root.querySelectorAll('*'))]
  for (const el of all) {
    for (const a of Array.from(el.attributes)) {
      if (/^on/i.test(a.name) || !OK_ATTR_NS.has(a.namespaceURI)) el.removeAttributeNode(a)
    }
  }
  return all
}

function parseSvg(text: string, meta: IconMeta): ParsedIcon {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const root = doc.documentElement
  if (!root || root.localName !== 'svg' || doc.querySelector('parsererror')) {
    return { status: 'error' }
  }

  // Strip anything that is not plain SVG: scripts, editor metadata, foreign namespaces.
  const all = stripUnsafe(root)

  // Icons that carry <style> rules would leak CSS into each other, so they stay isolated as images.
  const inline = !root.querySelector('style')

  const { palette, remap } = tokenizeColors(all)
  const retoken = (str: string) => str.replace(/__C(\d+)__/g, (_m, i: string) => `__C${remap.get(Number(i)) ?? i}__`)

  if (!inline) {
    root.setAttribute('viewBox', meta.viewBox.join(' '))
    root.setAttribute('width', '100%')
    root.setAttribute('height', '100%')
    return {
      status: 'ready',
      inline: false,
      inner: '',
      svgText: retoken(new XMLSerializer().serializeToString(root)),
      palette,
    }
  }

  const fixRef = (v: string) =>
    v.replace(
      /url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g,
      (_m, q: string, id: string) => `url(${q}#${P}${id}${q})`,
    )
  for (const el of all) {
    for (const a of Array.from(el.attributes)) {
      if (a.name === 'id') a.value = P + a.value
      else if (a.localName === 'href' && a.value.startsWith('#')) a.value = `#${P}${a.value.slice(1)}`
      else if (a.value.includes('url(')) a.value = fixRef(a.value)
    }
  }
  for (const a of Array.from(root.attributes)) {
    if (!a.name.startsWith('xmlns')) root.removeAttributeNode(a)
  }
  const out = new XMLSerializer().serializeToString(root)
  const close = out.lastIndexOf('</svg>')
  const inner = close === -1 ? '' : out.slice(out.indexOf('>') + 1, close)
  return { status: 'ready', inline: true, inner: retoken(inner), svgText: '', palette }
}

async function load(id: string) {
  const meta = ICON_BY_ID.get(id)
  if (!meta) {
    cache.set(id, { status: 'error' })
  } else {
    try {
      const res = await fetch(iconUrl(meta))
      if (!res.ok) throw new Error(String(res.status))
      cache.set(id, parseSvg(await res.text(), meta))
    } catch {
      cache.set(id, { status: 'error' })
    }
  }
  pending.delete(id)
  emit()
}

/** Starts loading the given icons and resolves once all of them are parsed. */
export function ensureIcons(ids: Iterable<string>): Promise<void> {
  const all: Promise<void>[] = []
  for (const id of ids) {
    if (cache.has(id)) continue
    let p = pending.get(id)
    if (!p) {
      p = load(id)
      pending.set(id, p)
    }
    all.push(p)
  }
  return Promise.all(all).then(() => undefined)
}

export const scopeIds = (inner: string, itemId: string) => inner.split(P).join(`i${itemId}-`)

export type SourceId = 'bioicons' | 'bioart' | 'commons' | 'phylopic' | 'health' | 'scidraw' | 'reactome' | 'togotv' | 'custom'
/** Where each drawing comes from. The names are proper names, so they are not translated. */
export const SOURCES: { id: SourceId; label: string }[] = [
  { id: 'bioicons', label: 'Bioicons' },
  { id: 'bioart', label: 'NIH BioArt Source' },
  { id: 'commons', label: 'Wikimedia Commons' },
  { id: 'phylopic', label: 'PhyloPic' },
  { id: 'health', label: 'Health Icons' },
  { id: 'scidraw', label: 'SciDraw' },
  { id: 'reactome', label: 'Reactome' },
  { id: 'togotv', label: 'TogoTV' },
  { id: 'custom', label: 'Your icons' },
]

export function sourceOf(m: IconMeta): SourceId {
  if (m.custom) return 'custom'
  if (m.via === 'Wikimedia Commons') return 'commons'
  if (m.via === 'PhyloPic') return 'phylopic'
  if (m.via === 'Health Icons') return 'health'
  if (m.via === 'SciDraw') return 'scidraw'
  if (m.via === 'Reactome') return 'reactome'
  if (m.via === 'TogoTV') return 'togotv'
  if (m.collection) return 'bioart'
  return 'bioicons'
}

/** CC0 and public-domain drawings carry no license condition; everything else (CC BY, MIT) asks for credit. */
export const isOpenLicense = (m: IconMeta) => m.license.startsWith('CC0') || m.license === 'Public Domain'

/** The library icon an item draws, if any: an icon, or the lipid a membrane repeats. */
export const iconIdOf = (i: Item): string | null => (i.type === 'icon' || i.type === 'membrane' ? i.iconId : null)
