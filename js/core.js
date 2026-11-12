// Marginalia: the app's state, the libraries it loads from cdnjs, and small helpers used everywhere. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
const KINDS = { passage: "Passage", gloss: "Gloss", question: "Question", objection: "Objection", argument: "Argument" };
const STATUS = { reading: "Reading", queued: "Queued", finished: "Finished" };
const I0 = "\u0001", I1 = "\u0002";
const S = { texts: new Map(), notes: new Map(), content: new Map(), covers: new Map(), terms: new Map(), drafts: new Map(), compares: new Map(), paths: new Map(), wishlist: new Map(), mastery: new Map(), recBook: null, recAll: false, trash: new Map(), cmpId: null, cmpGaps: false, bOpen: new Set(), shelfOpen: new Set(), screen: "library", textId: null, sec: "all", kind: "all", q: "", tq: "", gq: "", gArea: "all", gOpen: new Set(), mode: "pending" };
const R = { tid: null, blocks: null, els: [], tops: [], dirty: true, pageAt: [], secAt: [], sig: new Map(), saved: -1, sel: null,
  visiting: false, home: null, trail: [], landed: 0, landedAt: 0, landedY: 0 };
// Where you are reading and where you are looking are kept apart: a jump (Find, Contents, a bookmark, a note or search
// result opened from outside) leaves your saved place alone until you go back to it, choose "Read from here", or read on.
const SESS = new Map(); // per book, for this sitting only: the trail and the visit, so leaving the reader for a moment keeps them
/* A pinned passage: one passage or note kept at the foot of the reader while you read elsewhere in the book or in another.
   Kept in localStorage (mg-pin), outside the library, and carried in backups as `pin`: { tid, at, text, page, title, anchor?, noteId?, open }.
   It survives closing the app. A pinned note shows its current words; if it is deleted, or the book is, the words stay as
   pinned and the pin says so. Go to it finds the words again in the book, as notes are placed (placeNote). */
let PIN = (() => { try { const p = JSON.parse(localStorage.getItem("mg-pin") || "null"); return p && typeof p.tid === "string" && typeof p.text === "string" ? p : null; } catch { return null; } })();
let PINH = 0; // the pin's height on screen, kept out of the pages
let idb = null;

const LIBS = {
  pdf: ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"],
  pdfw: ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"],
  zip: ["https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"],
  docx: ["https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js", "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js", "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.21/mammoth.browser.min.js"],
};

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const gid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pnum = (p) => { const m = String(p || "").match(/\d+/); return m ? parseInt(m[0], 10) : Infinity; };
const plain = (x) => String(x || "").replace(/[\u0001\u0002]/g, "");
const tidy = (s) => String(s || "").replace(/\s+/g, " ").replace(/\u0001\s*\u0002/g, "").trim();
const norm = (s) => plain(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const fold = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const LIG = { "ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi", "ﬄ": "ffl", "ﬅ": "st", "ﬆ": "st" };
const fixLig = (s) => s.replace(/[ﬀ-ﬆ]/g, (c) => LIG[c]).replace(/­/g, "");
const clean = (s) => tidy(fixLig(plain(s)));
const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const toSup = (s) => s.replace(/[0-9]/g, (d) => SUP[d]);
const median = (a) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
const pct = (a, q) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(q * (b.length - 1))]; };
const wmedian = (pairs) => { const a = [...pairs].sort((x, y) => x[0] - y[0]); const tot = a.reduce((s, p) => s + p[1], 0); let acc = 0; for (const [v, w] of a) { acc += w; if (acc >= tot / 2) return v; } return a.length ? a[a.length - 1][0] : 10; };
class UErr extends Error {}
/* Highlight colours (a note's `hl`): a plain highlight, a passage, is yellow unless you choose another; the other kinds keep their
   own colours (gloss green, question blue, objection red, argument purple), so `hl` shows only on a passage. The colour you choose
   last is the next highlight's (localStorage mg-hl, this device only). */
const HL = { yellow: "Yellow", pink: "Pink", orange: "Orange", grey: "Grey" };
const hlOf = (n) => (n && (!n.kind || n.kind === "passage") && HL[n.hl] && n.hl !== "yellow" ? n.hl : "");
const hlClass = (n) => (hlOf(n) ? ` hl-${hlOf(n)}` : "");
let HL_LAST = (() => { try { const v = localStorage.getItem("mg-hl"); return HL[v] ? v : "yellow"; } catch { return "yellow"; } })();

/* Each library file's SHA-384, as cdnjs served it (checked 2026-11-08). The browser refuses a file whose bytes differ, so a changed
   copy on the CDN can't run here, where it could read anything the app keeps (the backup token included). A new file or version in
   LIBS needs its hash here (tests/integrity.py checks every one has one). */
const LIB_SRI = {
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js": "sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js": "sha384-SnzOobpRMLXZ52iJvZm/C0fYw0OQemTXzTjIsdsfMcrCtCEe9qgzxTd3RSklO5x2",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js": "sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js": "sha384-wj2H3JPCraDV2eZ/vqVPAvEIkFv7WCZAac4WV7Gt/hfpso4sCcOuARI3O2rRqFV0",
  "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js": "sha384-/cXAMbzovUIKbBERjPmR3SnPTh8siWr5lsvFYj1Uq4XP0yaJUZJmsh0YXyGv5P0y",
  "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js": "sha384-nFoSjZIoH3CCp8W639jJyQkuPHinJ2NHe7on1xvlUA7SuGfJAfvMldrsoAVm6ECz",
  "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.21/mammoth.browser.min.js": "sha384-8A8Qb7xlW4tCcYMx2ApG8MnMmaGhank0NWjO9B7XbbQhCkuurmQWt5OjDwWs4lrg",
};
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = src;
    if (LIB_SRI[src]) { s.integrity = LIB_SRI[src]; s.crossOrigin = "anonymous"; } // fetched with CORS, as a hash check requires
    s.onload = res; s.onerror = () => rej(new Error("load")); document.head.appendChild(s);
  });
}
/* PDF.js's background worker, from its file checked against its hash (a worker can't carry an integrity attribute, so the file is
   fetched with one and the worker started from the checked text); { wk, pw }. Without one, PDF.js runs in the page from the same
   file loaded and checked as a script; if that can't be had either, opening the PDF stops there, so PDF.js never fetches its worker
   unchecked by itself. */
async function pdfWorker(lib) {
  const u = LIBS.pdfw[0];
  let wk = null, pw = null;
  try {
    const r = await fetch(u, { integrity: LIB_SRI[u], mode: "cors", credentials: "omit" });
    if (r.ok) { wk = new Worker(URL.createObjectURL(new Blob([await r.text()], { type: "text/javascript" }))); pw = lib.PDFWorker.fromPort({ port: wk }); }
  } catch { try { if (wk) wk.terminate(); } catch {} wk = null; pw = null; }
  if (!pw) { await need("pdfw", () => !!window.pdfjsWorker, "Couldn't load the PDF reader. Check your connection and try again."); lib.GlobalWorkerOptions.workerSrc = u; }
  return { wk: pw ? wk : null, pw };
}
async function need(key, ok, msg) {
  if (ok()) return;
  for (const u of LIBS[key]) { try { await loadScript(u); if (ok()) return; } catch {} }
  throw new UErr(msg || "Couldn't load the file reader. Check your connection and try again.");
}
