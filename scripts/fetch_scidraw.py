#!/usr/bin/env python3
"""Import drawings from SciDraw (scidraw.io) into the app.

Usage:
    python3 scripts/fetch_scidraw.py .                 # walk the whole catalogue, write src/icons.scidraw.json
    python3 scripts/fetch_scidraw.py . --limit 40      # trial run on the first 40 drawings
    python3 scripts/fetch_scidraw.py . --dry-run       # report what would be taken, download nothing
    python3 scripts/fetch_scidraw.py . --refresh       # re-download SVGs already on disk

SciDraw is an open repository of scientific illustrations where every upload is CC BY 4.0 or CC0
(https://scidraw.io/terms). It has a public JSON API at https://scidraw.io/api/v1:
`/drawings/` lists drawings (32 per page, cursor pagination), `/categories/` the categories, and
`/drawings/<id>/download/` the file itself. The drawing pages sit at /drawings/<id>, which is what
the credit line links to; each drawing also carries a Zenodo DOI for citable credit.

Only vector drawings are taken (is_vector=true, image_type svg). Drawings that embed raster
images, and files over --max-kb, are skipped, since public/icons/ ships with the app.

API pages are fetched politely (--jobs at a time, --delay between them) and cached in --cache, so
a second run needs no requests. Re-running is cheap: drawings whose SVG is already on disk are
skipped unless --refresh is given. Ids are `scidraw-<uuid8>-<name>`, so they never clash and stay
stable between runs, which keeps saved figures working.
"""
import argparse, collections, concurrent.futures as cf, json, os, re, sys, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET

API = "https://scidraw.io/api/v1"
SITE = "https://scidraw.io"
UA = "figure-editor/1.0 (https://github.com/; one-off import script)"
# SciDraw lets its contributors choose CC BY 4.0 or CC0 for every drawing (scidraw.io/terms).
LICENSES = {"cc-by": "by4", "cc0": "cc0", "cc-by-4.0": "by4", "cc-by-3.0": "by3", "public domain": "cc0", "pd": "cc0"}
# Map the API's category slugs onto the palette categories the library already shows.
CATEGORIES = {
    "cell": "Cells and Organelles",
    "drosophila": "Arthropods",
    "mouse": "Animals",
    "rat": "Animals",
    "fish": "Animals",
    "bird": "Animals",
    "human": "People",
    "other": "Other",
}


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


def walk_catalogue(jobs, delay, cache):
    """Every vector drawing in the catalogue, following the cursor pagination.

    Pages are cached by their cursor token, so a later run over the same catalogue reads from disk.
    """
    pages, cursor, seen = [], "", set()
    while True:
        key = slug(cursor) or "first"
        path = os.path.join(cache, f"page-{key}.json") if cache else None
        if path and os.path.exists(path):
            page = json.load(open(path))
        else:
            page = json.loads(get(f"{API}/drawings/?is_vector=true&ordering=-times_downloaded&cursor={cursor}").decode("utf-8", "ignore"))
            if path:
                os.makedirs(cache, exist_ok=True)
                json.dump(page, open(path, "w"))
            time.sleep(delay)
        pages.append(page)
        nxt = page.get("next") or ""
        m = re.search(r"cursor=([^&]*)", nxt)
        if not m or m.group(1) in seen:
            break
        seen.add(m.group(1))
        cursor = m.group(1)
        print(f"  {len(pages)} pages, {sum(len(p['results']) for p in pages)} drawings", flush=True)
    rows = {}
    for page in pages:
        for r in page["results"]:
            rows[r["id"]] = r
    return list(rows.values())


