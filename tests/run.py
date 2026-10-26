"""Run Marginalia's tests:  python3 tests/run.py            every test, four at a time
                           python3 tests/run.py reader     one group (see GROUPS)
                           python3 tests/run.py smoke trash  named tests

Each test gets its own port (MG_PORT), so they can run side by side. pdf_import.py runs first on its own: it downloads the PDF.js
copy that printed_page.py and pdf_highlights.py read from tests/.cache. Exits non-zero if anything fails, and prints the failing
lines of each test that did.
"""
import os, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
FIRST = ["pdf_import"]
# Timing checks (a page flip within so many milliseconds) run alone at the end, so the other tests can't slow them down.
LAST = ["paged_reader"]
GROUPS = {
    "storage": ["smoke", "trash", "classics", "printed_page"],
    "reader": ["paged_reader", "structure", "comfort", "navigate", "highlights", "notes_lookup", "quotes_language", "pin",
               "followups", "classics", "printed_page", "editions", "density"],
    "import": ["pdf_import", "pdf_highlights", "wikisource"],
    "reference": ["study_tools", "links", "in_your_books", "density"],
    "look": ["contrast", "smoke"],
}
ALL = sorted(f[:-3] for f in os.listdir(HERE) if f.endswith(".py") and f != "run.py")
WORKERS = 4


def run(name, port):
    t0 = time.time()
    p = subprocess.run([sys.executable, os.path.join(HERE, name + ".py")], capture_output=True, text=True,
                       env={**os.environ, "MG_PORT": str(port)}, timeout=1800)
    out = p.stdout + p.stderr
    ok = p.returncode == 0 and "all passed" in out
    fails = [l for l in out.splitlines() if l.startswith("FAIL") or "Error" in l or "Traceback" in l]
    return name, ok, time.time() - t0, fails or out.strip().splitlines()[-5:]


def main(args):
    names = []
    for a in args or ALL:
        names += GROUPS.get(a, [a])
    names = list(dict.fromkeys(names))
    unknown = [n for n in names if n not in ALL]
    if unknown:
        sys.exit(f"No such test: {', '.join(unknown)}. Tests: {', '.join(ALL)}. Groups: {', '.join(GROUPS)}.")
    first = [n for n in FIRST if n in names or "pdf_highlights" in names or "printed_page" in names]
    last = [n for n in LAST if n in names]
    rest = [n for n in names if n not in first and n not in last]
    results = [run(n, 9100) for n in first]
    with ThreadPoolExecutor(WORKERS) as pool:
        results += list(pool.map(lambda nr: run(nr[1], 9101 + nr[0]), enumerate(rest)))
    results += [run(n, 9099) for n in last]
    bad = [r for r in results if not r[1]]
    for name, ok, secs, fails in results:
        print(f"{'ok  ' if ok else 'FAIL'} {name:16} {secs:5.0f}s")
    for name, _, _, fails in bad:
        print(f"\n--- {name}"); print("\n".join(fails[:20]))
    print(f"\n{len(results) - len(bad)} of {len(results)} passed")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
