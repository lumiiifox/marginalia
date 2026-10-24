// Marginalia: storage on this device (IndexedDB), Recently deleted, covers, toasts, saving files, and backup and restore. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- store: IndexedDB on this device ---------- */
const STORES = ["texts", "notes", "content", "covers", "terms", "drafts", "compares", "files", "trash", "trashlist"]; // files: original PDFs; trash: Recently deleted, listed in trashlist. Only trashlist is read at start; none is backed up
function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("marginalia", 8); // 5 added the drafts store, 6 the comparisons store, 7 the original PDFs, 8 Recently deleted
    r.onupgradeneeded = () => { const d = r.result; STORES.forEach((n) => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n); }); };
    r.onsuccess = () => {
      const d = r.result;
      // A newer version opened elsewhere needs to upgrade storage: step aside and reload into it.
      d.onversionchange = () => { d.close(); location.reload(); };
      if (S.blocked) { S.blocked = false; }
      res(d);
    };
    r.onerror = () => rej(r.error);
    // An older copy open in another tab holds the old storage open; the upgrade finishes once it closes.
    r.onblocked = () => { S.blocked = true; render(); };
  });
}
function idbDo(store, fn) {
  return new Promise((res, rej) => {
    const t = idb.transaction(store, "readwrite");
    fn(t.objectStore(store));
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}
function idbAll(store) {
  return new Promise((res, rej) => {
    const m = new Map(), r = idb.transaction(store).objectStore(store).openCursor();
    r.onsuccess = () => { const c = r.result; if (c) { m.set(c.key, c.value); c.continue(); } else res(m); };
    r.onerror = () => rej(r.error);
  });
}
function idbGet(store, key) {
  return new Promise((res, rej) => { const r = idb.transaction(store).objectStore(store).get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
// The copy in memory of a store's records ("files" has none: PDFs are read from storage when wanted).
function mapFor(col) {
  const m = { texts: S.texts, notes: S.notes, content: S.content, covers: S.covers, terms: S.terms, drafts: S.drafts, compares: S.compares }[col];
  if (!m) throw new Error(`No copy in memory for "${col}".`);
  return m;
}
async function put(col, id, data) {
  if (idb) await idbDo(col, (s) => s.put(data, id));
  mapFor(col).set(id, data);
  if (col !== "content") render();
}
async function del(col, id) {
  if (idb) await idbDo(col, (s) => s.delete(id));
  mapFor(col).delete(id);
  if (col !== "content") render();
}
/* Recently deleted: what you delete is kept for TRASH_DAYS in the "trash" store, as one entry per deletion:
   { at, kind: "text" | "note" | "draft" | "comparison", title, items: [[store, id, record], ...] }. A book's entry holds the
   book, its notes, its text, its cover and its PDF, so Restore puts them all back at once. Each entry's short summary is
   kept under the same key in "trashlist", which is all the app reads at start (into S.trash); the records themselves are
   read only when restored. Restoring never writes over a record that exists again (from a backup, say): those are left
   as they are. Without storage (private browsing), or without room to keep it, a deletion is final. */
const TRASH_DAYS = 30, DAY = 86400000;
const trashSum = (e) => {
  const note = e.kind === "note" && e.items[0] ? e.items[0][2] : null;
  return { at: e.at, kind: e.kind, title: e.title || "", notes: e.items.filter(([st]) => st === "notes").length, snip: note ? noteSnippet(note, 120) : "", book: note ? note.textId : "" };
};
async function loadTrash() {
  if (!idb) return;
  const all = await idbAll("trashlist"), old = [...all].filter(([, e]) => !e || !Number.isFinite(e.at) || Date.now() - e.at > TRASH_DAYS * DAY).map(([k]) => k);
  if (old.length) await idbTx(["trash", "trashlist"], (st) => old.forEach((k) => { st("trash").delete(k); st("trashlist").delete(k); }));
  S.trash = new Map([...all].filter(([k]) => !old.includes(k)));
}
const isQuota = (e) => !!e && (e.name === "QuotaExceededError" || /quota/i.test(e.message || ""));
// Removes the records and files them together in Recently deleted, in one transaction. Returns the entry's id (null without
// storage). When the device has no room to keep the copy, nothing is removed: the transaction rolls back, the person is asked
// what to do (noRoom), and the error thrown carries noRoom so the caller says nothing more.
async function trashAndRemove(kind, title, items) {
  let tid = null;
  if (idb) {
    tid = "tr-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    const e = { at: Date.now(), kind, title, items: items.filter(([, , v]) => v !== undefined && v !== null) }, sum = trashSum(e);
    try {
      await idbTx([...new Set(["trash", "trashlist", ...items.map((x) => x[0])])], (st) => { items.forEach(([store, id]) => st(store).delete(id)); st("trash").put(e, tid); st("trashlist").put(sum, tid); });
    } catch (err) {
      if (!isQuota(err)) throw err;
      await closeOverlay(); noRoom(kind, title, items);
      throw Object.assign(new Error("No room to keep it in Recently deleted."), { noRoom: true });
    }
    S.trash.set(tid, sum);
  }
  items.forEach(([store, id]) => { if (store !== "files") mapFor(store).delete(id); });
  return tid;
}
// Deleting for good, only once the person has chosen it in noRoom.
async function removeForGood(items) {
  await idbTx([...new Set(items.map((x) => x[0]))], (st) => items.forEach(([store, id]) => st(store).delete(id)));
  items.forEach(([store, id]) => { if (store !== "files") mapFor(store).delete(id); });
  for (const [store, id] of items) if (store === "texts") { if (PDFV.tid === id) closePdf(); SESS.delete(id); }
  render(); toast("Deleted for good.");
}
function noRoom(kind, title, items) {
  const what = kind === "text" ? `“${title}”${items.some(([st]) => st === "notes") ? " and its notes" : ""}` : kind === "note" ? "this note" : `“${title}”`;
  openPanel(`<h2>No room to keep it</h2>
    <p class="hint">This device is out of space for the app, so ${esc(what)} can't go to Recently deleted, where it could be restored. Nothing has been deleted.</p>
    <div class="menu">
      ${S.trash.size ? `<button class="menuitem" id="nr-trash">Open Recently deleted (${S.trash.size}) to make room</button>` : ""}
      <button class="menuitem" id="nr-keep">Cancel, and keep it</button>
      <button class="menuitem danger" id="nr-final" data-keep="1">Delete permanently, with no way to restore it</button>
    </div>`, (b) => {
    if (b.id === "nr-trash") go({ screen: "trash" });
    else if (b.id === "nr-final") arm(b, () => closeOverlay().then(() => removeForGood(items)).catch((e) => toast(failMsg(e))));
  });
}
const undoTrash = (tid) => (tid ? { label: "Undo", run: () => restoreTrash(tid).catch((e) => toast(failMsg(e))) } : undefined);
const delToast = (msg, tid) => toast(msg, undoTrash(tid));
// Puts back each record that isn't in the library now and leaves the ones that are, deciding inside the one transaction.
function putBackMissing(tid, items) {
  return new Promise((res, rej) => {
    const t = idb.transaction([...new Set(["trash", "trashlist", ...items.map((x) => x[0])])], "readwrite"), back = [], kept = [];
    t.oncomplete = () => res({ back, kept });
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error("The change was cancelled."));
    for (const it of items) {
      const r = t.objectStore(it[0]).getKey(it[1]);
      r.onsuccess = () => { if (r.result === undefined) { t.objectStore(it[0]).put(it[2], it[1]); back.push(it); } else kept.push(it); };
    }
    t.objectStore("trash").delete(tid); t.objectStore("trashlist").delete(tid);
  });
}
async function restoreTrash(tid) {
  const e = idb && (await idbGet("trash", tid));
  if (!e) { S.trash.delete(tid); render(); toast("That's no longer in Recently deleted."); return false; }
  const book = e.items.find(([st]) => st === "texts");
  if (e.items.some(([st, , v]) => st === "notes" && !S.texts.has(v.textId) && !(book && book[1] === v.textId))) {
    toast("This note's book was deleted too. Restore the book first."); return false;
  }
  const { back, kept } = await putBackMissing(tid, e.items);
  back.forEach(([store, id, v]) => { if (store !== "files") mapFor(store).set(id, v); });
  S.trash.delete(tid); render();
  const said = e.kind === "text" ? `“${e.title}” is back on its shelf${back.some(([st]) => st === "notes") ? ", with its notes" : ""}.` : e.kind === "note" ? "Note restored." : e.kind === "draft" ? "Draft restored." : "Comparison restored.";
  const k = kept.filter(([st]) => ["texts", "notes", "drafts", "compares"].includes(st)).length;
  toast(!back.length ? "Everything in it is already in your library, so it was left as it is." : k ? `${said} ${k} ${k === 1 ? "record was" : "records were"} already in your library again and ${k === 1 ? "was" : "were"} left as ${k === 1 ? "it is" : "they are"}.` : said);
  return true;
}
async function purgeTrash(ids) {
  if (idb) await idbTx(["trash", "trashlist"], (st) => ids.forEach((k) => { st("trash").delete(k); st("trashlist").delete(k); }));
  ids.forEach((k) => S.trash.delete(k)); render();
}
function failMsg(e) {
  if (e && (e.name === "QuotaExceededError" || /quota/i.test(e.message || ""))) return `This device is out of storage space for the app. Empty Recently deleted${S.trash.size ? ` (${S.trash.size} item${S.trash.size === 1 ? "" : "s"}, at the foot of the home screen)` : ""} or free up space on the device, then try again.`;
  return `Couldn't save (${(e && (e.name || e.message)) || "unknown error"}).`;
}
async function saveContent(tid, blocks, say) {
  say("Saving the text…");
  await put("content", tid, blocks);
}
async function loadContent(tid) {
  if (S.content.has(tid)) return S.content.get(tid);
  if (!idb) return null;
  const blocks = await idbGet("content", tid);
  if (blocks) S.content.set(tid, blocks);
  return blocks || null;
}

/* ---------- covers ---------- */
const COVER_URL = new Map();
function coverURL(tid) {
  const b = S.covers.get(tid), c = COVER_URL.get(tid);
  if (!b) { if (c) { URL.revokeObjectURL(c.url); COVER_URL.delete(tid); } return null; }
  if (c && c.blob === b) return c.url;
  if (c) URL.revokeObjectURL(c.url);
  const url = URL.createObjectURL(b); COVER_URL.set(tid, { blob: b, url }); return url;
}
// Cloth-binding colours for books without a cover image; picked from the title so a book keeps its colour.
const CLOTH = ["#2f4f3e", "#6b2b2b", "#24365c", "#80632a", "#3f4a55", "#4f3358", "#5a3a26", "#2e5a5a"];
function cloth(s) { let h = 7; for (const ch of String(s || "")) h = (h * 31 + ch.codePointAt(0)) >>> 0; return CLOTH[h % CLOTH.length]; }
function coverHTML(t, url) {
  if (url) return `<span class="cover"><img src="${url}" alt=""></span>`;
  // "Anti-Oedipus: Capitalism and Schizophrenia" is stamped as a title with a smaller subtitle beneath it.
  const full = t.title || "Untitled", cut = full.search(/:\s/);
  const main = cut > 0 ? full.slice(0, cut) : full, sub = cut > 0 ? full.slice(cut + 1).trim() : "";
  const longest = Math.max(...main.split(/\s+/).map((w) => w.length));
  const size = main.length > 34 || longest > 11 ? " sm" : "";
  return `<span class="cover gen" style="--cloth:${cloth(t.title)}"><span class="gen-in"><span class="gtop"><span class="gt${size}">${esc(main)}</span>${sub ? `<span class="gs">${esc(sub)}</span>` : ""}</span>${t.author ? `<span class="ga">${esc(t.author)}</span>` : ""}</span></span>`;
}
// Shrink any image to a cover-sized JPEG so storage and backups stay small.
async function toCover(blob) {
  let src, tmp = null;
  try { src = await createImageBitmap(blob); }
  catch {
    tmp = URL.createObjectURL(blob);
    src = await new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new UErr("That image couldn't be opened. Use a JPEG or PNG.")); img.src = tmp; });
  }
  try {
    const w0 = src.width, h0 = src.height;
    if (!w0 || !h0) throw new UErr("That image couldn't be opened. Use a JPEG or PNG.");
    const k = Math.min(1, 600 / h0, 400 / w0);
    const cv = document.createElement("canvas"); cv.width = Math.max(1, Math.round(w0 * k)); cv.height = Math.max(1, Math.round(h0 * k));
    const ctx = cv.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(src, 0, 0, cv.width, cv.height);
    const out = await new Promise((res) => cv.toBlob(res, "image/jpeg", 0.85));
    if (!out) throw new UErr("That image couldn't be opened. Use a JPEG or PNG.");
    return out;
  } finally { if (tmp) URL.revokeObjectURL(tmp); if (src && src.close) src.close(); }
}
// updatedAt marks a change to a record; reading (readAt) and adding notes (activeAt) are activity, used to order the shelf.
const lastActive = (t) => Math.max(t.updatedAt || 0, t.activeAt || 0, t.readAt || 0);
function progressOf(t) {
  if (t.hasContent && t.total > 1) return Math.max(0, Math.min(100, Math.round((100 * (t.pos || 0)) / (t.total - 1))));
  const secs = t.sections || [];
  if (secs.length) return Math.round((100 * secs.filter((s) => s.done).length) / secs.length);
  return null;
}

/* ---------- toast, downloads, backups ---------- */
let toastT;
function toast(msg, act) {
  const el = $("#toast"); el.textContent = msg;
  for (const a of [].concat(act || [])) { const b = document.createElement("button"); b.className = "toastbtn"; b.textContent = a.label; b.onclick = () => { el.hidden = true; a.run(); }; el.append(b); }
  el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, act ? 8000 : 3200);
}
const stamp = () => new Date().toISOString().slice(0, 10);
const slug = (s) => String(s || "notes").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "notes";
async function saveFile(name, text, type) {
  const blob = text instanceof Blob ? text : new Blob([text], { type });
  const touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare) {
    try {
      const file = new File([blob], name, { type });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return true; }
    } catch (e) { if (e && e.name === "AbortError") return false; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}
