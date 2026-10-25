#!/usr/bin/env python3
"""Import illustrations from TogoTV / Togo Picture Gallery (DBCLS) into the app.

Usage:
    python3 scripts/fetch_togotv.py .                 # walk the whole collection, write src/icons.togotv.json
    python3 scripts/fetch_togotv.py . --limit 40      # trial run on the first 40 illustrations
    python3 scripts/fetch_togotv.py . --dry-run       # report what would be taken, download nothing
    python3 scripts/fetch_togotv.py . --refresh       # re-download SVGs already on disk

TogoTV is the illustration and video library of DBCLS, the Database Center for Life Science in
Japan; the drawing collection is the Togo Picture Gallery. The drawings live on the DBCLS archive
at dbarchive.biosciencedbc.jp/data/togo-pic/image/, each one as SVG (alongside PNG and AI):

- The master CSV linked from the archive's data page (en/togo-pic/data-1.html) lists 539
  illustrations with English and Japanese titles, Japanese taxonomy tags, the designer and a DOI.
- The directory itself holds more (2,000+; new drawings keep arriving), named `YYYYMM_Title.svg`.

This script takes both: the CSV gives the curated metadata it can, the directory listing fills in
the rest, where the file name is the title and the collection-level credit applies. Everything is
CC BY 4.0 and asks the credit "© 2016 DBCLS TogoTV / CC-BY-4.0", which the app's credit line
writes for you.

The CSV tags its illustrations in Japanese; TAG_CATEGORY maps them onto the palette categories the
library already shows (most specific tag wins). Drawings known only from their file name are
categorised from a few English keywords, or "Organisms".

Only SVGs are taken; files that embed raster images, and files over --max-kb (checked while
streaming, so a 30 MB drawing never downloads in full), are skipped, since public/icons/ ships
with the app. Ids are `togotv-<picture id>-<name>`, so they never clash with the other sources and
stay stable between runs, which keeps saved figures working.
"""
import argparse, collections, concurrent.futures as cf, csv, html as htmlmod, json, os, re, sys, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET

ARCHIVE = "https://dbarchive.biosciencedbc.jp/data/togo-pic/image"
DATA_PAGE = "https://dbarchive.biosciencedbc.jp/en/togo-pic/data-1.html"
SITE = "https://togotv.dbcls.jp/pics"
UA = "figure-editor/1.0 (https://github.com/; one-off import script)"

# Japanese tags in the master CSV, most specific first: the first known tag decides the category.
TAG_CATEGORY = [
    ("次世代シーケンサー", "Equipment"),
    ("実験装置", "Equipment"),
    ("実験器具", "Equipment"),
    ("顕微鏡", "Equipment"),
    ("細胞", "Cells and Organelles"),
    ("臓器", "Anatomy"),
    ("模式図", "Diagrams"),
    ("昆虫綱", "Arthropods"),
    ("節足動物門", "Arthropods"),
    ("子嚢菌門", "Fungi"),
    ("プロテオバクテリア門", "Bacteria"),
    ("フィルミクテス門", "Bacteria"),
    ("バシラス綱", "Bacteria"),
    ("哺乳綱", "Animals"),
    ("霊長目", "Animals"),
    ("ネコ目", "Animals"),
    ("ウシ目", "Animals"),
    ("クジラ目", "Animals"),
    ("鳥綱", "Animals"),
    ("爬虫綱", "Animals"),
    ("両生綱", "Animals"),
    ("魚上綱", "Animals"),
    ("恐竜", "Animals"),
    ("脊椎動物亜門", "Animals"),
    ("脊索動物門", "Animals"),
    ("獣亜綱", "Animals"),
    ("真獣下綱", "Animals"),
    ("尾索動物亜門", "Animals"),
    ("モデル生物", "Organisms"),
    ("生物アイコン", "Organisms"),
]

# English keywords for drawings that are only known by their file name, most specific first.
WORD_CATEGORY = [
    (r"\b(pc[rR]|gel|blot|sequenc|pipett|plate reader|spectrometer|centrifug|incubator|microscop|biosafety)\w*", "Equipment"),
    (r"\b(mitochondri|chloroplast|nucleus|organelle|cell\b|cells\b|neuron|hepatocyte|fibroblast)\w*", "Cells and Organelles"),
    (r"\b(brain|heart|liver|kidney|lung|stomach|intestine|muscle|skeleton|skull|anatomy|tissue)\w*", "Anatomy"),
    (r"\b(dna|rna|chromosome|plasmid|protein|molecule)\w*", "Molecules"),
    (r"\b(drosophila|mosquito|bee|ant|beetle|butterfly|tick|mite|spider|shrimp|crab)\w*", "Arthropods"),
    (r"\b(mushroom|fungus|fungi|yeast|ascomyc)\w*", "Fungi"),
    (r"\b(e\.? ?coli|salmonella|bacill|staph|strept|vibrio|lactobacill)\w*", "Bacteria"),
    (r"\b(virus|virion|phage)\w*", "Viruses"),
    (r"\b(plant|tree|flower|leaf|root|seed|flowering|diospyros|cherry|rice|wheat|maize|fern|moss|algae)\w*", "Plants"),
    (
        r"\b(mouse|mice|rat|human|chicken|bird|fish|zebrafish|frog|newt|iguana|lizard|snake|turtle|"
        r"cat|dog|cow|pig|horse|sheep|goat|monkey|macaque|marmoset|whale|dolphin|squirrel|hamster|"
        r"quail|salamander|axolotl|embryo|chick)\w*",
        "Animals",
    ),
]


