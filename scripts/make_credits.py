#!/usr/bin/env python3
"""Regenerate ICON_CREDITS.md from src/icons.json and src/icons.bioart.json.

Usage: python3 scripts/make_credits.py .
"""
import collections, json, os, sys

APP = sys.argv[1] if len(sys.argv) > 1 else "."
d = json.load(open(f"{APP}/src/icons.json"))
authors, icons = d["authors"], d["icons"]
LIC = {
    "cc0": ("CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/"),
    "mit": ("MIT", "https://opensource.org/licenses/MIT"),
    "pd": ("Public Domain", "https://creativecommons.org/publicdomain/mark/1.0/"),
    "by25": ("CC BY 2.5", "https://creativecommons.org/licenses/by/2.5/"),
    "by3": ("CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/"),
    "by4": ("CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"),
}
n_lic = collections.Counter(i["license"] for i in icons)
cats = len({i["category"] for i in icons})

bioart_path = f"{APP}/src/icons.bioart.json"
bioart = json.load(open(bioart_path))["icons"] if os.path.exists(bioart_path) else []
n_bioart_lic = collections.Counter(i["license"] for i in bioart)
bioart_cats = len({i["category"] for i in bioart})

commons_path = f"{APP}/src/icons.commons.json"
commons = json.load(open(commons_path))["icons"] if os.path.exists(commons_path) else []
n_commons_lic = collections.Counter(i["license"] for i in commons)
commons_cats = len({i["category"] for i in commons})

health_path = f"{APP}/src/icons.healthicons.json"
health = json.load(open(health_path))["icons"] if os.path.exists(health_path) else []

phylopic_path = f"{APP}/src/icons.phylopic.json"
phylopic = json.load(open(phylopic_path))["icons"] if os.path.exists(phylopic_path) else []
n_phylopic_lic = collections.Counter(i["license"] for i in phylopic)
CC0 = "https://creativecommons.org/publicdomain/zero/1.0/"

scidraw_path = f"{APP}/src/icons.scidraw.json"
scidraw = json.load(open(scidraw_path))["icons"] if os.path.exists(scidraw_path) else []
n_scidraw_lic = collections.Counter(i["license"] for i in scidraw)

reactome_path = f"{APP}/src/icons.reactome.json"
reactome = json.load(open(reactome_path))["icons"] if os.path.exists(reactome_path) else []

togotv_path = f"{APP}/src/icons.togotv.json"
togotv = json.load(open(togotv_path))["icons"] if os.path.exists(togotv_path) else []
BY4 = "https://creativecommons.org/licenses/by/4.0/"


def esc(s):
    return s.replace("|", "\\|")


out = [
    "# Icon credits",
    "",
    f"The {len(icons)} icons in `public/icons/` ({cats} categories) come from [Bioicons](https://bioicons.com) (github.com/duerrsimon/bioicons).",
    "Each one keeps its own license, listed below. Share-alike (CC BY-SA) and BSD icons were left out on purpose, as were",
    "brand logos and icons that embed raster images.",
    "",
    f"- **CC0 1.0** ({n_lic['cc0']} icons): public domain, no credit needed (still appreciated).",
    f"- **CC BY 3.0 / 4.0** ({n_lic['by3']} / {n_lic['by4']} icons): free to use and adapt, including commercially, if you credit the author,",
    "  link the license, and say if you changed the icon. Resizing, flipping and arranging icons in a figure is normal use;",
    '  recoloring or editing the artwork counts as a change, so write "adapted from".',
    f"- **MIT** ({n_lic['mit']} icons): keep the author's name and the license notice with the icon.",
    "- Many CC BY icons are from [Servier Medical Art](https://smart.servier.com). Servier asks that their images are not",
    "  marketed as a standalone image library, so keep this app a figure editor and not an icon pack.",
    "",
    "The app writes the right credit line for the icons used in a figure (Credits button, or under the exported image).",
    "",
    "| Icon | Category | Author | License | File |",
    "|---|---|---|---|---|",
]
for i in icons:
    a = i["author"]
    au = f"[{esc(a)}]({authors[a]})" if authors.get(a) else esc(a)
    name, url = LIC[i["license"]]
    out.append(f"| {esc(i['label'])} | {i['category']} | {au} | [{name}]({url}) | `public/icons/{i['id']}.svg` |")

