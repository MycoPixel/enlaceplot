# Changelog

## 2026-10-25 — Three new icon sources: SciDraw, Reactome, TogoTV

The library grows from 2,886 to 4,120 drawings, with three imports modelled on the existing fetch scripts.

### New icon sources

- **SciDraw** (392 drawings): an open repository of peer-reviewed scientific illustrations; every drawing is CC BY 4.0 or CC0, chosen by its author. New `scripts/fetch_scidraw.py` reads the public JSON API at `scidraw.io/api/v1`, keeps the vector drawings, and links each credit back to the drawing's own page and Zenodo DOI. New `src/icons.scidraw.json`.
- **Reactome Icon Library** (219 icons): the glyph set of the Reactome pathway diagrams — cell elements, cell types, compounds, human tissue, proteins, receptors, therapeutics — in one consistent style, all CC BY 4.0. New `scripts/fetch_reactome.py` reads the rendered category pages at `reactome.org/icon-lib/<category>`. New `src/icons.reactome.json`.
- **TogoTV / Togo Picture Gallery** (623 illustrations): the drawing library of DBCLS, Japan, CC BY 4.0 with the notice "© 2016 DBCLS TogoTV / CC-BY-4.0". New `scripts/fetch_togotv.py` combines the archive's master CSV (titles, Japanese taxonomy tags, designer, DOI) with the image directory itself, streaming every download with a size cap so oversized files never land in the bundle. New `src/icons.togotv.json`.

### Integration

- `src/icons.ts` imports the three metadata files, maps them into `IconMeta` and adds SciDraw, Reactome and TogoTV to the library's source filter.
- `src/credits.ts` writes the credit wording each collection asks for: SciDraw credits its contributor, Reactome credits the library, TogoTV carries the "© 2016 DBCLS TogoTV" notice.
- `src/es.ts` translates the new credit lines, source names and categories (Animals, Viruses, Diagrams, Organisms, Cell Types, Receptors, Therapeutics, Arrows, Backgrounds).
- `scripts/make_credits.py` regenerates `ICON_CREDITS.md` with a table for each of the three new collections.
- New palette categories appear alongside the existing ones; plants (29 TogoTV drawings) were the thinnest category before.

## 2026-10-21 — Bug fixes, hardening and license

All changes below were made against the original source; `npm run build` (strict TypeScript) and `npm run lint` (oxlint) both pass clean.

### License

- Added the full **GNU General Public License v3** text as `LICENSE` (GPL-3.0-or-later).
- `package.json` now declares `"license": "GPL-3.0-or-later"`.
- README: replaced "The code has no license file yet" with a proper license statement, and made the offline claim match what the service worker actually caches.

### Critical bugs

- **Event-listener leak** (`src/App.tsx`): the `pagehide` listener was registered with an inline arrow and "removed" with a *different* inline arrow, so it was never removed and piled up on every re-mount. Both `visibilitychange` and `pagehide` now share one stable handler that is genuinely removed on cleanup.
- **Shared links re-imported on reload** (`src/App.tsx`): opening a `#fig=…` link imported the figure and saved it, but the hash was never cleared, so reloading re-imported the shared figure over the user's own edits. The hash is now cleared with `history.replaceState` right after the import.
- **One bad render blanked the whole editor** (`src/ErrorBoundary.tsx`, `src/ErrorBoundary.css`, `src/main.tsx`, `src/App.tsx`): added a React error boundary. The app shell is wrapped in `main.tsx` (friendly "Reload the editor" screen), and the Inspector — which renders whatever a figure contains — has its own boundary so a bad value hides the panel instead of taking the board down with it.
- **Stale service worker pinned users to old builds** (`public/sw.js`): the HTML shell was served cache-first with a hard-coded `'enlaceplot-v1'` cache name, so a new deploy never reached returning visitors. Navigations are now **network-first** (cache only when offline), hashed assets stay cache-first, and the cache version was bumped to `v2` so the old cache is deleted on activate.

### Performance

- **Snapshot fingerprint** (`src/App.tsx`): every state change — including every frame of a drag — ran `JSON.stringify(doc)` on a possibly multi-megabyte figure, twice. The "did it change" check now compares object identity, and the size limit for version snapshots is measured once inside the snapshot itself (at most one every few minutes), not per frame. The same identity change was applied to the three other places that recorded a fingerprint (boot, open figure, open project).
- **`ItemView` re-render defeat** (`src/Canvas.tsx`): the whole `doc` was passed to every memoised item view, so every change re-rendered every item. Markers now receive their computed number (`markerLabel`) as a plain value instead, worked out once per change in a `useMemo` map.
- **Gallery memory** (`src/store.ts`): `listFigures()` used `getAll()`, materialising every full document (photos included) at once. It now walks an IndexedDB cursor one row at a time and keeps only the metadata.

### Canvas interaction

- **Firefox wheel zoom barely moved** (`src/Canvas.tsx`): Firefox reports `deltaMode` line/page units, so Ctrl+wheel zoomed ~0.4% per notch. Line and page deltas are now scaled onto the pixel scale other browsers use.
- **No pinch-zoom on touch** (`src/Canvas.tsx`): two fingers now pinch the board in and out, keeping the board point between the fingers under the midpoint, and pan when the zoom is pinned at a limit. A second finger also cancels any half-drawn shape instead of fighting it, and non-primary pointers (extra fingers, pens) can no longer start tools or clear the selection (`isPrimary` guard).
- **Marker handles did nothing** (`src/Canvas.tsx`): selecting a marker drew rotate/resize handles that ignored presses and cleared the selection when clicked. Markers now get four rim handles that resize the marker (drag out from the centre), and no dead rotate handle.

### Exports

- **PNG export could exceed Safari's canvas cap** (`src/export.ts`): the 8000×8000 clamp limits the longest side but still allows 64 MP, past Safari's ~16.7 MP area limit, which produces a blank image. The scale is now also clamped by total area, and the same clamp drives `pngSize`, so the export dialog keeps telling the truth about pixel dimensions.

### Data integrity

- **Chart label double-escaping** (`src/charts.ts`): series names were HTML-escaped in the shared render model *and* again at the serialization boundary, so `A&T` showed as `A&amp;T` on screen and `A&amp;amp;T` in exports. `chartEls` now returns raw text; React escapes on screen and the exporter escapes into the SVG.
- **Silent zeroing of unparsable cells** (`src/charts.ts`): a cell like `n=3` or `1.2.3 ± 0.5` became a quiet 0 and drew bars that did not exist. `1.2.3 ± 0.5` no longer passes the ± pattern (the value and error must each be a real number), decimal commas (`8,2`) are read as `8.2`, a true minus sign (`−1.5`) is accepted, and any *non-empty* unparsable cell now refuses the paste and names the offending cells (series, column, value) instead. Empty cells still mean a gap and stay zero.
- **Number fields fought the keyboard** (`src/Inspector.tsx`): the chart Values and Error-bars textareas wrote the parsed numbers straight back into a controlled field, so typing `0.5` collapsed to `0` after the first keystroke. A `NumberListField` keeps the text exactly as typed until the field loses focus while applying every finished number immediately, and drops non-finite values so `NaN` can no longer reach the chart renderer.
- **Bad icon source URL could throw** (`src/Inspector.tsx`): `new URL(meta.source).hostname` threw on malformed icon metadata. A tolerant `hostOf()` helper falls back to showing the raw text.

### Type safety

- **`strict: true`** enabled in `tsconfig.app.json` — the codebase passes with no new suppressions, which locks in null-safety and narrowing guarantees going forward.