const blobToDataURL = (b) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(b); });
async function exportBackup() {
  const content = idb ? await idbAll("content") : S.content;
  const covers = {};
  for (const [id, b] of S.covers) { try { covers[id] = await blobToDataURL(b); } catch {} }
  const data = { app: "marginalia", version: 5, exportedAt: new Date().toISOString(), ...(PIN ? { pin: PIN } : {}), texts: Object.fromEntries(S.texts), notes: Object.fromEntries(S.notes), content: Object.fromEntries(content), covers, terms: Object.fromEntries(S.terms), drafts: Object.fromEntries(S.drafts), compares: Object.fromEntries(S.compares) };
  const ok = await saveFile(`marginalia-backup-${stamp()}.json`, JSON.stringify(data), "application/json");
  if (ok) { try { localStorage.setItem("mg-backup", String(Date.now())); } catch {} render(); }
}
// Several stores changed together or not at all: if anything fails, the whole transaction is rolled back.
function idbTx(stores, fn) {
  return new Promise((res, rej) => {
    const t = idb.transaction(stores, "readwrite");
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error("The change was cancelled."));
    try { fn((name) => t.objectStore(name)); } catch (e) { try { t.abort(); } catch {} rej(e); }
  });
}
/* restoring: check the file, show what it would change, then merge in one transaction */
const RESTORE_KINDS = [["texts", "text", "texts"], ["notes", "note", "notes"], ["drafts", "draft", "drafts"], ["compares", "comparison", "comparisons"], ["terms", "glossary entry", "glossary entries"]];
// Checked to the depth the app relies on when it draws a record; anything else in a record is kept as it is.
const isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const optStr = (x) => x === undefined || x === null || typeof x === "string";
const optArr = (x, f) => x === undefined || (Array.isArray(x) && x.every(f));
const isS = (x) => typeof x === "string";
const optNum = (x) => x === undefined || x === null || Number.isFinite(x);
const optInt = (x) => x === undefined || (Number.isInteger(x) && x >= 0);
const CONC_MAX = 2000; // pairs of pages kept for another edition (t.conc)
const DAYS_MAX = 3000; // days of reading time kept on a book (t.days), oldest dropped first
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const VALID = {
  texts: (v) => isObj(v) && isS(v.title) && optStr(v.author) && optStr(v.edition) && optStr(v.lang) && optStr(v.next) && (v.rank === undefined || Number.isFinite(v.rank)) && optArr(v.pdfLabels, isS) && optArr(v.sections, (x) => isObj(x) && isS(x.id) && isS(x.label))
    && optArr(v.bookmarks, (x) => isObj(x) && Number.isInteger(x.at)) && (v.summaries === undefined || isObj(v.summaries)) && (v.pos === undefined || Number.isInteger(v.pos))
    && (v.source === undefined || v.source === null || (isObj(v.source) && optStr(v.source.name) && optStr(v.source.kind) && optNum(v.source.pages)))
    && (v.pair === undefined || (typeof v.pair === "string" && v.pair.length > 0 && v.pair.length < 200))
    && optArr(v.termMarks, (x) => isObj(x) && isS(x.id) && goodId(x.id) && isS(x.passage) && x.passage.length > 0 && x.passage.length <= 2000 && Number.isInteger(x.at) && x.at >= 0 && optNum(x.createdAt)
      && (x.anchor === undefined || (isObj(x.anchor) && ["a", "ao", "b", "bo"].every((k) => Number.isInteger(x.anchor[k])) && optStr(x.anchor.pre) && optStr(x.anchor.suf))))
    && (v.days === undefined || (isObj(v.days) && Object.keys(v.days).length <= DAYS_MAX
      && Object.entries(v.days).every(([k, d]) => DAY_KEY.test(k) && Array.isArray(d) && d.length === 2 && d.every((x) => Number.isInteger(x) && x >= 0))))
    && (v.conc === undefined || (isObj(v.conc) && isS(v.conc.label) && v.conc.label.length <= 60 && Array.isArray(v.conc.pairs) && v.conc.pairs.length <= CONC_MAX
      && v.conc.pairs.every((q) => Array.isArray(q) && q.length === 2 && q.every((x) => isS(x) && x.length > 0 && x.length <= 12)))),
  notes: (v) => isObj(v) && isS(v.textId) && optStr(v.kind) && ["passage", "gloss", "original", "conclusion", "sectionId"].every((k) => optStr(v[k]))
    && (v.page === undefined || isS(v.page) || typeof v.page === "number") && optArr(v.links, isS) && optArr(v.premises, isS) && (v.at === undefined || Number.isInteger(v.at))
    && (v.anchor === undefined || (isObj(v.anchor) && ["a", "ao", "b", "bo"].every((k) => Number.isInteger(v.anchor[k])) && optStr(v.anchor.pre) && optStr(v.anchor.suf)))
    && optArr(v.followups, (x) => isObj(x) && isS(x.id) && Number.isFinite(x.at) && isS(x.x)) && optNum(v.wordAt)
    && optArr(v.was, (x) => isObj(x) && Number.isFinite(x.at) && optStr(x.gloss) && optArr(x.premises, isS) && optStr(x.conclusion)),
  drafts: (v) => isObj(v) && optStr(v.title) && Array.isArray(v.items) && v.items.every((x) => isObj(x) && (x.t === "note" ? isS(x.id) : (x.t === "h" || x.t === "p") && isS(x.x))),
  compares: (v) => isObj(v) && optStr(v.title) && optStr(v.q) && optStr(v.verdict) && Array.isArray(v.cols) && v.cols.every((x) => isObj(x) && isS(x.id) && isS(x.label) && optStr(x.src))
    && Array.isArray(v.rows) && v.rows.every((x) => isObj(x) && isS(x.id) && isS(x.q)) && (v.cells === undefined || (isObj(v.cells) && Object.values(v.cells).every((c) => isObj(c) && optStr(c.x) && optArr(c.notes, isS)))),
  terms: (v) => isObj(v) && ((isS(v.t) && isS(v.d)) || (isObj(v.map) && Object.values(v.map).every((a) => Array.isArray(a) && a.every(isS)))),
  content: (v) => Array.isArray(v) && v.every((b) => isObj(b) && isS(b.k) && optStr(b.x) && optStr(b.s) && optStr(b.st) && optInt(b.sth) && optInt(b.l)
    && (b.stj === undefined || typeof b.stj === "boolean") && optNum(b.size) && optNum(b.space)),
  covers: (v) => typeof v === "string" && v.startsWith("data:image/"),
};
const goodId = (id) => typeof id === "string" && id.length > 0 && id.length < 200;
// Reading position, activity, reading time (days) and a book's place on its shelf (rank) are left out when deciding whether two
// versions differ; the reading follows the later reading, reading time joins both copies', and the place stays as it is on this device.
const ACTIVITY = new Set(["updatedAt", "readAt", "activeAt", "pos", "posF", "total", "rank", "days"]);
// The reading position follows whichever copy was read more recently, whichever copy's details win,
// unless the two hold different versions of the book's text: then the position stays with its own text.
const READING = ["pos", "posF", "total", "readAt"];
// Reading time by day from both copies: the larger of each day's figures, so a backup restored twice never counts a day twice.
function withDays(base, other) {
  const a = base.days || {}; let out = null;
  for (const [k, d] of Object.entries((other && other.days) || {})) {
    const c = a[k] || [0, 0];
    if (d[0] > c[0] || d[1] > c[1]) { out = out || { ...a }; out[k] = [Math.max(c[0], d[0]), Math.max(c[1], d[1])]; }
  }
  return out ? { ...base, days: out } : base;
}
// The glossary terms you linked in a book, from both copies: one link per entry, place and words.
function withTermMarks(base, other) {
  const a = Array.isArray(base.termMarks) ? base.termMarks : [], b = other && Array.isArray(other.termMarks) ? other.termMarks : [];
  const key = (m) => [m.id, m.at, m.passage].join("\u0006"), seen = new Set(a.map(key)), add = b.filter((m) => !seen.has(key(m)));
  return add.length ? { ...base, termMarks: [...a, ...add] } : base;
}
function withReading(base, other) {
  base = withTermMarks(withDays(base, other), other);
  if (!other || (other.readAt || 0) <= (base.readAt || 0)) return base;
  if (base.total && other.total && base.total !== other.total) return base;
  const out = { ...base };
  for (const k of READING) { if (other[k] !== undefined) out[k] = other[k]; else delete out[k]; }
  return out;
}
const planSig = (plan) => [...RESTORE_KINDS.map(([st]) => plan.rows[st].map((r) => `${r.id}:${r.st}`).join(",")), plan.aliasSt].join("|");
function canon(v) {
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).filter((k) => !ACTIVITY.has(k) && v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}
const stamp0 = (v) => v.updatedAt || v.createdAt || 0;
// A backup's pinned passage, checked as a note's words are, since it is drawn the same way.
const goodPin = (p) => isObj(p) && isS(p.tid) && goodId(p.tid) && isS(p.text) && p.text.length <= 20000 && ["page", "title", "noteId"].every((k) => optStr(p[k]))
  && optInt(p.at) && (p.open === undefined || typeof p.open === "boolean")
  && (p.anchor === undefined || (isObj(p.anchor) && ["a", "ao", "b", "bo"].every((k) => Number.isInteger(p.anchor[k])) && optStr(p.anchor.pre) && optStr(p.anchor.suf)));