if bioart:
    out += [
        "",
        "## NIH BioArt Source",
        "",
        f"The other {len(bioart)} illustrations in `public/icons/` ({bioart_cats} categories) come from the",
        "[NIH BioArt Source](https://bioart.niaid.nih.gov), the medical art collection of the US National Institute of Allergy",
        "and Infectious Diseases. They are free for any use, including commercial, per its",
        "[terms](https://bioart.niaid.nih.gov/terms). The site asks that the entry a drawing comes from is named, which is what",
        "the credit line does for every figure that uses one.",
        "",
        f"- **Public Domain** ({n_bioart_lic['pd']} illustrations): made for NIAID, so no credit is required. The credit line is still written.",
        f"- **CC BY 4.0** ({n_bioart_lic['by4']} illustrations): from the Human Reference Atlas. Credit the creator, link the license,",
        "  and say if the artwork was changed; recoloring counts as a change. Cite the entry DOI when it has one.",
        "",
        "Import with `python3 scripts/fetch_bioart.py .`, which stores what it downloads in `src/icons.bioart.json`.",
        "",
        "| Illustration | Category | Creator | License | Entry | File |",
        "|---|---|---|---|---|---|",
    ]
    for i in bioart:
        if i["license"] == "pd":
            lic = "[Public Domain](https://bioart.niaid.nih.gov/faqs#usage-restrictions-bioart)"
        else:
            name, url = LIC[i["license"]]
            lic = f"[{name}]({url})"
        entry = f"[bioart/{i['entry']}](https://bioart.niaid.nih.gov/bioart/{i['entry']})"
        extra = f" / [{i['doi']}](https://doi.org/{i['doi']})" if i["doi"] else ""
        out.append(
            f"| {esc(i['label'])} | {i['category']} | {esc(i['author'])} | {lic}{extra} | {entry} | `public/icons/{i['id']}.svg` |"
        )

if commons:
    out += [
        "",
        "## Wikimedia Commons",
        "",
        f"The other {len(commons)} drawings in `public/icons/` ({commons_cats} categories) were taken from",
        "[Wikimedia Commons](https://commons.wikimedia.org), mostly the glassware and laboratory equipment icon sets.",
        "Each one keeps the license its file page states; only public domain, CC0 and CC BY drawings are included.",
        "Share-alike, non-commercial and unknown licenses were left out, and so was `scripts/commons_block.txt`,",
        "which lists icon-pack leftovers, non-English names and colour variants. Credit the author and link the file.",
        "",
        "Import with `python3 scripts/fetch_commons.py .`; the file metadata it reads is cached in `.cache/commons`.",
        "",
        "| Drawing | Category | Author | License | File |",
        "|---|---|---|---|---|",
    ]
    for i in commons:
        url = i.get("licenseUrl") or LIC[i["license"]][1]
        out.append(
            f"| {esc(i['label'])} | {i['category']} | {esc(i['author'])} | [{esc(LIC[i['license']][0])}]({url})"
            f" | [`{i['file']}`](https://commons.wikimedia.org/wiki/{i['file'].replace(' ', '_')}) |"
        )

if phylopic:
    out += [
        "",
        "## PhyloPic",
        "",
        f"The other {len(phylopic)} silhouettes in `public/icons/` are silhouettes of living things from",
        "[PhyloPic](https://www.phylopic.org), a community library of flat shapes for figures. Each one is",
        "credited to the person who drew it, under the license the collection lists for it.",
        "",
        f"- **Public domain / CC0** ({n_phylopic_lic['pd'] + n_phylopic_lic['cc0']} silhouettes): no credit needed, still given.",
        f"- **CC BY 3.0 / 4.0** ({n_phylopic_lic['by3'] + n_phylopic_lic['by4']} silhouettes): credit the contributor and say if it was changed.",
        "",
        "Import with `python3 scripts/fetch_phylopic.py .`; the answers it gets are cached in `.cache/phylopic`.",
        "",
        "| Organism | Category | Contributor | License | File |",
        "|---|---|---|---|---|",
    ]
    for i in phylopic:
        out.append(
            f"| {esc(i['label'])} | {i['category']} | {esc(i['author'])} | [{LIC[i['license']][0]}]({i.get('licenseUrl', LIC[i['license']][1])})"
            f" | `public/icons/{i['id']}.svg` ([page](https://www.phylopic.org/images/{i['uuid']})) |"
        )