def get(url, timeout=60, tries=3):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
            last = e
            time.sleep(1 + 2 * attempt)
    raise RuntimeError(f"cannot fetch {url}: {last}")


def get_capped(url, max_bytes, timeout=60, tries=3):
    """The file as text, or None when it turns out bigger than max_bytes.

    Reads in chunks and stops early, so oversized drawings never download in full.
    """
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            chunks, total = [], 0
            with urllib.request.urlopen(req, timeout=timeout) as r:
                while True:
                    chunk = r.read(65536)
                    if not chunk:
                        return b"".join(chunks).decode("utf-8", "ignore")
                    total += len(chunk)
                    if total > max_bytes:
                        return None
                    chunks.append(chunk)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
            last = e
            time.sleep(1 + 2 * attempt)
    raise RuntimeError(f"cannot fetch {url}: {last}")


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def strip_tags(s):
    s = htmlmod.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return " ".join(s.split())


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


def category_of_tags(tags):
    known = dict(TAG_CATEGORY)
    for tag in tags:
        if tag in known:
            return known[tag]
    return "Organisms"


def category_of_words(title):
    low = title.lower()
    for pat, cat in WORD_CATEGORY:
        if re.search(pat, low):
            return cat
    return "Organisms"


def master_csv(cache):
    """The master CSV, found through the archive's data page so a new dated file name is picked up."""
    path = os.path.join(cache, "master.csv") if cache else None
    if path and os.path.exists(path):
        return open(path, "rb").read()
    page = get(DATA_PAGE).decode("utf-8", "ignore")
    m = re.search(r'href="([^"]+\.csv)"', page)
    if not m:
        raise RuntimeError("no CSV link on the Togo Picture Gallery data page")
    url = m.group(1)
    if url.startswith("/"):
        url = "https://dbarchive.biosciencedbc.jp" + url
    data = get(url)
    if path:
        os.makedirs(cache, exist_ok=True)
        open(path, "wb").write(data)
    return data


def directory_listing(cache):
    """Every file on the archive's image directory, as [(file name, size in KB)]."""
    path = os.path.join(cache, "listing.html") if cache else None
    if path and os.path.exists(path):
        html = open(path, encoding="utf-8").read()
    else:
        html = get(f"{ARCHIVE}/").decode("utf-8", "ignore")
        if path:
            os.makedirs(cache, exist_ok=True)
            open(path, "w", encoding="utf-8").write(html)
    out = {}
    # Apache autoindex rows: ... <td><a href="x.svg">x.svg</a></td><td>date</td><td align="right">408K</td> ...
    for row in re.split(r"<tr", html):
        fm = re.search(r'<a href="([^"]+\.svg)"', row)
        if not fm:
            continue
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
        size = ""
        for c in cells:  # the size cell is the last numeric-looking one
            txt = c.replace("&nbsp;", " ").strip()
            if re.fullmatch(r"[0-9.]+[KMG]?", txt):
                size = txt
        if not size:
            continue
        mult = {"K": 1, "M": 1024, "G": 1024 * 1024}
        if size[-1].isalpha():  # 408K / 1.2M / 2G
            out[fm.group(1)] = float(size[:-1]) * mult[size[-1]]
        else:  # a plain byte count
            out[fm.group(1)] = float(size) / 1024
    return out


