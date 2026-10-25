import { useEffect, useRef, useState } from 'react'
import { uid } from './defaults'
import { thumbOf } from './export'
import { Glyph } from './Glyph'
import { t, useLang } from './i18n'
import { listSymbols, putSymbol, removeSymbol } from './store'
import { symbolFromSelection } from './symbols'
import type { SavedSymbol } from './symbols'
import type { Item } from './types'

export function SymbolsDialog({
  open,
  onClose,
  selected,
  onInsert,
}: {
  open: boolean
  onClose: () => void
  selected: Item[]
  onInsert: (sym: SavedSymbol) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const lang = useLang()
  const [symbols, setSymbols] = useState<SavedSymbol[] | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    let live = true
    setSymbols(null)
    listSymbols()
      .then((list) => {
        if (live) setSymbols(list)
      })
      .catch(() => {
        if (live) {
          setSymbols([])
          setError(t('Could not read saved symbols in this browser.'))
        }
      })
    return () => {
      live = false
    }
  }

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
    if (!open) return
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [open])

  const save = async () => {
    const built = symbolFromSelection(selected)
    if (!built) return
    const label = name.trim() || t('Untitled symbol')
    setBusy(true)
    setError('')
    try {
      const thumb = await thumbOf(
        { title: label, width: built.w, height: built.h, background: '#FFFFFF', transparent: true, items: built.items },
        260,
      ).catch(() => '')
      await putSymbol({
        id: uid(),
        name: label,
        updatedAt: Date.now(),
        w: built.w,
        h: built.h,
        items: built.items,
        thumb,
      })
      setName('')
      load()
    } catch {
      setError(t('Could not save the symbol in this browser.'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (sym: SavedSymbol) => {
    if (!window.confirm(t('Delete “{name}”? This only removes the saved symbol.', { name: sym.name }))) return
    setBusy(true)
    try {
      await removeSymbol(sym.id)
      load()
    } catch {
      setError(t('Could not delete the symbol in this browser.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} className="dialog dialog-wide" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="dialog-body">
        <header className="dialog-head">
          <h2>{t('Saved symbols')}</h2>
          <button type="button" className="icon-btn" aria-label={t('Close')} onClick={onClose}>
            <Glyph name="close" />
          </button>
        </header>
        <p className="note">
          {t('Save a group of parts once, then insert a fresh copy whenever you need it. Symbols stay in this browser.')}
        </p>
        <div className="symbol-save">
          <label className="field">
            <span>{t('Save selection as a symbol')}</span>
            <input
              value={name}
              maxLength={80}
              placeholder={t('Symbol name')}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && selected.length && !busy) void save()
              }}
            />
          </label>
          <button type="button" className="btn btn-primary" disabled={!selected.length || busy} onClick={() => void save()}>
            {t('Save selection')}
          </button>
        </div>
        {!selected.length && <p className="note small">{t('Select the parts you want to reuse, then name and save them here.')}</p>}
        {error && <p className="note error">{error}</p>}
        {symbols === null ? (
          <p className="note">{t('Loading…')}</p>
        ) : symbols.length === 0 ? (
          <p className="note">{t('No saved symbols yet.')}</p>
        ) : (
          <ul className="gallery">
            {symbols.map((sym) => (
              <li key={sym.id} className="gallery-item">
                <button
                  type="button"
                  className="gallery-thumb"
                  onClick={() => onInsert(sym)}
                  aria-label={t('Insert {name}', { name: sym.name })}
                >
                  {sym.thumb ? <img src={sym.thumb} alt="" /> : <Glyph name="group" size={34} />}
                </button>
                <span className="gallery-title" title={sym.name}>
                  {sym.name}
                </span>
                <span className="note small">{new Date(sym.updatedAt).toLocaleString(lang)}</span>
                <button type="button" className="icon-btn" aria-label={t('Insert {name}', { name: sym.name })} onClick={() => onInsert(sym)}>
                  <Glyph name="insert" />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={busy}
                  aria-label={t('Delete {name}', { name: sym.name })}
                  onClick={() => void remove(sym)}
                >
                  <Glyph name="trash" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('Close')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