if health:
    out += [
        "",
        "## Health Icons",
        "",
        f"The last {len(health)} icons in `public/icons/` are from [Health Icons](https://healthicons.org), the icon set of the",
        "public health non-profit Resolve to Save Lives. **The drawings are CC0**: free for any use, no credit required,",
        "editing and redistribution fine. The credit line names them anyway, with the icon page.",
        "",
        "Import with `python3 scripts/fetch_healthicons.py .`; the metadata it reads is cached in `.cache/healthicons`.",
        "",
        "| Icon | Category | Source category | License | File |",
        "|---|---|---|---|---|",
    ]
    for i in health:
        page = i["source"] if "source" in i else f"https://healthicons.org/icon/{i['style']}/{i['healthCategory']}/{i['id'].replace('health-', '')}"
        out.append(
            f"| {esc(i['label'])} | {i['category']} | {i['healthCategory']} | [CC0 1.0]({CC0})"
            f" | `public/icons/{i['id']}.svg` ([page]({page})) |"
        )

if scidraw:
    out += [
        "",
        "## SciDraw",
        "",
        f"The other {len(scidraw)} drawings in `public/icons/` come from [SciDraw](https://scidraw.io), an open",
        "repository of peer-reviewed scientific illustrations contributed by researchers. Every drawing is",
        f"**CC BY 4.0** ({n_scidraw_lic['by4']} here) or **CC0** ({n_scidraw_lic['cc0']} here), chosen by its author.",
        "CC BY asks you to credit the author, link the license and say if the drawing was changed; the credit line",
        "does that, linking each drawing's own page.",
        "",
        "Import with `python3 scripts/fetch_scidraw.py .`; the API pages it reads are cached in `.cache/scidraw`.",
        "",
        "| Drawing | Category | Author | License | File |",
        "|---|---|---|---|---|",
    ]
    for i in scidraw:
        name, url = LIC[i["license"]]
        out.append(
            f"| {esc(i['label'])} | {i['category']} | {esc(i['author'])} | [{name}]({url})"
            f" | `public/icons/{i['id']}.svg` ([page](https://scidraw.io/drawings/{i['uuid']})) |"
        )

if reactome:
    out += [
        "",
        "## Reactome Icon Library",
        "",
        f"The other {len(reactome)} icons in `public/icons/` are the glyphs of the [Reactome Icon Library](https://reactome.org/icon-lib),",
        "the visual vocabulary of the [Reactome](https://reactome.org) pathway diagrams: cell elements, cell types, compounds,",
        "human tissue, proteins, receptors and therapeutics, all in one consistent style. Reactome content is",
        f"[CC BY 4.0]({BY4}); credit Reactome, link the license and say if an icon was changed.",
        "",
        "Import with `python3 scripts/fetch_reactome.py .`; the category pages it reads are cached in `.cache/reactome`.",
        "",
        "| Icon | Category | Author | License | File |",
        "|---|---|---|---|---|",
    ]
    for i in reactome:
        out.append(
            f"| {esc(i['label'])} | {i['category']} | {esc(i['author'])} | [CC BY 4.0]({BY4})"
            f" | `public/icons/{i['id']}.svg` ([list](https://reactome.org/icon-lib/{i['cat']})) |"
        )

if togotv:
    out += [
        "",
        "## TogoTV / Togo Picture Gallery",
        "",
        f"The last {len(togotv)} illustrations in `public/icons/` come from [TogoTV](https://togotv.dbcls.jp/pics), the",
        "illustration library of DBCLS, the Database Center for Life Science in Japan. The drawings are **CC BY 4.0** and",
        'the collection asks the notice "© 2016 DBCLS TogoTV / CC-BY-4.0", which the credit line carries. Each drawing',
        "is also credited to its designer, where the collection lists one, with the DOI of the entries that have one.",
        "",
        "Import with `python3 scripts/fetch_togotv.py .`; the master list and directory listing it reads are cached in `.cache/togotv`.",
        "",
        "| Illustration | Category | Designer | License | File |",
        "|---|---|---|---|---|",
    ]
    for i in togotv:
        doi = f" / [doi:{i['doi']}](https://doi.org/{i['doi']})" if i.get("doi") else ""
        out.append(
            f"| {esc(i['label'])} | {i['category']} | {esc(i['author'])} | [CC BY 4.0]({BY4}){doi}"
            f" | `public/icons/{i['id']}.svg` |"
        )

open(f"{APP}/ICON_CREDITS.md", "w", encoding="utf-8").write("\n".join(out) + "\n")
print(
    f"wrote ICON_CREDITS.md with {len(icons)} + {len(bioart)} + {len(commons)} + {len(phylopic)} + {len(health)}"
    f" + {len(scidraw)} + {len(reactome)} + {len(togotv)} icons"
)