def collect_entries(cache):
    """(file name, label, author, doi, date, tags) for every illustration this run takes."""
    csv_data = master_csv(cache)
    entries = {}  # file name -> entry
    for r in csv.DictReader(csv_data.decode("utf-8-sig").splitlines()):
        svg_file = (r.get("original_svg") or "").strip()
        if not svg_file:
            continue
        title_en = strip_tags(r.get("title_en") or "")
        title_jp = strip_tags(r.get("title_jp") or "")
        label = title_en or title_jp
        if not label:
            continue
        entries[svg_file] = {
            "file": svg_file,
            "pic": (r.get("picture_id") or "").strip() or svg_file.rsplit(".", 1)[0],
            "label": label,
            "author": strip_tags(r.get("Designed_by") or "") or "DBCLS TogoTV",
            "doi": (r.get("doi") or "").strip() if (r.get("doi") or "").strip().startswith("10.") else "",
            "date": r.get("date") or "",
            "tags": [t.strip() for t in re.split(r"[,，]", r.get("tag") or "") if t.strip()],
        }

    listing = directory_listing(cache)
    print(f"master list: {len(entries)} illustrations, directory: {len(listing)} SVGs")
    for name in listing:
        if name in entries:
            continue
        stem = re.sub(r"\.svg$", "", name)
        m = re.match(r"^(\d{6})[_-](.+)$", stem)
        date, title = (m.group(1), m.group(2)) if m else ("", stem)
        title = " ".join(strip_tags(title).replace("_", " ").split())
        if not title:
            continue
        entries[name] = {
            "file": name,
            "pic": stem.lower(),
            "label": title,
            "author": "DBCLS TogoTV",
            "doi": "",
            "date": f"{date[:4]}-{date[4:6]}" if re.fullmatch(r"\d{6}", date) else "",
            "tags": [],
        }
    return list(entries.values())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("app", help="the figure-editor folder")
    ap.add_argument("--limit", type=int, default=0, help="only take the first N illustrations")
    ap.add_argument("--jobs", type=int, default=6)
    ap.add_argument("--delay", type=float, default=0.2, help="seconds to wait between requests")
    ap.add_argument("--max-kb", type=float, default=100)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--refresh", action="store_true", help="download SVGs that are already on disk")
    ap.add_argument("--cache", default=".cache/togotv", help="folder for the CSV and listing, relative to the app")
    ap.add_argument("--no-cache", action="store_true", help="always ask the archive, ignoring the cache")
    a = ap.parse_args()

    out_dir = os.path.join(a.app, "public", "icons")
    os.makedirs(out_dir, exist_ok=True)
    cache = None if a.no_cache else (a.cache if os.path.isabs(a.cache) else os.path.join(a.app, a.cache))

    entries = collect_entries(cache)
    if a.limit:
        entries = entries[: a.limit]
    print(f"{len(entries)} illustrations to take")

    def one(e):
        # The picture id (a number from the CSV, or the file name stem elsewhere) keeps ids stable
        # when two drawings share a title.
        iid = f"togotv-{e['pic'].replace('.svg', '').lower()}-{slug(e['label'])}"[:120].rstrip("-")
        path = os.path.join(out_dir, iid + ".svg")
        if os.path.exists(path) and not a.refresh and not a.dry_run:
            svg = open(path, encoding="utf-8").read()
        else:
            try:
                raw = get_capped(f"{ARCHIVE}/{urllib.request.quote(e['file'])}", int(a.max_kb * 1000))
            except RuntimeError:
                return None, "SVG not downloadable"
            if raw is None:
                return None, f"over {a.max_kb:g} KB"
            svg = clean(raw)
            if not valid(svg):
                return None, "SVG does not parse"
            if re.search(r"<image\b", svg) or "data:image" in svg:
                return None, "embedded raster image"
            if not a.dry_run:
                open(path, "w", encoding="utf-8").write(svg)
            time.sleep(a.delay)
        row = {
            "id": iid,
            "label": e["label"],
            "category": category_of_tags(e["tags"]) if e["tags"] else category_of_words(e["label"]),
            "author": e["author"],
            "license": "by4",
            "date": e["date"],
            "doi": e["doi"],
            "inline": "<style" not in svg.lower(),
            "viewBox": [round(x, 3) for x in dims(svg)],
        }
        return row, None

    skipped = collections.Counter()
    rows = []
    with cf.ThreadPoolExecutor(max_workers=a.jobs) as ex:
        for n, (row, why) in enumerate(ex.map(one, entries), 1):
            if row:
                rows.append(row)
            else:
                skipped[why] += 1
            if n % 100 == 0:
                print(f"  {n}/{len(entries)} done, {len(rows)} taken", flush=True)

    rows.sort(key=lambda r: (r["category"].lower(), r["label"].lower(), r["id"]))
    if not a.dry_run:
        path = os.path.join(a.app, "src", "icons.togotv.json")
        old = {}
        if os.path.exists(path):
            for r in json.load(open(path))["icons"]:
                old[r["id"]] = r
        for r in rows:
            old.setdefault(r["id"], r)
        rows = [old[k] for k in sorted(old)]
        json.dump({"icons": rows}, open(path, "w"), ensure_ascii=False, separators=(",", ":"))

        # A full run drops illustrations that are gone or filtered out now, and their files with them.
        keep = {r["id"] + ".svg" for r in rows}
        for f in os.listdir(out_dir):
            if f.startswith("togotv-") and f not in keep:
                os.remove(os.path.join(out_dir, f))

    print(f"{len(rows)} illustrations from TogoTV (DBCLS)" + (" (dry run, nothing written)" if a.dry_run else ""))
    print("skipped:", dict(skipped))
    print("categories:", dict(collections.Counter(r["category"] for r in rows).most_common(12)))
    print("authors:", dict(collections.Counter(r["author"] for r in rows).most_common(8)))


if __name__ == "__main__":
    sys.exit(main())
