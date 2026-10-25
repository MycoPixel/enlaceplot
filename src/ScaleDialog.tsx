import { useEffect, useRef, useState } from 'react'
import { unionAabb } from './geometry'
import { Glyph } from './Glyph'
import { t, useLang } from './i18n'
import type { Doc, Item } from './types'

const UNITS = ['µm', 'mm', 'cm', 'in']
const round2 = (n: number) => Math.round(n * 100) / 100

export function ScaleDialog({
  open,
  doc,
  selected,
  onClose,
  onSave,
  onClear,
}: {
  open: boolean
  doc: Doc
  selected: Item[]
  onClose: () => void
  onSave: (pxPerUnit: number, unit: string) => void
  onClear: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useLang()
  const [boardPx, setBoardPx] = useState(100)
  const [real, setReal] = useState(10)
  const [unit, setUnit] = useState(doc.scale?.unit ?? 'µm')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      const visible = selected.filter((i) => !i.hidden)
      const box = visible.length ? unionAabb(visible) : null
      const px = box ? Math.max(1, Math.max(box.w, box.h)) : doc.scale ? doc.scale.pxPerUnit * 10 : 100
      setBoardPx(round2(px))
      setReal(doc.scale ? round2(px / doc.scale.pxPerUnit) : 10)
      setUnit(doc.scale?.unit ?? 'µm')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open, selected, doc.scale])

  const valid = boardPx > 0 && real > 0 && !!unit.trim()
  const selectable = selected.some((i) => !i.hidden)

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="dialog-body">
        <header className="dialog-head">
          <h2>{t('Figure scale')}</h2>
          <button type="button" className="icon-btn" aria-label={t('Close')} onClick={onClose}>
            <Glyph name="close" />
          </button>
        </header>

        <p className="note">
          {selectable
            ? t('The selected item is {px} px long. Set what that length represents in real life; the ruler uses this scale.', {
                px: round2(boardPx),
              })
            : t('Select a scale bar or any item of known length, then open this again. You can also type a board length below.')}
        </p>

        <div className="grid2">
          <label className="field">
            <span>{t('Length on board (px)')}</span>
            <input
              type="number"
              min={1}
              step={1}
              value={boardPx}
              onChange={(e) => Number.isFinite(e.target.valueAsNumber) && setBoardPx(e.target.valueAsNumber)}
            />
          </label>
          <label className="field">
            <span>{t('Real length')}</span>
            <input
              type="number"
              min={0.0001}
              step={0.1}
              value={real}
              onChange={(e) => Number.isFinite(e.target.valueAsNumber) && setReal(e.target.valueAsNumber)}
            />
          </label>
          <label className="field">
            <span>{t('Unit')}</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>

        {valid && (
          <p className="export-summary">
            {t('1 {unit} = {px} board pixels', { unit, px: round2(boardPx / real) })}
          </p>
        )}

        <div className="dialog-actions">
          {doc.scale && (
            <button type="button" className="btn" onClick={onClear}>
              {t('Clear scale')}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            {t('Cancel')}
          </button>
          <button type="button" className="btn btn-primary" disabled={!valid} onClick={() => valid && onSave(boardPx / real, unit)}>
            {t('Save scale')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
