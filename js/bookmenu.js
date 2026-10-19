// Marginalia: a book's More menu (another edition's pages, the paired original) and the book menu and shelf arranging on the home screen. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- a text's More menu ---------- */
/* ---------- another edition's pages: t.conc = { label, pairs: [[a page of this edition, the same place in the other]] } ----------
   Pairs you know (from a reference, or with both books open); between and beyond them the other edition's page is estimated in
   proportion. Shown in the reader's footer, on notes and in the Markdown export; Go to page takes the other edition's numbers too. */
function concPage(t, page, back) {
  const c = t && t.conc; page = String(page ?? "").trim(); if (!c || !page || !c.pairs.length) return null;
  const pairs = c.pairs.map(([a, b]) => (back ? [b, a] : [a, b]));
  const exact = pairs.find(([a]) => a.toLowerCase() === page.toLowerCase()); if (exact) return { p: exact[1], exact: true };
  if (!/^\d+$/.test(page)) return null;
  const n = +page, num = pairs.filter(([a, b]) => /^\d+$/.test(a) && /^\d+$/.test(b)).map(([a, b]) => [+a, +b]).sort((x, y) => x[0] - y[0]);
  if (!num.length) return null;
  let lo = null, hi = null; for (const q of num) { if (q[0] <= n) lo = q; else if (!hi) hi = q; }
  let v;
  if (lo && hi) v = lo[1] + ((n - lo[0]) * (hi[1] - lo[1])) / (hi[0] - lo[0]);
  else if (num.length >= 2) { const [a, b] = lo ? num.slice(-2) : num.slice(0, 2); v = a[1] + ((n - a[0]) * (b[1] - a[1])) / (b[0] - a[0] || 1); }
  else v = num[0][1] + (n - num[0][0]);
  v = Math.round(v); return v >= 1 ? { p: String(v), exact: false } : null;
}
const concLabel = (t, page) => { const r = concPage(t, page); return r ? `${t.conc.label} ${r.exact ? "" : "≈ "}${r.p}` : ""; };
// "26 = 34", "26: 34", "26 34" or "xii = 9", one pair to a line or several separated by semicolons.
function concParse(txt) {
  const out = [], seen = new Set();
  for (const m of String(txt || "").matchAll(/([0-9]+|[ivxlcdm]+)\s*(?:=|:|,|→|->|\s)\s*([0-9]+|[ivxlcdm]+)/gi)) {
    const a = m[1].toLowerCase(), b = m[2].toLowerCase(); if (seen.has(a)) continue; seen.add(a); out.push([a, b]);
  }
  return out.slice(0, CONC_MAX);
}
function concSheet(tid) {
  const t = S.texts.get(tid); if (!t) return;
  const c = t.conc || { label: "", pairs: [] };
  openSheet(`<h2>Another edition's pages</h2><p class="sub">${esc(t.title)}</p>
    <p class="hint">Note where pages of this edition fall in another one, such as the original's (Minuit's for a Deleuze translation), whenever you find out: from a reference in a secondary source, or with both books open. Between and beyond the pairs the app estimates, marked ≈, and the more pairs, the closer the estimate.</p>
    <div class="field"><label for="cc-label">The other edition, in a word or two</label><input id="cc-label" name="label" value="${esc(c.label)}" placeholder="e.g. Minuit" maxlength="60" autocomplete="off"></div>
    <div class="field"><label for="cc-pairs">Pairs: this edition's page = the other's</label><textarea id="cc-pairs" name="pairs" rows="6" placeholder="1 = 7&#10;26 = 34&#10;100 = 118">${esc(c.pairs.map(([a, b]) => `${a} = ${b}`).join("\n"))}</textarea><span class="hint">Leave both empty to remove them.</span></div>`,
  async (fd) => {
    const label = fd.get("label").trim(), pairs = concParse(fd.get("pairs"));
    if (pairs.length && !label) return "Name the other edition, so its pages can be told from these.";
    if (label && !pairs.length && fd.get("pairs").trim()) return "No pairs could be read. Write them as 26 = 34, one to a line.";
    const now = S.texts.get(tid); if (!now) return;
    const rec = { ...now, updatedAt: Date.now() };
    if (pairs.length) rec.conc = { label, pairs }; else delete rec.conc;
    await put("texts", tid, rec);
    return () => toast(pairs.length ? `${pairs.length} pair${pairs.length === 1 ? "" : "s"} saved. ${label} pages now show beside this edition's.` : "The other edition's pages were removed.");
  });
}
/* ---------- a book and its original (or another translation): t.pair names the other book, kept on both ----------
   From the reader (the page number → In the original), the passage in the other book that matches your place: chapter by chapter when
   both have the same number of chapters, else through this book's pairs of pages (t.conc) when the other has page numbers, else in proportion
   to the text before it. Earlier and Later move a paragraph at a time; Open it there reads on in the other book. */
