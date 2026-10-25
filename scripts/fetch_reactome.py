#!/usr/bin/env python3
"""Import icons from the Reactome Icon Library (reactome.org) into the app.

Usage:
    python3 scripts/fetch_reactome.py .                 # crawl every category, write src/icons.reactome.json
    python3 scripts/fetch_reactome.py . --limit 40      # trial run on the first 40 icons
    python3 scripts/fetch_reactome.py . --dry-run       # report what would be taken, download nothing
    python3 scripts/fetch_reactome.py . --refresh       # re-download SVGs already on disk

The Reactome Icon Library is the set of glyphs the Reactome pathway diagrams are drawn with:
cell elements, cell types, compounds, human tissue, ion channels, proteins, receptors and
therapeutics, each in a consistent visual style. The category pages at /icon-lib/<category> list
every icon as <img src="/icon/R-ICO-nnnnnn.svg" alt="Name">, which is what this script walks.
Reactome content is CC BY 4.0 (https://reactome.org/license), so every icon is credited.

Only SVGs are taken; files that embed raster images, and files over --max-kb, are skipped, since
public/icons/ ships with the app. Ids are `reactome-r-ico-<n>`, so they never clash with the other
sources and stay stable between runs, which keeps saved figures working.
"""
import argparse, collections, concurrent.futures as cf, html as htmlmod, json, os, re, sys, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET

SITE = "https://reactome.org"
CATEGORIES = [  # slug on /icon-lib/<slug>, name shown in the app's palette
    ("arrow", "Arrows"),
    ("background", "Backgrounds"),
    ("cell_element", "Cells and Organelles"),
    ("cell_type", "Cell Types"),
    ("compound", "Molecules"),
    ("human_tissue", "Anatomy"),
    ("protein", "Proteins"),
    ("receptor", "Receptors"),
    ("therapeutic", "Therapeutics"),
]
LICENSE_URL = "https://reactome.org/license"
UA = "figure-editor/1.0 (https://github.com/; one-off import script)"


def get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def clean(svg):
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg)
    svg = re.sub(r"<!DOCTYPE[^\[>]*(\[.*?\])?\s*>", "", svg, flags=re.S)
    svg = re.sub(r'\s+xmlns:[\w.-]+="&[^"]*;"', "", svg)  # Illustrator entity namespaces
    svg = re.sub(r"<script\b.*?</script>", "", svg, flags=re.S | re.I)
    svg = re.sub(r'\son\w+\s*=\s*"[^"]*"', "", svg, flags=re.I)
    svg = re.sub(r"<metadata\b.*?</metadata>", "", svg, flags=re.S | re.I)
    return svg.strip()


def valid(svg):
    try:
        root = ET.fromstring(svg.encode("utf-8"))
    except ET.ParseError:
        return False
    return root.tag.endswith("}svg") or root.tag == "svg"


def dims(svg):
    tag = re.search(r"<[a-z0-9]*:?svg[^>]*>", svg, re.I | re.S)
    tag = tag.group(0) if tag else ""
    vb = re.search(r'viewBox\s*=\s*"([^"]+)"', tag)
    if vb:
        p = [float(x) for x in re.split(r"[ ,]+", vb.group(1).strip())]
        if len(p) == 4 and p[2] > 0 and p[3] > 0:
            return p

    def num(a):
        mm = re.search(a + r'\s*=\s*"([\d.]+)', tag)
        return float(mm.group(1)) if mm else None

    w, h = num("width"), num("height")
    return [0, 0, w, h] if w and h else [0, 0, 100, 100]


def category_pages(cache, delay, dry_run):
    """Icons per category, read off the rendered category pages.

    Pages are cached, so a second run needs no requests. An icon can be listed in more than one
    category (a receptor is also a protein); the first category in CATEGORIES order wins, so the
    most specific one is kept.
    """
    icons, seen = [], {}
    for cat, label in CATEGORIES:
        path = os.path.join(cache, f"{cat}.html") if cache else None
        if path and os.path.exists(path):
            page = open(path, encoding="utf-8").read()
        else:
            try:
                page = get(f"{SITE}/icon-lib/{cat}").decode("utf-8", "ignore")
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
                print(f"  !! {cat}: {e}", flush=True)
                continue
            if path and not dry_run:
                os.makedirs(cache, exist_ok=True)
                open(path, "w", encoding="utf-8").write(page)
            time.sleep(delay)
        n = 0
        for m in re.finditer(r'<img[^>]+src="(/icon/R-ICO-\d+\.svg)"[^>]*alt="([^"]*)"', page, re.S):
            src, alt = m.group(1), htmlmod.unescape(m.group(2))
            icon_id = slug(re.search(r"R-ICO-(\d+)", src).group(0))
            if icon_id in seen:
                continue
            seen[icon_id] = label
            icons.append({"icon": re.search(r"R-ICO-\d+", src).group(0), "id": icon_id, "label": alt.strip(), "category": label})
            n += 1
        print(f"  {cat}: {n} icons", flush=True)
    return icons


