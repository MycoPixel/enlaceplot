import { measureText } from './geometry'
import { ICON_BY_ID, iconIdOf } from './icons'
import { t } from './i18n'
import type { Doc, IconMeta, ImageItem } from './types'

/** Icons used in the figure, one entry per icon, in layer order. */
export function usedIcons(doc: Doc): IconMeta[] {
  const seen = new Set<string>()
  const out: IconMeta[] = []
  for (const it of doc.items) {
    const id = iconIdOf(it)
    if (!id || seen.has(id)) continue
    seen.add(id)
    const m = ICON_BY_ID.get(id)
    if (m) out.push(m)
  }
  return out
}

const hasCredit = (i: ImageItem) => !!(i.author || i.license || i.source)

/** Pictures the user brought and credited, one per distinct credit. Structures drawn from SMILES need none. */
export function creditedImages(doc: Doc): ImageItem[] {
  const seen = new Set<string>()
  const out: ImageItem[] = []
  for (const it of doc.items) {
    if (it.type !== 'image' || it.smiles !== undefined || !hasCredit(it)) continue
    const key = [it.name, it.author, it.license, it.source].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(it)
  }
  return out
}

/** How many different pictures the user brought without saying whose they are or under what license. */
export function uncreditedImageCount(doc: Doc): number {
  const seen = new Set<string>()
  for (const it of doc.items) if (it.type === 'image' && it.smiles === undefined && !hasCredit(it)) seen.add(it.src)
  return seen.size
}

export function imageCredit(i: ImageItem): string {
  return [i.name || t('Image'), i.author ? ` ${t('by')} ${i.author}` : '', i.license ? ` (${i.license})` : '', i.source ? `, ${i.source}` : ''].join('')
}

/** The web address the artwork can be traced back to. */
const entryUrl = (m: IconMeta) => m.source

/** One credit per illustration, in the wording the collection itself asks for. */
function credit(m: IconMeta, recoloured: boolean): string {
  if (m.via) {
    // Commons wants the author, the license and a link to the file page.
    return t(
      recoloured
        ? '{label} by {author} ({license}, {via}, recoloured), {url}'
        : '{label} by {author} ({license}, {via}), {url}',
      { label: m.label, author: m.author, license: m.license, via: m.via, url: entryUrl(m) },
    )
  }
  if (!m.collection) {
    // CC BY asks that changes are mentioned, and recolouring is a change.
    return t(recoloured ? '{label} by {author} ({license}, recoloured)' : '{label} by {author} ({license})', {
      label: m.label,
      author: m.author,
      license: m.license,
    })
  }
  // CC BY asks that changes be mentioned, and recolouring is a change. Public domain drawings need
  // no adaptation note, so the wording is kept as the collection publishes it.
  const adapted = recoloured && m.license.startsWith('CC')
  return t('{collection}. ({date}). {label}{author}{license}{adapted}{doi}. NIAID NIH BioArt Source. {url}', {
    collection: m.collection,
    date: m.date ?? '',
    label: m.label,
    author: m.license.startsWith('CC') ? `. ${m.author}` : '',
    license: `. ${m.license}`,
    adapted: adapted ? t(', adapted') : '',
    doi: m.doi ? `. ${m.doi}` : '',
    url: entryUrl(m),
  })
}

export function creditsText(doc: Doc): string {
  const used = usedIcons(doc)
  const images = creditedImages(doc)
  if (!used.length && !images.length) return ''
  // CC BY asks that changes are mentioned, and recolouring is a change.
  const recoloured = new Set(doc.items.flatMap((i) => ((i.type === 'icon' || i.type === 'membrane') && i.colors ? [i.iconId] : [])))
  // The icon names stay in the original language so each credit can be traced to its source.
  const commons = used.filter((m) => m.via === 'Wikimedia Commons')
  const phylopic = used.filter((m) => m.via === 'PhyloPic')
  const health = used.filter((m) => m.via === 'Health Icons')
  const scidraw = used.filter((m) => m.via === 'SciDraw')
  const reactome = used.filter((m) => m.via === 'Reactome')
  const togotv = used.filter((m) => m.via === 'TogoTV')
  const bioart = used.filter((m) => m.collection && !m.via)
  const bioicons = used.filter((m) => !m.collection && !m.via && !m.custom)
  const custom = used.filter((m) => m.custom)
  const lines = []
  if (bioicons.length) {
    lines.push(
      t('Icons from Bioicons (bioicons.com): {list}.', { list: bioicons.map((m) => credit(m, recoloured.has(m.id))).join('; ') }),
    )
  }
  if (commons.length) {
    lines.push(
      t('Drawings from Wikimedia Commons: {list}.', { list: commons.map((m) => credit(m, recoloured.has(m.id))).join('; ') }),
    )
  }
  if (phylopic.length) {
    lines.push(
      t('Silhouettes from PhyloPic: {list}.', { list: phylopic.map((m) => credit(m, recoloured.has(m.id))).join('; ') }),
    )
  }
  if (health.length) {
    lines.push(
      t('Icons from Health Icons (healthicons.org): {list}.', {
        list: health.map((m) => credit(m, recoloured.has(m.id))).join('; '),
      }),
    )
  }
  if (scidraw.length) {
    lines.push(
      t('Drawings from SciDraw (scidraw.io): {list}.', { list: scidraw.map((m) => credit(m, recoloured.has(m.id))).join('; ') }),
    )
  }
  if (reactome.length) {
    lines.push(
      t('Icons from the Reactome Icon Library: {list}.', { list: reactome.map((m) => credit(m, recoloured.has(m.id))).join('; ') }),
    )
  }
  if (togotv.length) {
    // TogoTV asks for this exact notice with its illustrations.
    lines.push(
      t('Illustrations from TogoTV, © 2016 DBCLS TogoTV, CC BY 4.0: {list}.', {
        list: togotv.map((m) => credit(m, recoloured.has(m.id))).join('; '),
      }),
    )
  }
  if (bioart.length) {
    lines.push(
      t('Illustrations from the NIH BioArt Source: {list}.', { list: bioart.map((m) => credit(m, recoloured.has(m.id))).join('; ') }),
    )
  }
  if (custom.length) {
    lines.push(t('Your own drawings: {list}.', { list: custom.map((m) => credit(m, recoloured.has(m.id))).join('; ') }))
  }
  if (images.length) {
    lines.push(t('Imported images: {list}.', { list: images.map(imageCredit).join('; ') }))
  }
  return lines.join(' ')
}

export function wrapLines(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const word of text.split(' ')) {
    const next = cur ? `${cur} ${word}` : word
    if (cur && measureText({ text: next, fontSize, bold: false, italic: false }, true).w > maxWidth) {
      lines.push(cur)
      cur = word
    } else {
      cur = next
    }
  }
  if (cur) lines.push(cur)
  return lines
}
