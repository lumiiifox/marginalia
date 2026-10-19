// Marginalia: the app's state, the libraries it loads from cdnjs, and small helpers used everywhere. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
const KINDS = { passage: "Passage", gloss: "Gloss", question: "Question", objection: "Objection", argument: "Argument" };
const STATUS = { reading: "Reading", queued: "Queued", finished: "Finished" };
const I0 = "\u0001", I1 = "\u0002";
const S = { texts: new Map(), notes: new Map(), content: new Map(), covers: new Map(), terms: new Map(), drafts: new Map(), compares: new Map(), trash: new Map(), cmpId: null, cmpGaps: false, bOpen: new Set(), shelfOpen: new Set(), screen: "library", textId: null, sec: "all", kind: "all", q: "", tq: "", gq: "", gArea: "all", gOpen: new Set(), mode: "pending" };
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

function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("load")); document.head.appendChild(s); }); }
async function need(key, ok, msg) {
  if (ok()) return;
  for (const u of LIBS[key]) { try { await loadScript(u); if (ok()) return; } catch {} }
  throw new UErr(msg || "Couldn't load the file reader. Check your connection and try again.");
}