def fetch_svg(icon, tries=4):
    """Cleaned SVG of one icon; a file is only kept once it parses, so truncated
    downloads are fetched again."""
    for attempt in range(tries):
        try:
            raw = get(f"{SITE}/icon/{icon}.svg").decode("utf-8", "ignore")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError):
            time.sleep(1 + 2 * attempt)
            continue
        svg = clean(raw)
        if valid(svg):
            return svg
        time.sleep(1 + 2 * attempt)
    return ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("app", help="the figure-editor folder")
    ap.add_argument("--limit", type=int, default=0, help="only take the first N icons")
    ap.add_argument("--jobs", type=int, default=6)
    ap.add_argument("--delay", type=float, default=0.2, help="seconds to wait between requests")
    ap.add_argument("--max-kb", type=float, default=100)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--refresh", action="store_true", help="download SVGs that are already on disk")
    ap.add_argument("--cache", default=".cache/reactome", help="folder for category pages, relative to the app")
    ap.add_argument("--no-cache", action="store_true", help="always ask the site, ignoring the cache")
    a = ap.parse_args()

    out_dir = os.path.join(a.app, "public", "icons")
    os.makedirs(out_dir, exist_ok=True)
    cache = None if a.no_cache else (a.cache if os.path.isabs(a.cache) else os.path.join(a.app, a.cache))

    icons = category_pages(cache, a.delay, a.dry_run)
    if a.limit:
        icons = icons[: a.limit]
    print(f"{len(icons)} icons on the category pages")

    cat_to_slug = {label: slug for slug, label in CATEGORIES}

    def one(ic):
        iid = f"reactome-{ic['id']}"
        path = os.path.join(out_dir, iid + ".svg")
        if os.path.exists(path) and not a.refresh and not a.dry_run:
            svg = open(path, encoding="utf-8").read()
        else:
            svg = fetch_svg(ic["icon"])
            if not svg:
                return None, "SVG not downloadable"
            if re.search(r"<image\b", svg) or "data:image" in svg:
                return None, "embedded raster image"
            if len(svg) > a.max_kb * 1000:
                return None, f"over {a.max_kb:g} KB"
            if not a.dry_run:
                open(path, "w", encoding="utf-8").write(svg)
            time.sleep(a.delay)
        row = {
            "id": iid,
            "label": ic["label"] or ic["icon"],
            "category": ic["category"],
            "author": "Reactome",
            "license": "by4",
            # The category page on /icon-lib, so every icon links back to where it is listed.
            "cat": cat_to_slug[ic["category"]],
            "inline": "<style" not in svg.lower(),
            "viewBox": [round(x, 3) for x in dims(svg)],
        }
        return row, None

    skipped = collections.Counter()
    rows = []
    with cf.ThreadPoolExecutor(max_workers=a.jobs) as ex:
        for row, why in ex.map(one, icons):
            if row:
                rows.append(row)
            else:
                skipped[why] += 1

    rows.sort(key=lambda r: (r["category"].lower(), r["label"].lower(), r["id"]))
    if not a.dry_run:
        path = os.path.join(a.app, "src", "icons.reactome.json")
        old = {}
        if os.path.exists(path):
            for r in json.load(open(path))["icons"]:
                old[r["id"]] = r
        for r in rows:
            old.setdefault(r["id"], r)
        rows = [old[k] for k in sorted(old)]
        json.dump({"icons": rows}, open(path, "w"), ensure_ascii=False, separators=(",", ":"))

        # A full run drops icons that are gone or filtered out now, and their files with them.
        keep = {r["id"] + ".svg" for r in rows}
        for f in os.listdir(out_dir):
            if f.startswith("reactome-") and f not in keep:
                os.remove(os.path.join(out_dir, f))

    print(f"{len(rows)} icons from the Reactome Icon Library" + (" (dry run, nothing written)" if a.dry_run else ""))
    print("skipped:", dict(skipped))
    print("categories:", dict(collections.Counter(r["category"] for r in rows).most_common(12)))


if __name__ == "__main__":
    sys.exit(main())