const pairOf = (t) => { const p = t && t.pair && S.texts.get(t.pair); return p && p.hasContent ? p : null; };
const pairName = (t, tp) => (tp.lang && t.lang && tp.lang !== t.lang ? `In the ${{ en: "English", fr: "French", de: "German", la: "Latin", el: "Greek", grc: "Greek", it: "Italian", es: "Spanish" }[tp.lang] || "other"}` : "In the paired book");
const chapterHeads = (B) => B.map((b, i) => [b, i]).filter(([b]) => b.s && !b.stj && roleOf(b) === "chapter").map(([, i]) => i);
function textCum(B) { const c = [0]; for (let i = 0; i < B.length; i++) c.push(c[i] + (B[i].k === "pg" || isHidden(B[i]) ? 0 : plain(B[i].x || "").length)); return c; }
function pairSpot(ta, BA, i, tb, BB) {
  // the middle of your paragraph, so a slightly different length of text before it doesn't land on the paragraph before
  const A = textCum(BA), C = textCum(BB), mid = (A[i] + A[Math.min(i + 1, BA.length)]) / 2;
  const at = (lo, hi, f) => { const want = C[lo] + f * (C[hi] - C[lo]); let k = lo; while (k < hi - 1 && C[k + 1] <= want) k++; return k; };
  const ca = chapterHeads(BA), cb = chapterHeads(BB);
  if (ca.length >= 2 && ca.length === cb.length && i >= ca[0]) {
    let k = ca.length - 1; while (k > 0 && ca[k] > i) k--;
    const aEnd = k + 1 < ca.length ? ca[k + 1] : BA.length, bEnd = k + 1 < cb.length ? cb[k + 1] : BB.length;
    return { i: at(cb[k], bEnd, (mid - A[ca[k]]) / (A[aEnd] - A[ca[k]] || 1)), how: "chapter" };
  }
  const pg = pagesOf(BA)[i], r = pg && ((ta.conc && concPage(ta, pg)) || (tb.conc && concPage(tb, pg, true)));
  if (r) { const j = BB.findIndex((b) => b.k === "pg" && String(b.x).toLowerCase() === String(r.p).toLowerCase()); if (j >= 0) return { i: Math.min(j + 1, BB.length - 1), how: "page" }; }
  return { i: at(0, BB.length, mid / (A[BA.length] || 1)), how: "proportion" };
}
async function pairPanel() {
  const t = S.texts.get(R.tid), tp = pairOf(t); if (!tp) return;
  const BB = await loadContent(t.pair); if (!BB) return toast("The paired book's text isn't on this device.");
  const pid = t.pair, here = currentBlock(), spot = pairSpot(t, R.blocks, here, tp, BB);
  let i = spot.i;
  const step = (d) => { let k = i + d; while (k > 0 && k < BB.length - 1 && !(markable(BB[k]) && plain(BB[k].x || "").trim())) k += d; i = Math.max(0, Math.min(BB.length - 1, k)); };
  if (!(markable(BB[i]) && plain(BB[i].x || "").trim())) step(1);
  const how = { chapter: "Matched chapter by chapter, by the amount of text before your place.", page: "Matched through your pairs of pages.", proportion: "Matched by how far through the book you are, so it may be some way off: use Earlier and Later." }[spot.how];
  const draw = () => { const out = []; for (let k = i, n = 0; k < BB.length && n < 3; k++) { const b = BB[k]; if (!markable(b) || !plain(b.x || "").trim()) continue; out.push(`<p${k === i ? ' class="here"' : ""}>${b.k === "h" ? `<b>${inlineHTML(b.x || "")}</b>` : inlineHTML(b.x || "")}</p>`); n++; }
    const pg = pagesOf(BB)[i]; return `${pg ? `<p class="hint">${esc(loc(pg))}</p>` : ""}<div class="pairtext"${tp.lang ? ` lang="${esc(tp.lang)}"` : ""}>${out.join("")}</div>`; };
  openPanel(`<h2>${esc(tp.title)}</h2><p class="hint">${esc(how)}</p><div id="pairbox">${draw()}</div>
    <div class="noteacts"><button class="btn" data-keep="1" data-pairmove="-1">Earlier</button><button class="btn" data-keep="1" data-pairmove="1">Later</button><button class="btn primary" data-pairopen="1">Open it there</button></div>`, (b) => {
    if (b.dataset.pairmove) { step(+b.dataset.pairmove); $("#pairbox").innerHTML = draw(); return; }
    if (b.dataset.pairopen) go({ screen: "reader", textId: pid, at: i, flash: true });
  });
}
function pairSheet(tid) {
  const t = S.texts.get(tid); if (!t) return;
  const cur = t.pair && S.texts.get(t.pair) ? t.pair : "";
  const list = [...S.texts.entries()].filter(([id, x]) => id !== tid && x.hasContent).sort(([, a], [, b]) => a.title.localeCompare(b.title));
  openPanel(`<h2>Pair with the original</h2><p class="hint">Choose the original of “${esc(t.title)}” (or another translation of it) from your shelf, imported like any book: from a file, or from Wikisource. While you read either one, the page number's panel offers the matching passage in the other.</p>
    <div class="menu">${list.map(([id, x]) => `<button class="menuitem${id === cur ? " on" : ""}" data-pairto="${esc(id)}">${esc(x.title)}${x.author ? ` <span class="hint">${esc(x.author)}</span>` : ""}${id === cur ? " ✓" : ""}</button>`).join("") || `<p class="empty">No other book with its text on your shelf yet.</p>`}
    ${cur ? `<button class="menuitem danger" data-pairto="">Unpair</button>` : ""}</div>`, async (b) => {
    if (b.dataset.pairto === undefined) return;
    try { await setPair(tid, b.dataset.pairto); toast(b.dataset.pairto ? `Paired with “${S.texts.get(b.dataset.pairto).title}”.` : "Unpaired."); }
    catch (e) { toast(failMsg(e)); }
  });
}
// Pairs are kept on both books; pairing one with a third leaves its old partner unpaired.
async function setPair(tid, other) {
  const now = Date.now(), ops = [], put1 = (id, pair) => { const x = S.texts.get(id); if (!x) return; const rec = { ...x, updatedAt: now }; if (pair) rec.pair = pair; else delete rec.pair; ops.push([id, rec]); };
  const t = S.texts.get(tid), old = t && t.pair;
  if (old && old !== other && S.texts.get(old)?.pair === tid) put1(old, "");
  if (other) { const o = S.texts.get(other); if (o && o.pair && o.pair !== tid && S.texts.get(o.pair)?.pair === other) put1(o.pair, ""); put1(other, tid); }
  put1(tid, other);
  if (idb) await idbTx(["texts"], (st) => ops.forEach(([id, r]) => st("texts").put(r, id)));
  for (const [id, r] of ops) S.texts.set(id, r);
  render();
}
function moreMenu() {
  const t = S.texts.get(S.textId); if (!t) return;
  openPanel(`<h2>${esc(t.title)}</h2>
    <div class="menu">
      <button class="menuitem" id="m-file">${t.hasContent ? "Replace the book's file" : "Load the book's file"}</button>
      <button class="menuitem" id="m-edit">Edit details and cover</button>
      ${t.source && t.source.kind === "PDF" ? `<button class="menuitem" id="m-pdf">${t.pdfLabels ? "The kept PDF" : "Keep the original PDF"}</button>` : ""}
      ${t.hasContent ? `<button class="menuitem" id="m-marks">Bring in highlights from a PDF</button>` : ""}
      ${t.hasContent ? `<button class="menuitem" id="m-pair">${pairOf(t) ? `Paired with “${esc(pairOf(t).title)}”` : "Pair with the original or a translation"}</button>` : ""}
      ${t.hasContent ? `<button class="menuitem" id="m-conc">${t.conc ? `${esc(t.conc.label)} pages` : "Another edition's pages"}</button>` : ""}
      <button class="menuitem" id="m-cite">Cite this text</button>
      <button class="menuitem" id="m-export">Export notes as Markdown</button>
      <button class="menuitem danger" id="m-delete">Delete this text</button>
    </div>`, (b) => {
    if (b.id === "m-file") fileSheet(S.textId);
    else if (b.id === "m-edit") textSheet(S.textId);
    else if (b.id === "m-pdf") keepPdfSheet(S.textId);
    else if (b.id === "m-marks") marksSheet(S.textId);
    else if (b.id === "m-conc") concSheet(S.textId);
    else if (b.id === "m-pair") pairSheet(S.textId);
    else if (b.id === "m-export") exportNotes();
    else if (b.id === "m-cite") citeTextPanel(S.textId);
    else if (b.id === "m-delete") confirmDelete();
  });
}
function exportNotes() {
  const t = S.texts.get(S.textId);
  if (!notesFor(S.textId).length && !Object.keys((t && t.summaries) || {}).length) return toast("This text has no notes to export yet.");
  saveFile(`${slug(t && t.title)}-notes.md`, notesMarkdown(S.textId), "text/markdown").catch(() => toast("Couldn't export the notes."));
}
// The book, its notes, its text and its cover go together or not at all. Drafts and comparisons only point at notes.
async function deleteText(id) {
  const t = S.texts.get(id), items = [["texts", id, t], ...notesFor(id).map(([nid, n]) => ["notes", nid, n])];
  for (const st of ["content", "covers", "files"]) items.push([st, id, idb ? await idbGet(st, id) : st === "files" ? undefined : mapFor(st).get(id)]);
  const tid = await trashAndRemove("text", t ? t.title : "", items);
  if (PDFV.tid === id) closePdf();
  SESS.delete(id);
  return tid;
}
function confirmDelete(id = S.textId) {
  const t = S.texts.get(id); if (!t) return;
  const n = notesFor(id).length;
  openPanel(`<h2>Delete “${esc(t.title)}”?</h2>
    <p class="hint">This moves the text${n ? `, its ${n} note${n === 1 ? "" : "s"}` : ""} and its cover to Recently deleted, at the foot of the home screen. They stay there ${TRASH_DAYS} days.</p>
    <div class="menu"><button class="menuitem danger" id="m-delete-yes">Delete this text</button></div>`, async (b) => {
    if (b.id !== "m-delete-yes") return;
    if (S.screen === "text" && S.textId === id) await back(); // its page goes with it; from the shelf, stay there
    try { const tid = await deleteText(id); delToast("Deleted.", tid); } catch (err) { if (!err.noRoom) toast(`Couldn't delete “${t.title}”, so nothing was removed. ${err && err.name === "QuotaExceededError" ? failMsg(err) : "Try again."}`); }
    render();
  });
}

