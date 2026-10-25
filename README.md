# EnlacePlot

A free, open figure editor for biology. Drag cells, tubes and receptors onto a board, label them, add arrows, and export clean SVG or PNG.
React, TypeScript and Vite. No server, no account: everything runs in the browser and saves itself in this browser, so it also works offline once opened.

## Run it

```bash
npm install
npm run dev        # development
npm run build      # static site in dist/ (works from any folder or static host)
npm run preview    # serve the built site
```

Serve `dist/` over HTTP (GitHub Pages, Netlify, `npm run preview`). Opening `dist/index.html` straight from disk will not work, because browsers block module scripts on `file://`.

## What it does

- 4,120 drawings in ~80 categories, all searchable: 1,635 icons from Bioicons (chemistry, lab apparatus, amino acids, nucleic acids, safety symbols, microbiology, parasites, physiology and more), 669 illustrations from the [NIH BioArt Source](https://bioart.niaid.nih.gov) (viruses, parasites, cells, lab equipment, people, data visualisation), 623 illustrations from [TogoTV / Togo Picture Gallery](https://togotv.dbcls.jp/pics) (DBCLS: model organisms, organs, cells, lab apparatus, plants), 392 drawings from [SciDraw](https://scidraw.io) (animals, cells, arthropods), 219 pathway glyphs from the [Reactome Icon Library](https://reactome.org/icon-lib) (cell elements, cell types, compounds, tissue, proteins, receptors, therapeutics), 69 lab glassware and apparatus drawings from [Wikimedia Commons](https://commons.wikimedia.org) (volumetric flasks, Kjeldahl flasks, graduated cylinders, reagent bottles, condensers, GHS pictograms), 126 organism silhouettes from [PhyloPic](https://www.phylopic.org) (plants, fungi, microbes, fish, birds, invertebrates), 386 clinical and public health icons from [Health Icons](https://healthicons.org) (symptoms, devices, diagnostics, medication, protective gear, health facilities), and drawings added to the project itself, such as the NMR spectrometer. Click to add or drag onto the board.
- Recolour any icon: the Colours section lists the colours the icon uses, and each one can be swapped. Recoloured icons are credited as "recoloured", as CC BY asks.
- Replace icon: swap an icon for another drawing from the library and it keeps its position, size, flip, opacity and any colours you set on it. It works on a whole selection at once, and undo puts the old drawing back.
- Straight, elbow and curved arrows, with a choice of arrowhead at either end (including an inhibition bar, ⊣). Drag the diamond handle to bend them. Select anything and Properties, Repeat makes a row, column or grid of copies in one step.
- Group items (Ctrl/Cmd+G, ungroup with Shift) so they select and move together. Alt-click picks one item inside a group. "Scale together" grows or shrinks a selection.
- Insert menu: panel labels (A, B, C…), a scale bar, a numbered marker and a marker legend, a panel grid (A–F and so on, with a frame), a chemical structure drawn from a SMILES string, a sequence pasted as FASTA, and your own SVG, PNG, JPG, WebP or GIF (also by dropping files on the board or pasting a copied picture).
- Numbered markers for a caption that refers back to "1", "2", "3". Markers are numbered in reading order, top to bottom and then left to right, so moving one renumbers the rest; give each one a label in Properties and the legend is written for you and kept up to date as you work.
- Templates: graphical abstract, signalling pathway, workflow with panels A–D, and a 96-well plate layout, from File, Start from a template. Undo brings your own figure back if you pick one by mistake.
- Well plates, gels and dishes: Insert, Well plate gives a grid of wells (6 to 384) with row and column labels, Insert, Gel or blot gives numbered lanes with evenly spaced bands, and Insert, Petri dish draws colonies, streaks, a serial dilution series or inhibition zones. All of them land on the board as ordinary shapes you can repaint, move and delete.
- Charts: Insert, Chart from a table turns a pasted table into a bar chart, line graph or scatter plot. The first row names the categories, each row below is a series, and `8.2 ± 0.6` gives a point an error bar. Select the chart to change its data, colours and axis labels in Properties.
- My figures: everything you draw is kept in the browser, so File, My figures shows your figures as thumbnails and opens any of them. Files you saved with Save project still open with Open project. Nothing is uploaded anywhere.
- Version history: while you work, EnlacePlot keeps up to 30 snapshots of the figure (at most one every few minutes, plus one whenever you ask). File, Version history lists them; restoring one first saves the current state as a new version, so a wrong turn is always recoverable.
- Share by link: File, Copy link to this figure packs the whole figure into the address. Anyone who opens it gets an editable copy, with nothing uploaded to a server; a figure too large for a link asks you to send the project file instead. The app is also installable: the browser caches the app shell and code on the first visit, so it still opens without a connection, while the 4,120-icon library itself is fetched from the network as needed.
- Colourblind preview in the top bar shows the board as a deuteranopic or protanopic reader sees it. It is a view only: SVG, PNG and PDF exports always keep the colours the figure really has.
- Library tools: filter by source (Bioicons, NIH BioArt, Wikimedia Commons, PhyloPic, Health Icons, SciDraw, Reactome, TogoTV, Your icons) and by license (CC0 and public domain, or needs credit), star favourites, and a Recent tab with what you used last. The badge on a tile says CC0, PD (public domain) or BY (credit needed). The list only draws the rows you are looking at, so all 4,120 icons scroll without the page struggling.
- Copy, cut and paste (Ctrl/Cmd+C, X, V) of whatever is selected, also between tabs. Groups stay groups.
- Text: sub- and superscripts typed as `H_{2}O` and `Ca^{2+}` (or select text and use the x₂ / x² buttons in Properties), and a choice of sans-serif (Arial), serif (Times) or monospace (Courier).
- Your own images can carry an author, license and link; they are added to the credit line, and the Credits window warns about images that have none.
- Connected arrows: draw an arrow from one item to another, or drag a round handle of an existing arrow onto an item, and the end attaches (it turns solid in the selection). When you move, resize or rotate that item the arrow follows. The end sits where a line to the other end crosses the item's outline, or on a side you choose in Properties (Connections). Elbow arrows between two items pick the sides facing each other. Hold Alt to keep an end free; drag an end into empty space to detach it; dragging the arrow on its own detaches it too. Copies of an arrow stay attached only to items copied with it. A large shape (more than half the board) counts as a backdrop, so an arrow only attaches to it near its edge.
- Membrane tool (M): drag a line and a lipid icon is repeated along it as a bilayer (or a single layer); drag a wobbly freehand path instead and the lipids follow its bends, and Straighten in Properties turns it back into a smooth line. Straight or curved (drag the diamond), with a choice of lipid from the library, lipid width, spacing, the gap between the two layers, an irregularity slider (a little random variation in position, angle and size, with Shuffle to draw a new one) and recolouring. Each layer is spaced along its own side of a curve, so the outer layer holds more lipids than the inner one. The lipid is credited like any other icon, and in SVG export it is defined once and reused, so the file stays small.
- Text, arrows (with arrowheads, dashes), rectangles and ellipses. Move, resize, rotate, flip, opacity, layers (hide, lock, reorder), align, duplicate.
- More shapes, behind the **More shapes** button in the toolbar: a plain line (L), bracket (B), brace (C), callout (O), polygon (P) and a curve (N). Line, bracket, brace and callout are dragged across the board like any other shape. For a polygon or a curve, click to drop each corner, then double-click, press Enter, or click the first corner again to close a polygon; Escape throws the shape away. Corners are stored as fractions of the shape's box, so resizing and rotating carry them along, and the drawing follows exactly into the SVG and PDF.
- Marquee select, grid and snap, zoom (Ctrl/Cmd + wheel), pan (hold Space or middle mouse), undo and redo.
- Smart guides: dragging an item lines its edges and centre up with the same on anything else on the board, and with the board's own edges and centre, and the line is drawn as you go. Hold nothing; it just works. With *Snap to grid* on, the grid only wins when it lands closer than an object does.
- Arrange: align a selection's edges and centres to each other, align to the edges or the centre of the board, and distribute horizontally or vertically so the gaps come out equal and the two outermost items stay put.
- Zoom to the selection (Ctrl/Cmd+Shift+2) to work on part of a figure; Ctrl/Cmd+Shift+1 or Ctrl/Cmd+0 fits the whole board.
- Export SVG (icons stay editable vectors, openable in Inkscape or Illustrator), PNG at 1×, 2× or 4×, and a `.enlaceplot.json` project file. *More export options* adds: the whole board or only the selection; a size in millimetres with journal presets (Nature, Science, Cell, PLOS, one or two columns, and a full A4 page) and a resolution in dpi, which is also written into the PNG so other programs place it at that physical size; and a vector PDF. The PDF is made by the browser's print engine: the figure goes onto a page of exactly its size and the print window opens, where you choose *Save as PDF*. *Copy figure as image* puts a PNG on the clipboard (the selection, if there is one).
- A credit line for every icon you used, copyable and optionally added under exported images.
- English and Spanish (Español). The language follows your browser the first time, and the globe menu in the top bar switches it. Icon names and search work in both languages for every icon, and search ignores case and accents, so "celula" finds "célula"; credit lines keep the original English icon names so each one can be traced to its source.

Shortcuts: V select, T text, A arrow, R rectangle, E ellipse, L line, B bracket, C brace, O callout, P polygon, N curve. Delete removes. Arrow keys nudge (Shift for 10). Ctrl/Cmd+Z undo, +Shift redo, +D duplicate, +C copy, +X cut, +V paste, +G group (+Shift ungroup), +A select all, +S save project, +0 fit the board, +Shift+1 fit the board, +Shift+2 zoom to the selection. `[` and `]` reorder layers.

## Licenses

The icons keep their own licenses, listed per icon in [ICON_CREDITS.md](ICON_CREDITS.md). Please read it before redistributing the app with the icons included.
The NIH BioArt illustrations are free for any use, including commercial ([terms](https://bioart.niaid.nih.gov/terms)); most are public domain, the Human Reference Atlas ones are CC BY 4.0. The collection asks that the entry an illustration comes from is named, which is what the credit line does. SciDraw drawings are CC BY 4.0 or CC0 (the author's choice) and are credited to their authors. The Reactome Icon Library is CC BY 4.0 ([license](https://reactome.org/license)). TogoTV illustrations are CC BY 4.0 with the notice "© 2016 DBCLS TogoTV / CC-BY-4.0".
Structures are drawn with [smiles-drawer](https://github.com/reymond-group/smilesDrawer) (MIT), loaded only when you open the structure dialog. Images you import are yours: they are not part of the icon credits, so check their licenses yourself.
The code is released under the [GNU General Public License v3](LICENSE) (GPL-3.0-or-later). The icons keep their own licenses, listed per icon in [ICON_CREDITS.md](ICON_CREDITS.md); including them does not change their terms, and redistributing the app with the icons included means respecting both.

## Adding or refreshing icons

```bash
git clone --depth 1 https://github.com/duerrsimon/bioicons.git
python3 scripts/curate_icons.py bioicons/static/icons . --max-kb 50   # copy permissive icons, rebuild src/icons.json
python3 scripts/expand_viewboxes.py .                                  # needs: pip install playwright
python3 scripts/make_credits.py .                                      # regenerate ICON_CREDITS.md
```

`--max-kb` keeps the bundle small: 50 KB leaves out about 1,050 very detailed icons (mostly large illustrations). Raise it to include more.
Existing icon ids are kept, so saved figures keep working.

The script only accepts CC0, MIT and CC BY 3.0/4.0 icons, and skips logos and icons with embedded bitmaps. It records author and license for each one, which is what feeds the credits.

### Health Icons

```bash
python3 scripts/fetch_healthicons.py .                 # the categories below, rebuild src/icons.healthicons.json
python3 scripts/fetch_healthicons.py . --dry-run
python3 scripts/fetch_healthicons.py . --styles outline --limit 50
```

[Health Icons](https://healthicons.org) is run by the public health non-profit Resolve to Save Lives and released under **CC0**, the easiest license to work with here. It covers what the rest of the library lacks: symptoms and conditions, medical devices, diagnostics, medication, protective equipment, public health and health facilities. One metadata file in the project's repository lists every icon; the drawings sit beside it as outline or filled SVGs. The importer maps each icon to a palette category (see `CATEGORIES` at the top of the file), rewrites `fill="currentColor"` as an explicit black so the app can recolour the icons, and leaves out what `scripts/healthicons_block.txt` lists: product logos, data standards such as FHIR and LOINC, the website's own interface glyphs, and every "ALT" twin of an icon already taken.

### PhyloPic

```bash
python3 scripts/fetch_phylopic.py .                  # the taxon list, rebuild src/icons.phylopic.json
python3 scripts/fetch_phylopic.py . --dry-run
python3 scripts/fetch_phylopic.py . --taxa "Arabidopsis thaliana:Plants"
```

[PhyloPic](https://www.phylopic.org) is a community library of flat silhouettes of living things (13,000+, mostly public domain). The script keeps the organisms in `TAXA` at the top of the file, resolves each name through the API's autocomplete, and takes a few silhouettes per organism. They are one-colour vectors, so they recolour like the rest of the library. Share-alike silhouettes are left out unless `--allow-sharealike`; answers are cached in `.cache/phylopic`.

### Wikimedia Commons

```bash
python3 scripts/fetch_commons.py .                    # walk the categories, rebuild src/icons.commons.json
python3 scripts/fetch_commons.py . --dry-run          # report what it would take
python3 scripts/fetch_commons.py . --cats "Category:Laboratory glassware icons:Laboratory glassware"
```

Commons is a directory, not a curated library, so the script reads the license of every file from its file page and keeps only public domain, CC0 and CC BY. Share-alike, non-commercial, GFDL and unknown licenses are dropped, as are logos, badges, emojis, drawings with embedded bitmaps, and anything whose name the library already uses. `scripts/commons_block.txt` lists the rest that get left out (icon-pack leftovers, non-English names, clipart, colour variants). Commons answers HTTP 429 after a handful of API calls, so calls are delayed, retried and cached in `.cache/commons`.

### NIH BioArt Source

```bash
python3 scripts/fetch_bioart.py .            # crawl the collection, download SVGs, rebuild src/icons.bioart.json
python3 scripts/fetch_bioart.py . --dry-run  # report what it would take
python3 scripts/fetch_bioart.py . --only 500 # re-import single entries
```

It walks the entry ids (`/bioart/<id>`), reads the collection, creator, licensing and categories off each entry page, and downloads the SVG of every representation. Entry pages are cached in `.cache/`, so a second run needs no requests, and SVGs already in `public/icons/` are not downloaded again.

Colour variants (the same drawing in 12 colours) are skipped, since the app recolours vectors; so are files over `--max-kb`, drawings with embedded bitmaps, and anything without an SVG. Ids are `bioart-<entry>-<name>`, so they never clash with the Bioicons ones. Per icon the script records the collection, the submission date and the entry DOI, which is what the credit line needs.

### SciDraw

```bash
python3 scripts/fetch_scidraw.py .            # walk the catalogue, download SVGs, rebuild src/icons.scidraw.json
python3 scripts/fetch_scidraw.py . --dry-run  # report what it would take
python3 scripts/fetch_scidraw.py . --limit 40 # trial run on the first 40 drawings
```

[SciDraw](https://scidraw.io) is an open repository of peer-reviewed scientific illustrations contributed by researchers; every drawing is CC BY 4.0 or CC0, chosen by its author. The script reads the public JSON API at `scidraw.io/api/v1` (`/drawings/`, cursor pagination), keeps the vector drawings, and links each credit back to the drawing's own page, which carries the author and a Zenodo DOI. API pages are cached in `.cache/scidraw`, so a second run needs no requests. Ids are `scidraw-<uuid8>-<name>`.

### Reactome Icon Library

```bash
python3 scripts/fetch_reactome.py .            # crawl the category pages, download SVGs, rebuild src/icons.reactome.json
python3 scripts/fetch_reactome.py . --dry-run  # report what it would take
```

The [Reactome Icon Library](https://reactome.org/icon-lib) is the glyph set of the [Reactome](https://reactome.org) pathway diagrams: cell elements, cell types, compounds, human tissue, proteins, receptors and therapeutics, in one consistent style, all CC BY 4.0. The script reads the rendered category pages (`/icon-lib/<category>`), which list every icon as an `<img>` with its name, and records the category page so each credit links back. An icon listed in two categories keeps the more specific one. Pages are cached in `.cache/reactome`. Ids are `reactome-r-ico-<n>`.

### TogoTV / Togo Picture Gallery

```bash
python3 scripts/fetch_togotv.py .             # read the master list and the archive, download SVGs, rebuild src/icons.togotv.json
python3 scripts/fetch_togotv.py . --dry-run   # report what it would take
python3 scripts/fetch_togotv.py . --max-kb 200  # keep bigger drawings too
```

[TogoTV](https://togotv.dbcls.jp/pics) is the illustration library of DBCLS, the Database Center for Life Science in Japan; the drawings are CC BY 4.0 and the collection asks the notice "© 2016 DBCLS TogoTV / CC-BY-4.0", which the credit line carries. The script combines two views of the archive at `dbarchive.biosciencedbc.jp`: the master CSV (539 curated entries with titles, Japanese taxonomy tags, designer and DOI) and the image directory itself (2,000+ SVGs, where the file name is the title and the collection-level credit applies). Files are streamed with a size cap, so an oversized drawing never downloads in full; the CSV and listing are cached in `.cache/togotv`. Ids are `togotv-<picture id>-<name>`.

## How it is built

- `src/Canvas.tsx`: the SVG board, selection, handles, drag, resize, rotate.
- `src/IconGrid.tsx`: the icon tiles. It draws only the rows on screen and places them itself, so the scroll bar is always the full length of the list. `src/iconFilter.ts` holds the search and filters behind it, shared with the *Replace icon* window.
- `src/icons.ts`: loads and cleans icon files. Icons are inlined so exports stay vector; ids are scoped per item so repeated icons never clash. Icons that carry their own `<style>` are embedded as isolated images.
- `src/export.ts`: builds the SVG and PNG from the document, not from the screen. `src/shapes.ts` holds the geometry of every shape as plain SVG, so the board and the export draw the same thing.
- Figure text uses Arial/Helvetica on purpose, so exports look the same on every machine.

## Adding a language

All interface text is written in English in the code, as `t('English text')`, and `src/es.ts` maps each string to Spanish (a missing entry simply shows English). To add another language, add a dictionary like `es.ts`, a per-icon names file like `src/icons.es.json` (`{ "icon-id": "name" }`, only names that differ), and a line in `LANGS` and `t()` in `src/i18n.ts`. `python3 scripts/check_i18n.py` lists any string that has no translation or whose `{placeholders}` do not match.

Known gaps: error text from the SMILES parser is only translated for the most common message, the page description in `index.html` is English, and there is no shared editing.