function planRestore(data) {
  const plan = { rows: {}, counts: {}, skipped: 0, content: [], covers: [], aliasSt: "" };
  // The backup's pin comes back when this device has none pinned, or when you take the backup's version of everything.
  if (data.pin !== undefined) { if (goodPin(data.pin)) plan.pin = PIN && canon({ ...data.pin, open: undefined }) === canon({ ...PIN, open: undefined }) ? null : data.pin; else plan.skipped++; }
  for (const [store] of RESTORE_KINDS) {
    const rows = [], c = { new: 0, same: 0, newer: 0, older: 0, conflict: 0 };
    for (const [id, v] of Object.entries((data[store] && typeof data[store] === "object" && data[store]) || {})) {
      if (!goodId(id) || !VALID[store](v)) { plan.skipped++; continue; }
      const cur = mapFor(store).get(id);
      let st;
      if (!cur) st = "new";
      else if (canon(cur) === canon(v)) st = "same";
      else { const a = stamp0(cur), b = stamp0(v); st = a > b ? "newer" : a < b ? "older" : "conflict"; }
      if (id.startsWith("~")) plan.aliasSt = st; else c[st]++; // the alias list is reported on its own line
      rows.push({ id, v, cur, st });
    }
    plan.rows[store] = rows; plan.counts[store] = c;
  }
  // A book's text and cover go with its record: added when the book is new to this device or missing here, replaced when the backup's book wins.
  const textWins = new Map((plan.rows.texts || []).map((r) => [r.id, r.st]));
  for (const [store, list] of [["content", plan.content], ["covers", plan.covers]]) {
    for (const [id, v] of Object.entries((data[store] && typeof data[store] === "object" && data[store]) || {})) {
      if (!goodId(id) || !VALID[store](v)) { plan.skipped++; continue; }
      list.push({ id, v, st: textWins.get(id) || "orphan" });
    }
  }
  return plan;
}
function restoreSummary(plan) {
  const line = (store, one, many) => {
    const c = plan.counts[store], n = (k, label) => (c[k] ? `${c[k]} ${label}` : "");
    const parts = [n("new", "new"), n("older", "updated from the backup"), n("newer", "newer here (kept)"), n("conflict", "changed in both (this device's kept)"), n("same", "unchanged")].filter(Boolean);
    const total = Object.values(c).reduce((a, b) => a + b, 0);
    return total ? `<li><b>${total} ${total === 1 ? one : many}:</b> ${parts.join(", ")}</li>` : "";
  };
  const al = { new: "added", older: "updated from the backup", newer: "newer here (kept)", conflict: "changed in both (this device's kept)", same: "unchanged" }[plan.aliasSt];
  return `<ul class="rs-list">${RESTORE_KINDS.map(([s, one, many]) => line(s, one, many)).join("")}${al ? `<li><b>Look-up aliases:</b> ${al}</li>` : ""}${plan.pin ? `<li><b>Pinned passage:</b> ${PIN ? "a different one is pinned here (kept)" : "pinned again"}</li>` : ""}</ul>`;
}
async function importBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast("That file isn't a Marginalia backup."); return; }
  if (!data || data.app !== "marginalia" || !data.texts || typeof data.texts !== "object") { toast("That file isn't a Marginalia backup."); return; }
  await showRestore(file.name, data, "");
}
// Another window of the app (the installed app and a browser tab, say) may have changed the library since the summary.
async function reloadStores() {
  for (const st of ["texts", "notes", "drafts", "compares", "terms"]) { const m = await idbAll(st), map = mapFor(st); map.clear(); m.forEach((v, k) => map.set(k, v)); }
}
async function confirmRestore(name, data, sig, theirs) {
  if (idb) await reloadStores();
  const plan = planRestore(data);
  if (planSig(plan) !== sig) { render(); return showRestore(name, data, "Your library changed since this summary was made. This is the updated one."); }
  await applyRestore(plan, theirs);
}
async function showRestore(name, data, notice) {
  const file = { name };
  const plan = planRestore(data), sig = planSig(plan), sum = (k) => RESTORE_KINDS.reduce((a, [s]) => a + plan.counts[s][k], 0);
  const changes = sum("new") + sum("older") + (["new", "older"].includes(plan.aliasSt) ? 1 : 0), kept = sum("newer") + sum("conflict") + (["newer", "conflict"].includes(plan.aliasSt) ? 1 : 0);
  const when = data.exportedAt && !isNaN(Date.parse(data.exportedAt)) ? fmtDate(Date.parse(data.exportedAt)) : "";
  const newNotes = plan.counts.notes.new + plan.counts.texts.new;
  let extra = 0;
  for (const r of plan.content) if (["new", "older"].includes(r.st) || (!S.content.has(r.id) && !(idb && (await idbGet("content", r.id).catch(() => null))))) extra++;
  for (const r of plan.covers) if (["new", "older"].includes(r.st) || !S.covers.has(r.id)) extra++;
  if (plan.pin && !PIN) extra++;
  openPanel(`<h2>Restore this backup?</h2>
    ${notice ? `<p class="hint bad">${esc(notice)}</p>` : ""}
    <p class="hint">${esc(file.name)}${when ? `, saved ${esc(when)}` : ""}. Nothing changes until you choose below.</p>
    ${restoreSummary(plan)}
    ${plan.skipped ? `<p class="hint bad">${plan.skipped} record${plan.skipped === 1 ? "" : "s"} in the file couldn't be read and will be skipped.</p>` : ""}
    ${newNotes ? `<p class="hint">Restoring adds everything in the backup that isn't on this device, including anything you deleted after the backup was saved.</p>` : ""}
    ${plan.counts.texts.newer + plan.counts.notes.newer ? `<p class="hint">Where this device has a newer version, it is kept.</p>` : ""}
    ${plan.rows.texts.some((r) => r.cur) ? `<p class="hint">Each book keeps the reading position from whichever copy was read more recently.</p>` : ""}
    ${sum("conflict") ? `<p class="hint bad">${sum("conflict")} record${sum("conflict") === 1 ? " was" : "s were"} changed in both places with the same date. This device's version is kept unless you choose the backup's versions.</p>` : ""}
    <div class="menu">
      ${changes || extra ? `<button class="menuitem" id="rs-merge">Restore${kept ? ", keeping the newer versions" : ""}</button>` : `<p class="hint">Everything in this backup is already on this device.</p>`}
      ${kept ? `<button class="menuitem danger" id="rs-theirs">Restore, using the backup's version of everything</button>` : ""}
    </div>`, (b) => {
    if (b.id === "rs-merge") confirmRestore(name, data, sig, false).catch((e) => toast(failMsg(e)));
    else if (b.id === "rs-theirs") confirmRestore(name, data, sig, true).catch((e) => toast(failMsg(e)));
  });
}
// A note's follow-ups and earlier wordings are only ever added to, so whichever copy of a note wins, those of the other copy are kept too.
// An earlier wording is the same one only when its date and every word of it match.
const wasKey = (w) => JSON.stringify([w.at, w.gloss || "", w.premises || [], w.conclusion || ""]);
function withThoughts(base, other) {
  if (!other || base === other) return base;
  const fu = new Map((base.followups || []).map((f) => [f.id, f])), was = new Map((base.was || []).map((w) => [wasKey(w), w]));
  const n1 = fu.size, n2 = was.size;
  for (const f of other.followups || []) if (!fu.has(f.id)) fu.set(f.id, f);
  for (const w of other.was || []) { const k = wasKey(w); if (!was.has(k)) was.set(k, w); }
  if (fu.size === n1 && was.size === n2) return base;
  const out = { ...base };
  if (fu.size) out.followups = [...fu.values()].sort((a, b) => a.at - b.at);
  if (was.size) out.was = [...was.values()].sort((a, b) => a.at - b.at);
  return out;
}
async function applyRestore(plan, theirs) {
  const take = (st) => st === "new" || st === "older" || (theirs && (st === "newer" || st === "conflict"));
  const ops = [];
  for (const [store] of RESTORE_KINDS) for (const r of plan.rows[store]) {
    if (take(r.st)) ops.push([store, r.id, store === "texts" ? withReading(r.v, r.cur) : store === "notes" ? withThoughts(r.v, r.cur) : r.v]);
    else if (store === "notes" && r.cur) { const m = withThoughts(r.cur, r.v); if (m !== r.cur) ops.push([store, r.id, m, "merged"]); } // the backup's follow-ups join this device's note
    else if (store === "texts" && r.cur) { const m = withReading(r.cur, r.v); if (m !== r.cur) ops.push([store, r.id, m, "pos"]); } // a later reading position travels on its own
  }
  for (const r of plan.content) if (take(r.st) || !S.content.has(r.id) && !(idb && (await idbGet("content", r.id)))) ops.push(["content", r.id, r.v]);
  for (const r of plan.covers) if (take(r.st) || !S.covers.has(r.id)) { try { ops.push(["covers", r.id, await (await fetch(r.v)).blob()]); } catch {} }
  const pinBack = !!plan.pin && (!PIN || theirs);
  if (!ops.length && !pinBack) { toast("Nothing to restore."); return; }
  if (idb && ops.length) await idbTx([...new Set(ops.map((o) => o[0]))], (st) => ops.forEach(([store, id, v]) => st(store).put(v, id)));
  PACE.clear(); // reading time is read again from the restored books
  if (pinBack) { PIN = { ...plan.pin, open: false }; savePin(); }
  ops.forEach(([store, id, v]) => (store === "content" ? S.content : mapFor(store)).set(id, v));
  render();
  const n = (store) => ops.filter((o) => o[0] === store && !o[3]).length;
  const parts = RESTORE_KINDS.map(([s, one, many]) => (n(s) ? `${n(s)} ${n(s) === 1 ? one : many}` : "")).filter(Boolean);
  toast(parts.length ? `Restored ${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0]}.` : "Restored.");
}