/* ---------- a book's menu: hold a book on the shelf, or right-click it ---------- */
function bookMenu(id) {
  const t = S.texts.get(id); if (!t) return;
  const cur = t.status || "reading";
  openPanel(`<h2>${esc(t.title)}</h2>
    <p class="hint">${t.author ? `${esc(t.author)} · ` : ""}On the ${esc(STATUS[cur] || cur)} shelf</p>
    <div class="menu">
      ${t.hasContent ? `<button class="menuitem" id="bm-read">${t.pos > 0 ? "Continue reading" : "Start reading"}</button>` : ""}
      <button class="menuitem" id="bm-open">Open the book's page</button>
      <button class="menuitem" id="bm-edit">Edit details and cover</button>
      ${Object.entries(STATUS).filter(([k]) => k !== cur).map(([k, v]) => `<button class="menuitem" data-move="${k}">Move to ${esc(v)}</button>`).join("")}
      <button class="menuitem danger" id="bm-delete">Delete this text</button>
    </div>`, (b) => {
    if (b.id === "bm-read") go({ screen: "reader", textId: id });
    else if (b.id === "bm-open") go({ screen: "text", textId: id });
    else if (b.id === "bm-edit") textSheet(id);
    else if (b.dataset.move) moveBook(id, b.dataset.move);
    else if (b.id === "bm-delete") confirmDelete(id);
  });
}
// Another shelf: the book goes to the front of it, as when its status is changed on its page; Undo puts it back.
async function moveBook(id, st) {
  const t = S.texts.get(id); if (!t || !STATUS[st]) return;
  const was = { status: t.status, updatedAt: t.updatedAt, rank: t.rank };
  try {
    const moved = { ...t, status: st, updatedAt: Date.now() }; delete moved.rank; // the front of its new shelf
    await put("texts", id, moved);
    toast(`Moved to ${STATUS[st]}.`, { label: "Undo", run: () => {
      const now = S.texts.get(id); if (!now) return;
      const rec = { ...now, updatedAt: was.updatedAt }; if (was.status) rec.status = was.status; else delete rec.status;
      if (Number.isFinite(was.rank)) rec.rank = was.rank; else delete rec.rank;
      put("texts", id, rec).catch((e) => toast(failMsg(e)));
    } });
  } catch (e) { toast(failMsg(e)); }
}
// The shelf by hand. A finger kept still on a book for half a second lifts it and opens its menu; moving the finger then puts
// the menu away and carries the book, to another place on its shelf or onto another shelf, and letting go sets it down there.
// Letting go without moving leaves the menu open; moving sooner scrolls, and a quick tap opens the book, as before. With a
// mouse, dragging a book carries it straight away and right-click opens the menu; the keyboard's menu key opens it too.
// Android's own long press arrives as contextmenu, which here only lifts the book a moment early.
const HOLD = { timer: 0, id: null, x: 0, y: 0, px: 0, py: 0, el: null, touch: false, mouse: false, lifted: false, swallow: false, drag: null, raf: 0 };
function endHold() {
  clearTimeout(HOLD.timer); HOLD.timer = 0;
  if (HOLD.el) HOLD.el.classList.remove("held", "lifted");
  Object.assign(HOLD, { el: null, touch: false, mouse: false, lifted: false });
}
function liftBook() {
  const b = HOLD.el; if (!b || HOLD.lifted || HOLD.drag) return;
  clearTimeout(HOLD.timer); HOLD.timer = 0; HOLD.lifted = true;
  b.classList.remove("held"); b.classList.add("lifted");
  try { navigator.vibrate && navigator.vibrate(12); } catch {}
  bookMenu(b.dataset.open);
}
document.addEventListener("pointerdown", (e) => {
  HOLD.swallow = false;
  if (HOLD.drag) return;
  endHold();
  const b = e.target.closest && e.target.closest(".shelfbook[data-open]");
  if (!b || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
  Object.assign(HOLD, { id: e.pointerId, x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, el: b, touch: e.pointerType !== "mouse", mouse: e.pointerType === "mouse" });
  if (HOLD.touch) { b.classList.add("held"); HOLD.timer = setTimeout(liftBook, 500); }
}, true);
document.addEventListener("pointermove", (e) => {
  if (e.pointerId !== HOLD.id) return;
  HOLD.px = e.clientX; HOLD.py = e.clientY;
  if (HOLD.drag) { dragTo(); return; }
  if (!HOLD.el) return;
  const far = Math.hypot(e.clientX - HOLD.x, e.clientY - HOLD.y);
  if (HOLD.touch && !HOLD.lifted) { if (far > 10) endHold(); return; } // the finger moved first: a scroll
  if ((HOLD.lifted && far > 10) || (HOLD.mouse && (e.buttons & 1) && far > 6)) startDrag();
}, true);
// once a book is lifted, the page stays put under the finger (on #main only, so the reader's scrolling never waits for this)
$("#main").addEventListener("touchmove", (e) => { if ((HOLD.lifted || HOLD.drag) && e.cancelable) e.preventDefault(); }, { passive: false });
document.addEventListener("pointerup", (e) => {
  if (e.pointerId !== HOLD.id) return;
  const held = HOLD.lifted || !!HOLD.drag;
  if (HOLD.drag) dropBook(false);
  endHold();
  if (held) { HOLD.swallow = true; setTimeout(() => { HOLD.swallow = false; }, 400); } // the release isn't a tap
}, true);
document.addEventListener("pointercancel", (e) => { if (e.pointerId !== HOLD.id) return; if (HOLD.drag) dropBook(true); endHold(); }, true);
document.addEventListener("click", (e) => { if (HOLD.swallow) { HOLD.swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener("contextmenu", (e) => {
  const b = e.target.closest && e.target.closest(".shelfbook[data-open]");
  if (!b && !HOLD.lifted && !HOLD.drag) return;
  e.preventDefault();
  if (HOLD.touch) { liftBook(); return; }
  if (!b || HOLD.drag || NAV.overlay) return;
  bookMenu(b.dataset.open);
});
function startDrag() {
  const b = HOLD.el, cov = b && b.querySelector(".cover"); if (!cov) return;
  if (NAV.overlay) closeOverlay(); // the menu goes once the book moves
  const r = cov.getBoundingClientRect(), ghost = cov.cloneNode(true), mark = document.createElement("div");
  ghost.classList.add("dragghost"); ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
  mark.className = "dropmark"; mark.hidden = true;
  document.body.append(mark, ghost);
  b.classList.remove("held", "lifted"); b.classList.add("dragging");
  HOLD.drag = { id: b.dataset.open, el: b, ghost, mark, ox: HOLD.x - r.left, oy: HOLD.y - r.top, target: null };
  HOLD.lifted = false;
  dragTo(); HOLD.raf = requestAnimationFrame(edgeScroll);
}
// Where the carried book would go: beside the nearest book of the shelf under the finger (row first, then side).
function dragTo() {
  const d = HOLD.drag; if (!d) return;
  const x = HOLD.px, y = HOLD.py;
  d.ghost.style.left = x - d.ox + "px"; d.ghost.style.top = y - d.oy + "px";
  const under = document.elementFromPoint(x, y), shelf = under && under.closest && under.closest(".shelf[data-st]");
  d.target = null; d.mark.hidden = true;
  if (!shelf) return;
  const books = [...shelf.querySelectorAll(".shelfbook[data-open]")].filter((b) => b.dataset.open !== d.id);
  if (!books.length) { d.target = { st: shelf.dataset.st, at: 0 }; return; }
  let best = null, bd = Infinity;
  for (const b of books) {
    const c = b.querySelector(".cover").getBoundingClientRect(), dist = Math.hypot(x - (c.left + c.width / 2), 2 * (y - (c.top + c.height / 2)));
    if (dist < bd) { bd = dist; best = { b, c }; }
  }
  const after = x > best.c.left + best.c.width / 2;
  d.target = { st: shelf.dataset.st, at: books.indexOf(best.b) + (after ? 1 : 0) };
  Object.assign(d.mark.style, { left: (after ? best.c.right + 5 : best.c.left - 9) + "px", top: best.c.top + "px", height: best.c.height + "px" });
  d.mark.hidden = false;
}
// Near the top or bottom of the screen the page scrolls, so a book can be carried to a shelf out of sight.
function edgeScroll() {
  if (!HOLD.drag) return;
  const edge = 72, y = HOLD.py, v = y < edge ? -Math.ceil((edge - y) / 5) : y > innerHeight - edge ? Math.ceil((y - innerHeight + edge) / 5) : 0;
  if (v) { const before = scrollY; window.scrollBy(0, v); if (scrollY !== before) dragTo(); }
  HOLD.raf = requestAnimationFrame(edgeScroll);
}
// Setting it down: the shelf takes the order you see, each book keeping its place (rank); dropped on another shelf, the
// book moves there too. Dropped where it was, or off the shelves, nothing changes. Undo puts the shelves back.
async function dropBook(cancel) {
  const d = HOLD.drag; HOLD.drag = null; cancelAnimationFrame(HOLD.raf);
  d.ghost.remove(); d.mark.remove(); d.el.classList.remove("dragging");
  const t = S.texts.get(d.id); if (cancel || !d.target || !t) return;
  const st = d.target.st, from = t.status || "reading", was = shelfList(st);
  const list = was.filter(([x]) => x !== d.id);
  list.splice(Math.min(d.target.at, list.length), 0, [d.id, t]);
  if (st === from && list.every(([x], k) => was[k][0] === x)) return;
  const now = Date.now(), changed = [];
  list.forEach(([x, cur], k) => {
    const rec = { ...cur, rank: k };
    if (x === d.id && st !== from) { rec.status = st; rec.updatedAt = now; }
    if (rec.rank !== cur.rank || rec.status !== cur.status) changed.push([x, rec, cur]);
  });
  const put3 = async (pairs) => { await idbTx(["texts"], (s) => pairs.forEach(([x, rec]) => s("texts").put(rec, x))); pairs.forEach(([x, rec]) => S.texts.set(x, rec)); render(); };
  try {
    await put3(changed.map(([x, rec]) => [x, rec]));
    toast(st !== from ? `Moved to ${STATUS[st]}.` : "Moved.", { label: "Undo", run: () => {
      // only where they stood is put back, so anything changed since stays
      const back = changed.filter(([x]) => S.texts.has(x)).map(([x, , old]) => { const rec = { ...S.texts.get(x) }; for (const k of ["rank", "status", "updatedAt"]) { if (old[k] === undefined) delete rec[k]; else rec[k] = old[k]; } return [x, rec]; });
      put3(back).catch((e) => toast(failMsg(e)));
    } });
  } catch (e) { toast(failMsg(e)); }
}