def fetch_svg(url, tries=4):
    """Cleaned SVG of one drawing; a file is only kept once it parses, so truncated
    downloads are fetched again."""
    for attempt in range(tries):
        try:
            raw = get(url).decode("utf-8", "ignore")
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
    ap.add_argument("--limit", type=int, default=0, help="only take the first N drawings")
    ap.add_argument("--jobs", type=int, default=6)
    ap.add_argument("--delay", type=float, default=0.2, help="seconds to wait between requests")
    ap.add_argument("--max-kb", type=float, default=100)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--refresh", action="store_true", help="download SVGs that are already on disk")
    ap.add_argument("--cache", default=".cache/scidraw", help="folder for API pages, relative to the app")
    ap.add_argument("--no-cache", action="store_true", help="always ask the API, ignoring the cache")
    a = ap.parse_args()

    out_dir = os.path.join(a.app, "public", "icons")
    os.makedirs(out_dir, exist_ok=True)
    cache = None if a.no_cache else (a.cache if os.path.isabs(a.cache) else os.path.join(a.app, a.cache))

    drawings = walk_catalogue(a.jobs, a.delay, cache)
    print(f"{len(drawings)} vector drawings in the catalogue")

    # Licence and format first: those need no download to decide.
    skipped = collections.Counter()
    candidates = []
    for r in drawings:
        if a.limit and len(candidates) >= a.limit:
            break
        lic = LICENSES.get((r.get("license") or "").lower())
        if not lic:
            skipped[f"license {r.get('license') or 'unknown'}"] += 1
            continue
        url = r.get("image_url") or ""
        if r.get("image_type") != "svg" and not url.lower().endswith(".svg"):
            skipped["not an SVG"] += 1
            continue
        candidates.append((r, lic, url if url.startswith("http") else SITE + url))

    def one(job):
        r, lic, url = job
        name = (r.get("name") or "").strip() or "Drawing"
        uuid8 = r["id"].replace("-", "")[:8]
        iid = f"scidraw-{uuid8}-{slug(name)}"[:100].rstrip("-")
        path = os.path.join(out_dir, iid + ".svg")
        if os.path.exists(path) and not a.refresh and not a.dry_run:
            svg = open(path, encoding="utf-8").read()
        else:
            svg = fetch_svg(url)
            if not svg:
                return None, "SVG not downloadable"
            if re.search(r"<image\b", svg) or "data:image" in svg:
                return None, "embedded raster image"
            if len(svg) > a.max_kb * 1000:
                return None, f"over {a.max_kb:g} KB"
            if not a.dry_run:
                open(path, "w", encoding="utf-8").write(svg)
            time.sleep(a.delay)
        author = ((r.get("primary_author") or {}).get("full_name") or "").strip() or "SciDraw contributor"
        cat = CATEGORIES.get(r.get("category_slug") or "", "Other")
        row = {
            "id": iid,
            # The full uuid, so the credit line can link back to the drawing page.
            "uuid": r["id"],
            "label": " ".join(name.split()),
            "category": cat,
            "author": author,
            "license": lic,
            "date": (r.get("created_at") or "")[:10],
            "doi": r.get("doi") or "",
            "inline": "<style" not in svg.lower(),
            "viewBox": [round(x, 3) for x in dims(svg)],
        }
        return row, None

    rows = []
    with cf.ThreadPoolExecutor(max_workers=a.jobs) as ex:
        for n, (row, why) in enumerate(ex.map(one, candidates), 1):
            if row:
                rows.append(row)
            else:
                skipped[why] += 1
            if n % 100 == 0:
                print(f"  {n}/{len(candidates)} done, {len(rows)} taken", flush=True)

    rows.sort(key=lambda x: (x["category"].lower(), x["label"].lower(), x["id"]))
    if not a.dry_run:
        path = os.path.join(a.app, "src", "icons.scidraw.json")
        old = {}
        if os.path.exists(path):
            for r in json.load(open(path))["icons"]:
                old[r["id"]] = r
        for r in rows:
            old.setdefault(r["id"], r)
        rows = [old[k] for k in sorted(old)]
        json.dump({"icons": rows}, open(path, "w"), ensure_ascii=False, separators=(",", ":"))

        # A full run drops drawings that are gone or filtered out now, and their files with them.
        keep = {r["id"] + ".svg" for r in rows}
        for f in os.listdir(out_dir):
            if f.startswith("scidraw-") and f not in keep:
                os.remove(os.path.join(out_dir, f))

    print(f"{len(rows)} drawings from SciDraw" + (" (dry run, nothing written)" if a.dry_run else ""))
    print("skipped:", dict(skipped))
    print("licenses:", dict(collections.Counter(r["license"] for r in rows)))
    print("categories:", dict(collections.Counter(r["category"] for r in rows).most_common(12)))


if __name__ == "__main__":
    sys.exit(main())
