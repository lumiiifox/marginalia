"""On demand, not in CI (it clones each book's source):  python3 tools/check_classics_text.py [ID ...]

Every paragraph of every bundled classic looked for in its source edition: letters only (accents folded, case, punctuation,
quotes, dashes, note numbers and line-break hyphens ignored), so a passage that was cut, garbled or taken from elsewhere is caught."""
import re, sys, json, subprocess, unicodedata, zipfile, random
from pathlib import Path
APP = Path(__file__).resolve().parent.parent; CACHE = APP / "tests/.cache"; SE = CACHE / "se"; TEXTS = CACHE / "texts"
src = (APP / "tools/build_classics.py").read_text().split("\nasyncio.run(")[0]
ns = {"__name__": "builder", "__file__": str(APP / "tools/build_classics.py")}; exec(compile(src, "build_classics", "exec"), ns)
BOOKS = {b["id"]: b for b in ns["BOOKS"]}
def clone(url, dest):
    if not dest.exists(): dest.parent.mkdir(parents=True, exist_ok=True); subprocess.run(["git", "clone", "-q", "--depth", "1", url, str(dest)], check=False)
def letters(x):
    x = unicodedata.normalize("NFKD", x)
    x = "".join(c for c in x if not unicodedata.combining(c)).lower()
    x = x.replace("æ", "ae").replace("œ", "oe").replace("ſ", "s")
    return re.sub(r"[^a-z]", "", x)
def source_text(bk):
    from lxml import html
    if bk.get("repo"):
        clone(f"https://github.com/standardebooks/{bk['repo']}", SE / bk["repo"])
        d = SE / bk["repo"] / "src/epub/text"
        return " ".join(html.fromstring(f.read_bytes()).text_content() for f in sorted(d.glob("*.xhtml")))
    if bk.get("epub_source"):
        f = CACHE / "gutenberg" / bk["epub_source"]["file"]
        if not f.exists(): return None
        z = zipfile.ZipFile(f); return " ".join(html.fromstring(z.read(n)).text_content() for n in z.namelist() if n.endswith((".xhtml", ".html", ".htm")))
    ts = bk["text_source"]; dest = TEXTS / bk["id"]
    if ts.get("commit"):
        if not dest.exists(): subprocess.run(["git", "clone", "-q", ts["repo"], str(dest)], check=False)
        out = []
        for f in ts["files"]: out.append(subprocess.run(["git", "-C", str(dest), "show", f"{ts['commit']}:{f}"], capture_output=True, text=True).stdout)
        return " ".join(out)
    clone(ts["repo"], dest)
    raw = (dest / ts["file"]).read_text(encoding=ts.get("encoding", "latin-1"), errors="replace")
    return html.fromstring(raw.encode()).text_content() if ts["file"].endswith((".htm", ".html")) else raw
res = {}
for bid in (sys.argv[1:] or json.loads((APP / "js/boot.js").read_text().split("const CLASSICS = ")[1].split(";")[0])):
    bk = BOOKS.get(bid)
    if not bk: res[bid] = "no build entry"; print(bid, "no build entry"); continue
    try: s = source_text(bk)
    except Exception as e: s = None; print(bid, "source error", e)
    if not s: res[bid] = "source unavailable"; print(bid, "source unavailable"); continue
    S = letters(s)
    data = json.loads((APP / f"data/books/{bid}.json").read_text())
    paras = [b for b in data["content"] if b["k"] in ("p", "c", "q", "fn")]
    miss = []
    for i, b in enumerate(data["content"]):
        if b["k"] not in ("p", "c", "q", "fn"): continue
        x = re.sub(r"[⁰¹²³⁴⁵⁶⁷⁸⁹]+", "", b["x"]); x = re.sub(r"^\s*\d+\.\s", "", x) if b["k"] == "fn" else x
        L = letters(x)
        if len(L) < 12: continue
        if L in S: continue
        # long paragraphs: every 60-letter stretch must be found (a joined line-break hyphen or an editor's insertion breaks one only)
        parts = [L[k:k + 60] for k in range(0, len(L), 60) if len(L[k:k + 60]) >= 30]
        bad = [p for p in parts if p not in S]
        if len(bad) > max(1, len(parts) // 10): miss.append((i, len(bad), len(parts), b["x"][:90]))
    res[bid] = {"paras": len(paras), "miss": miss[:8], "nmiss": len(miss)}
    print(f"{bid}: {len(paras)} paragraphs, {len(miss)} not found in the source")
(CACHE / "audit").mkdir(parents=True, exist_ok=True); json.dump(res, open(CACHE / "audit" / "fidelity.json", "w"), ensure_ascii=False, indent=1)
