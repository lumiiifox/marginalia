// Marginalia: the reader: layout, swipe pages and the page flip, your place and jumps, reading pace, highlights, notes in the text and the pinned passage. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- reader ---------- */
// Reading settings live on this device only.
const RS = { fs: 20, lh: "normal", w: "medium", tone: "app", mn: "show", flow: "scroll", turn: "flip", align: "justify", bars: "hide", awake: "on", sum: "ask" };
try { Object.assign(RS, JSON.parse(localStorage.getItem("mg-reader") || "{}")); const old = +localStorage.getItem("mg-fs"); if (old && !localStorage.getItem("mg-reader")) RS.fs = old; } catch {}
const LH = { compact: 1.45, normal: 1.62, airy: 1.85 }, MEASURE = { narrow: "30em", medium: "34em", wide: "40em" };
function applyFs() {
  const book = $("#book"), reader = $("#reader");
  book.style.setProperty("--fs", RS.fs + "px");
  book.style.setProperty("--lh", LH[RS.lh] || 1.62);
  book.style.setProperty("--measure", MEASURE[RS.w] || "34em");
  book.classList.toggle("hide-mn", RS.mn === "hide"); R.ver = (R.ver || 0) + 1;
  reader.classList.toggle("paged-reader", RS.flow === "pages");
  reader.classList.toggle("justify", RS.align !== "left");
  reader.classList.toggle("immersive", RS.flow === "pages" && RS.bars !== "show"); reader.classList.remove("bars-on");
  reader.classList.remove("tone-paper", "tone-sepia", "tone-night");
  if (RS.tone !== "app") reader.classList.add("tone-" + RS.tone);
  layoutPages(); syncThemeColor();
}
// The phone's status bar takes the colour of the page while reading, and the app's colours elsewhere.
const THEME0 = [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => [m, m.content]);
function syncThemeColor() {
  const c = S.screen === "reader" ? getComputedStyle($("#reader")).getPropertyValue("--paper").trim() : "";
  for (const [m, v] of THEME0) m.content = c || v;
}
// Swipe pages, toolbar hidden while reading: a tap in the middle of the page shows it over the top lines, and a page turn
// or another tap puts it away. The page itself keeps its size, so the text never moves.
const immersive = () => isPaged() && RS.bars !== "show";
function showBars(on) { $("#reader").classList.toggle("bars-on", on && immersive()); showNav(on && immersive()); }
/* moving through the book: a slider over its whole length with the chapters marked, and a page number to go to */
const navBlock = (v) => { const want = (v / 1000) * R.cum[R.blocks.length]; let lo = 0, hi = R.blocks.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (R.cum[m] <= want) lo = m; else hi = m - 1; } return lo; };
function showNav(on) {
  const nav = $("#rnav"); if (!R.blocks) on = false;
  nav.hidden = !on; if (!on) return;
  const total = R.cum[R.blocks.length] || 1, ticks = [];
  R.blocks.forEach((b, i) => { if (b.s && !b.stj && roleOf(b) === "chapter") ticks.push(`<i style="left:${((100 * R.cum[i]) / total).toFixed(2)}%"></i>`); });
  $("#rnav-ticks").innerHTML = ticks.join("");
  const t = S.texts.get(R.tid); $("#rnav-pp").hidden = !(t && t.source && t.source.kind === "PDF");
  const tp = pairOf(t); $("#rnav-pair").hidden = !tp; if (tp) $("#rnav-pair").textContent = pairName(t, tp);
  syncNav();
}
// Your notes on the slider. Notes closer together than a fingertip share one mark showing how many; a mark opens its notes,
// and going to one keeps your place for the way back (the trail's ← Your place).
const NAVNOTE_PX = 24;
function navNoteGroups() {
  const box = $("#rnav-notes"), total = R.cum[R.blocks.length] || 1, w = Math.max(1, (box.parentElement.clientWidth || innerWidth) - 16);
  const list = notesFor(R.tid).filter(([, n]) => Number.isInteger(n.at)).map(([id, n]) => ({ id, n, i: Math.min(Math.max(n.at, 0), R.blocks.length - 1) }))
    .map((x) => ({ ...x, px: (w * R.cum[x.i]) / total })).sort((a, b) => a.px - b.px);
  const groups = [];
  for (const x of list) { const g = groups[groups.length - 1]; if (g && x.px - g.first < NAVNOTE_PX) g.notes.push(x); else groups.push({ first: x.px, notes: [x] }); }
  return groups.map((g) => { const px = g.notes.reduce((a, x) => a + x.px, 0) / g.notes.length; return { notes: g.notes, left: (100 * px) / w }; });
}
function drawNavNotes() {
  const box = $("#rnav-notes"); if (!box) return;
  const groups = R.blocks ? navNoteGroups() : [], cur = currentBlock();
  R.navGroups = groups; box.hidden = !groups.length; $("#rnav").classList.toggle("has-notes", !!groups.length);
  box.innerHTML = groups.map((g, k) => {
    const a = g.notes[0].i, b = g.notes[g.notes.length - 1].i, here = cur >= a - 1 && cur <= b + 1, many = g.notes.length > 1;
    const where = [R.pageAt[a] ? loc(R.pageAt[a]) : "", many && R.pageAt[b] && R.pageAt[b] !== R.pageAt[a] ? `to ${loc(R.pageAt[b])}` : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${many ? "many" : ""}${here ? " here" : ""}" data-navnotes="${k}" style="left:${g.left.toFixed(2)}%" aria-label="${many ? `${g.notes.length} notes` : "A note"}${where ? `, ${esc(where)}` : ""}"><span>${many ? g.notes.length : ""}</span></button>`;
  }).join("");
}
function navNotesOpen(k) {
  const g = (R.navGroups || [])[k]; if (!g) return;
  if (g.notes.length === 1) { jumpTo(g.notes[0].i, true); drawNavNotes(); return; }
  const t = S.texts.get(R.tid), names = new Map((t?.sections || []).map((s) => [s.id, s.label]));
  openPanel(`<h2>${g.notes.length} notes here</h2><p class="hint">Going to one keeps your place: ← Your place brings you back.</p>
    <div class="toc">${g.notes.map((x) => `<button class="tocitem" data-gonote="${x.i}"><span><b>${esc(KINDS[x.n.kind] || "Note")}</b> ${esc(noteSnippet(x.n, 110))}${x.n.gloss && x.n.passage ? `<br><small>${esc(noteSnippet({ gloss: x.n.gloss }, 90))}</small>` : ""}</span><span class="tp">${esc([R.pageAt[x.i] ? loc(R.pageAt[x.i]) : "", names.get(R.secAt[x.i]) && !R.pageAt[x.i] ? names.get(R.secAt[x.i]) : ""].filter(Boolean).join(""))}</span></button>`).join("")}</div>`,
  (b) => { if (b.dataset.gonote) { jumpTo(+b.dataset.gonote, true); drawNavNotes(); } });
}
function navLabel(i) {
  i = contentAt(i); const names = new Map((S.texts.get(R.tid)?.sections || []).map((s) => [s.id, s.label])), ch = names.get(R.secAt[i]);
  return [R.pageAt[i] ? loc(R.pageAt[i]) : "", ch || ""].filter(Boolean).join(" · ");
}
function syncNav(i = currentBlock()) {
  const total = R.cum[R.blocks.length] || 1, v = Math.round((1000 * R.cum[i]) / total);
  if (!R.dragging) $("#rnav-r").value = v;
  $("#rnav-where").textContent = navLabel(i); $("#rnav-pct").textContent = `${Math.round(v / 10)}%`;
  drawNavNotes();
}
// The first block of a printed page: an exact label (roman numerals too), or the last numbered page before the number.
function blockForPage(want) {
  want = String(want || "").trim().toLowerCase(); if (!want) return -1;
  const B = R.blocks; let best = -1, bestN = -Infinity;
  for (let i = 0; i < B.length; i++) {
    if (B[i].k !== "pg") continue;
    const x = String(B[i].x).trim().toLowerCase(); if (x === want) return i;
    const n = parseInt(x, 10); if (/^\d+$/.test(want) && n <= +want && n > bestN) { best = i; bestN = n; }
  }
  return best;
}
/* the screen stays on while you read: a slow page shouldn't let the phone lock. Let go after five minutes without a touch. */
const WAKE = { lock: null, t: 0, asking: false };
async function wakeOn() {
  if (RS.awake === "off" || S.screen !== "reader" || document.visibilityState !== "visible" || !navigator.wakeLock) return;
  clearTimeout(WAKE.t); WAKE.t = setTimeout(wakeOff, 5 * 60000);
  if (WAKE.lock || WAKE.asking) return;
  WAKE.asking = true;
  try { const l = await navigator.wakeLock.request("screen"); WAKE.lock = l; l.addEventListener("release", () => { if (WAKE.lock === l) WAKE.lock = null; }); if (S.screen !== "reader") wakeOff(); }
  catch {} finally { WAKE.asking = false; }
}
function wakeOff() { clearTimeout(WAKE.t); const l = WAKE.lock; WAKE.lock = null; if (l) l.release().catch(() => {}); }
// Scroll shows the whole book. Swipe pages shows one section of it at a time (about 250 paragraphs, cut at a
// heading where there is one, so a chapter starts on a fresh page): the browser lays out every page of a
// multi-column box again on each turn, so a whole 700-page book took about 110 ms a turn on a desktop and far longer on a phone.
const CHUNK = 250;
function chunkStarts(blocks) {
  const starts = [0], n = blocks.length;
  for (let a = 0; a + CHUNK * 1.5 < n;) {
    const from = a + CHUNK, find = (ok, to) => { for (let i = from; i < Math.min(n, to); i++) if (ok(blocks[i])) return i; return -1; };
    // a cut just before page markers or footnotes that lead into a continued paragraph would split it, and so would
    // a cut inside a title broken over several lines
    const joins = (i) => { let q = i; while (q < n && (blocks[q].k === "fn" || betweenPages(blocks[q]))) q++; return q < n && carriesOn(blocks[q]); };
    let cut = find(isTitleLead, a + CHUNK * 2);
    if (cut < 0) { for (let i = from; i < Math.min(n, a + CHUNK * 1.5); i++) if (blocks[i].k === "pg" && !joins(i) && !(blocks[i + 1] && blocks[i + 1].stj)) { cut = i; break; } }
    if (cut < 0) { cut = from; while (cut < n - 1 && (blocks[cut].k === "c" || blocks[cut].stj || joins(cut))) cut++; }
    starts.push(cut); a = cut;
  }
  return starts;
}
function chunkAt(i) {
  const st = R.chunks || [0]; let lo = 0, hi = st.length - 1, k = 0;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (st[mid] <= i) { k = mid; lo = mid + 1; } else hi = mid - 1; }
  return [st[k], k + 1 < st.length ? st[k + 1] : R.blocks.length];
}
// Swipe pages read like a book. A paragraph the printed page cut in two is joined again; the printed page number becomes a
// small marker where that page began; the footnotes from the foot of that page follow the paragraph. Only the display
// changes: the stored book, notes, search and citations keep every block as it was.
// Structure you mark in the reader (select, then Edit → what is this?). It is kept on the block itself, so block numbers,
// which notes, bookmarks and reading places point at, never move; Plain text takes any of it off again.
//   st:  "chapter" | "heading" | "hide" (a running head) | "title" (a title page) | "text"
//   sth: only the first sth characters are the title or running head (one glued to the start of a paragraph)
//   stj: this line carries on the title just before it (a title the PDF broke over several lines)
// A block with no mark keeps what the import made of it: a heading linked to a section is a chapter title.
function roleOf(b) { if (!b) return ""; if (b.st) return b.st; return b.k === "h" ? (b.s ? "chapter" : "heading") : b.k === "q" ? "quote" : ""; }
const isTitleRole = (r) => r === "chapter" || r === "heading";
const isHidden = (b) => !!b && b.st === "hide" && !b.sth;
const isTitleLead = (b) => !!b && !b.stj && !b.sth && isTitleRole(roleOf(b));
function titleTail(B, i) { const out = []; if (isTitleLead(B[i])) for (let k = i + 1; k < B.length && B[k].stj; k++) out.push(k); return out; }
const titleLevel = (b) => (b.st ? (b.st === "chapter" ? 1 : 2) : Math.min(b.l || 2, 4));
const glueAfter = (x) => (/\p{L}-$/u.test(String(x || "").trimEnd()) ? "" : " "); // a word broken at a line end joins up
// Text x cut after n characters (italics markers don't count; italics open at the cut are closed and reopened).
function splitAt(x, n) {
  x = x || ""; let c = 0, k = 0, open = false;
  for (; k < x.length && c < n; k++) { const ch = x[k]; if (ch === I0) open = true; else if (ch === I1) open = false; else c++; }
  return [x.slice(0, k) + (open ? I1 : ""), (open ? I0 : "") + x.slice(k)];
}
// The words of the title starting at block i, as one line.
function titleText(B, i) {
  const b = B[i]; if (!b) return "";
  if (b.sth) return plain(splitAt(b.x, b.sth)[0]).replace(/\s+/g, " ").trim();
  let x = plain(b.x); for (const k of titleTail(B, i)) x += glueAfter(x) + plain(B[k].x);
  return x.replace(/\s+/g, " ").trim();
}
// Where each block is: its printed page, and the section (chapter) it falls in.
// Also where each block's chapter ends (chEnd), and how much text comes before each block (cum), for moving through the
// book by distance.
function sectionIndex(blocks) {
  let pg = "", sc = ""; const n = blocks.length, pageAt = [], secAt = [], chEnd = new Int32Array(n), cum = new Float64Array(n + 1);
  blocks.forEach((b, i) => { if (b.k === "pg") pg = b.x; if (b.s && !b.stj && roleOf(b) === "chapter") sc = b.s; pageAt[i] = pg; secAt[i] = sc; cum[i + 1] = cum[i] + (b.k === "pg" || isHidden(b) ? 0 : 40 + (b.x || "").length); });
  for (let i = n - 1, end = n; i >= 0; i--) { chEnd[i] = end; if (i > 0 && secAt[i] !== secAt[i - 1]) end = i; }
  return { pageAt, secAt, chEnd, cum };
}
const isPara = (b) => !!b && (b.k === "p" || b.k === "c") && (!b.st || b.st === "text" || (b.st === "hide" && !!b.sth));
// A paragraph that carries on from the page before: a continuation, or one whose glued running head is hidden.
const carriesOn = (b) => !!b && b.k === "c" && isPara(b);
// Hidden running heads sit between pages like the page markers do.
const betweenPages = (b) => b.k === "pg" || isHidden(b);
function pagedPlan(a, b) {
  const B = R.blocks, units = [], grp = new Map(), lead = new Map(), tails = new Map();
  for (let i = a; i < b;) {
    // printed page markers (and hidden running heads) just before a paragraph: shown inside it, at its start
    let j = i; while (j < b && betweenPages(B[j])) j++;
    if (j > i && j < b && B[j].k === "p" && isPara(B[j])) { const L = j, m = []; for (let k = i; k < j; k++) { m.push(k); lead.set(k, L); } grp.set(L, { pre: m, parts: [] }); i = j; }
    if (!isPara(B[i])) {
      const tail = titleTail(B, i).filter((k) => k < b); // the further lines of a title are drawn in it
      units.push(i); if (tail.length) { tails.set(i, tail); tail.forEach((k) => lead.set(k, i)); }
      i += 1 + tail.length; continue;
    }
    const L = i, g = grp.get(L) || { pre: [], parts: [] }, notes = [];
    // a paragraph running on past a page break (footnotes, page markers and running heads, then its continuation) is joined up
    let k = i + 1;
    for (;;) {
      let q = k, fns = [], pgs = [];
      while (q < b && (B[q].k === "fn" || betweenPages(B[q]))) { (B[q].k === "fn" ? fns : pgs).push(q); q++; }
      if (!pgs.length || q >= b || !carriesOn(B[q])) break;
      notes.push(...fns); g.parts.push(...pgs, q); [...pgs, q].forEach((m) => lead.set(m, L)); k = q + 1;
    }
    if (g.pre.length || g.parts.length) grp.set(L, g);
    units.push(L, ...notes); i = k;
  }
  // screen order of every block, for finding the one at the top of a page
  const order = [];
  for (const u of units) { const g = grp.get(u); if (g) order.push(...g.pre, u, ...g.parts); else order.push(u, ...(tails.get(u) || [])); }
  return { units, grp, lead, order };
}
const pgMark = (i) => (R.blocks[i].k === "pg" ? `<span class="pgm" data-i="${i}" aria-label="page ${esc(R.blocks[i].x)}">${esc(R.blocks[i].x)}</span>` : `<span class="bhid" data-i="${i}"></span>`);
// The words of a paragraph that are shown as reading text: all of them, or those after a glued title or running head.
const bodyOf = (b) => (b.sth ? splitAt(b.x, b.sth)[1] : b.x || "");
// A paragraph's element. A title glued to its start is drawn as a heading above it; a glued running head is left out
// (data-o says how many characters of the block come before the text shown, for selections).
function paraHTML(L, html, notes, marks) {
  const b = R.blocks[L], cls = `bp${b.k === "c" ? " cont" : ""}`;
  if (!b.sth) return `<p class="${cls}" data-i="${L}">${html}${notes}</p>`;
  if (b.st === "hide") return `<p class="${cls}" data-i="${L}" data-o="${Number(b.sth) || 0}">${html}${notes}</p>`;
  return `<div class="bsplit" data-i="${L}"><h2 class="bh l${titleLevel(b)}">${inlineHTML(splitAt(b.x, b.sth)[0], marks)}</h2><p class="bp cont">${html}${notes}</p></div>`;
}
function groupHTML(L, marks, grp = R.grp) {
  const B = R.blocks, g = grp.get(L), m = (i) => marks.get(i);
  let html = g.pre.map(pgMark).join("") + inlineHTML(bodyOf(B[L]), m(L)), notes = marginHTML(m(L), B[L].x || ""), prev = bodyOf(B[L]);
  for (const i of g.parts) {
    if (betweenPages(B[i])) { html += pgMark(i); continue; }
    html += `${glueAfter(prev)}<span class="bjoin" data-i="${i}"${B[i].sth ? ` data-o="${Number(B[i].sth) || 0}"` : ""}>${inlineHTML(bodyOf(B[i]), m(i))}</span>`; notes += marginHTML(m(i), B[i].x || ""); prev = bodyOf(B[i]);
  }
  return paraHTML(L, html, notes, m(L));
}
// Chapters start on a fresh page in Swipe pages, and so does a title page and whatever follows it; the rest of the
// page before stays blank. A printed page marker or a part title just before a chapter title goes with it.
function chapterStarts(a, b) {
  const B = R.blocks, out = [];
  const quiet = (x) => betweenPages(x) || !!x.stj;
  const mark = (j) => out.push(j);
  let prev = "";
  for (let i = a; i < b; i++) {
    const x = B[i]; if (quiet(x)) continue;
    const r = roleOf(x), chapter = r === "chapter" && !!x.s;
    if (chapter || (r === "title") !== (prev === "title")) {
      let j = i; while (j - 1 >= a && (quiet(B[j - 1]) || (chapter && roleOf(B[j - 1]) === "heading"))) j--;
      mark(j);
    }
    prev = r;
  }
  return out;
}
function markChapters(a, b) {
  R.chap = new Set(chapterStarts(a, b));
  for (const j of R.chap) { const el = R.els[j] && R.els[j].closest("#book > *"); if (el) el.classList.add("chap"); }
}
// Draw block i again (new highlights or notes, an edited paragraph), with the paragraph or title it was joined to, if any.
function rerenderBlock(i, marks) {
  let L = (R.lead && R.lead.get(i)) ?? i;
  while (L > 0 && R.blocks[L].stj) L--;
  const joined = R.grp && R.grp.has(L);
  if (!R.els[L]) return;
  const tmp = document.createElement("div"); tmp.innerHTML = joined ? groupHTML(L, marks) : blockHTML(R.blocks[L], L, marks);
  const el = tmp.firstElementChild; R.els[L].replaceWith(el); R.els[L] = el;
  if (R.chap && R.chap.has(L) && RS.flow === "pages") el.classList.add("chap");
  el.querySelectorAll("[data-i]").forEach((x) => { R.els[+x.dataset.i] = x; });
  R.dirty = true; R.ver = (R.ver || 0) + 1;
  if (FIND.on) paintFind();
  paintTerms();
}
// One section of the book as Swipe pages draws it.
function pagedHTML(a, b, marks) {
  const plan = pagedPlan(a, b);
  return { plan, html: plan.units.map((i) => (plan.grp.has(i) ? groupHTML(i, marks, plan.grp) : blockHTML(R.blocks[i], i, marks))).join("") };
}
function renderBook(center) {
  const book = $("#book"), marks = marksByBlock(R.tid), n = R.blocks.length;
  const [a, b] = RS.flow === "pages" ? chunkAt(Math.max(0, Math.min(center || 0, n - 1))) : [0, n];
  R.els = new Array(n);
  if (RS.flow === "pages") {
    const { plan, html } = pagedHTML(a, b, marks); R.grp = plan.grp; R.lead = plan.lead; R.order = plan.order;
    book.innerHTML = html;
    book.querySelectorAll("[data-i]").forEach((el) => { R.els[+el.dataset.i] = el; });
    markChapters(a, b);
  } else {
    R.grp = new Map(); R.lead = new Map(); R.order = null;
    let html = "";
    for (let i = a; i < b; i++) { html += blockHTML(R.blocks[i], i, marks); i += titleTail(R.blocks, i).length; }
    book.innerHTML = html;
    book.querySelectorAll("[data-i]").forEach((el) => { R.els[+el.dataset.i] = el; });
  }
  R.win = [a, b];
  R.sig = new Map([...marks].filter(([i]) => i >= a && i < b).map(([i, l]) => [i, sigOf(l)]));
  book.scrollLeft = 0; R.dirty = true; R.ver = (R.ver || 0) + 1;
  if (RS.flow === "pages") setTimeout(() => { if (flipMode() && R.win && !R.flip) fillTwin(R.win[0]); }, 400); // ready before the first turn
  if (FIND.on) paintFind();
  paintTerms();
}
// Make sure the section holding paragraph i is the one on screen.
function ensureWindow(i) { if (R.blocks && (!R.win || i < R.win[0] || i >= R.win[1])) renderBook(i); }
// Swipe pages: one column per screen. The page width is a whole number of pixels and is also the step used to turn,
// so every page starts exactly where the last one ended. (On phones whose screens are a fraction of a pixel wide,
// stepping by the rounded width pushed the text a little further off each page: 25 px after 60 pages at 411.43 px.)
const PAGE_GAP = 48;
function layoutPages() {
  const book = $("#book"), reader = $("#reader");
  if (RS.flow !== "pages") { ["--page-w", "--page-h", "--col-w"].forEach((k) => book.style.removeProperty(k)); R.pageW = 0; return; }
  const w = Math.floor(reader.getBoundingClientRect().width || window.innerWidth);
  const barBottom = immersive() ? 0 : $(".rbar").getBoundingClientRect().bottom;
  const h = Math.floor(window.innerHeight - Math.max(0, barBottom) - PINH); // the pinned passage, if any, sits below the page
  if (w < 200 || h < 200) return; // the reader isn't on screen yet
  book.style.setProperty("--page-w", w + "px");
  book.style.setProperty("--page-h", h + "px");
  book.style.setProperty("--col-w", w - PAGE_GAP + "px");
  R.pageW = w; R.dirty = true; R.ver = (R.ver || 0) + 1;
}
function saveRS() { try { localStorage.setItem("mg-reader", JSON.stringify(RS)); } catch {} }
const barH = () => $(".rbar")?.offsetHeight || 0;

// A note number printed as a superscript (¹², as the import writes them) can be tapped to read its note.
const FNREF = /[⁰¹²³⁴⁵⁶⁷⁸⁹]{1,3}/g;
const fnRefs = (html) => html.replace(FNREF, (m) => `<span class="fnref" data-fn="${[...m].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join("")}" role="button" tabindex="0" aria-label="Note ${[...m].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join("")}">${m}</span>`);
function inlineHTML(x, marks) { return fnRefs(inlineMarks(x, marks)); }
function inlineMarks(x, marks) {
  if (!marks || !marks.length) return esc(x).replace(/\u0001/g, "<em>").replace(/\u0002/g, "</em>");
  let raw = x;
  if (marks && marks.length) {
    const map = []; let ps = "";
    for (let k = 0; k < raw.length; k++) { const c = raw[k]; if (c === I0 || c === I1) continue; map.push(k); ps += c; }
    const ins = [];
    for (const [id, p, from, to] of marks) {
      let s, len;
      if (Number.isInteger(from)) { s = Math.max(0, Math.min(from, ps.length)); len = Math.min(to, ps.length) - s; }
      else { // a passage with no place worked out: found by its words
        const want = p.replace(/\s+/g, " ").trim(); if (!want) continue;
        s = ps.indexOf(want); len = want.length;
        for (const cut of [60, 30, 15]) { if (s >= 0 || cut >= want.length) continue; s = ps.indexOf(want.slice(0, cut)); if (s >= 0) len = Math.min(want.length, ps.length - s); }
      }
      if (s < 0 || len <= 0) continue;
      ins.push([map[s], "\u0003" + id + "\u0005"], [map[s + len - 1] + 1, "\u0004"]);
    }
    ins.sort((a, b) => b[0] - a[0]);
    for (const [pos, str] of ins) raw = raw.slice(0, pos) + str + raw.slice(pos);
  }
  let out = "", depth = 0, mid = "";
  const open = () => `<mark data-note="${esc(mid)}" class="k-${esc((S.notes.get(mid) || {}).kind || "passage")}">`;
  for (let k = 0; k < raw.length; k++) {
    const c = raw[k];
    if (c === "\u0003") { const e = raw.indexOf("\u0005", k); const id = raw.slice(k + 1, e); k = e; if (!depth) { mid = id; out += open(); } depth++; }
    else if (c === "\u0004") { depth = Math.max(0, depth - 1); if (!depth) out += "</mark>"; }
    else if (c === I0) out += depth ? `</mark><em>${open()}` : "<em>";
    else if (c === I1) out += depth ? `</mark></em>${open()}` : "</em>";
    else out += esc(c);
  }
  return out;
}
// Your notes on a passage, shown under the paragraph where the passage starts (Aa → Your notes).
function marginHTML(marks, text) {
  if (!marks) return "";
  const ps = plain(text).replace(/\s+/g, " ");
  return marks.map(([id, p, from, to, first]) => {
    const n = S.notes.get(id); if (!n) return "";
    if (Number.isInteger(from)) { if (!first) return ""; }
    else { const want = String(p || "").replace(/\s+/g, " ").trim().slice(0, 15); if (want && ps.indexOf(want) < 0) return ""; }
    const body = n.gloss || (n.kind === "argument" && n.conclusion ? `∴ ${n.conclusion}` : "");
    if (!body && !n.original) return "";
    const clip = (x, k) => (x.length > k ? x.slice(0, k - 1) + "…" : x);
    const label = n.kind === "passage" || n.kind === "gloss" ? "Your note" : KINDS[n.kind] || "Note";
    return `<span class="mnote k-${esc(n.kind)}" data-note="${esc(id)}" role="button" tabindex="0"><span class="mk">${esc(label)}${n.resolved ? ", resolved" : ""}</span>${n.original ? `<span class="mo">${esc(clip(n.original, 200))}</span>` : ""}${body ? `<span class="mb">${esc(clip(body, 320))}</span>` : ""}</span>`;
  }).join("");
}
// Block i as the reader draws it; marks is every block's highlights (marksByBlock).
function blockHTML(b, i, marks) {
  if (b.k === "pg") return `<div class="bpg" data-i="${i}">${b.x ? esc(loc(b.x)) : ""}</div>`;
  const m = marks && marks.get(i), role = roleOf(b);
  if (isHidden(b)) return `<div class="bhid" data-i="${i}"></div>`;
  if (b.k === "front" && role !== "text") {
    const size = Math.max(0.78, Math.min(1.65, Number(b.size) || 1));
    const space = Math.max(0, Math.min(5, Number(b.space) || 0));
    return `<p class="bfront${b.heading ? " fronthead" : ""}${role === "title" ? " btitle" : ""}" data-i="${i}" style="font-size:${size}em;margin-top:${space}em">${inlineHTML(b.x || "", m)}${marginHTML(m, b.x || "")}</p>`;
  }
  if (b.sth) return paraHTML(i, inlineHTML(bodyOf(b), m), marginHTML(m, b.x || ""), m);
  if (isTitleLead(b)) { // a title broken over several lines is drawn as one
    let html = inlineHTML(b.x || "", m), notes = marginHTML(m, b.x || ""), prev = b.x;
    for (const k of titleTail(R.blocks, i)) { const mk = marks && marks.get(k), x = R.blocks[k].x || ""; html += `${glueAfter(prev)}<span class="bjoin" data-i="${k}">${inlineHTML(x, mk)}</span>`; notes += marginHTML(mk, x); prev = x; }
    return `<h2 class="bh l${titleLevel(b)}" data-i="${i}">${html}${notes}</h2>`;
  }
  const x = inlineHTML(b.x || "", m) + marginHTML(m, b.x || "");
  if (role === "title") return `<p class="btitle" data-i="${i}">${x}</p>`;
  if (role === "text") return `<p class="bp${b.k === "c" ? " cont" : ""}" data-i="${i}">${x}</p>`;
  if (b.k === "q" || role === "quote") return `<p class="bq" data-i="${i}">${x}</p>`;
  if (b.k === "fn") return `<p class="bfn" data-i="${i}">${x}</p>`;
  return `<p class="bp${b.k === "c" ? " cont" : ""}" data-i="${i}">${x}</p>`;
}
/* Where a highlight sits. A note made from a selection keeps an anchor: the block and character it starts at (a, ao), the
   block and character it ends at (b, bo, exclusive), and a few words either side (pre, suf). Characters are counted in the
   block's text without its italics markers. If the text there no longer reads as the passage (the paragraph was corrected,
   the passage edited), the passage is looked for nearby, the words either side settling between several matches. Older
   notes, kept with only a block and the passage, are placed the same way, so a passage running into the next paragraph is
   marked there too. A note that can't be placed is left unmarked and flagged in Your notes. */
const unspace = (x) => String(x || "").replace(/\s+/g, "");
const markable = (b) => b && b.k !== "pg" && !isHidden(b);
function quoteOf(B, A) {
  const out = [];
  for (let k = A.a; k <= A.b && k < B.length; k++) { if (!markable(B[k])) continue; const x = plain(B[k].x || ""); out.push(x.slice(k === A.a ? A.ao : 0, k === A.b ? A.bo : x.length)); }
  return out.join(" ");
}
function placeNote(n, B) {
  const want = unspace(n.passage), at = n.at, A = n.anchor;
  if (!want || !Number.isInteger(at) || at < 0 || at >= B.length) return null;
  if (A && Number.isInteger(A.a) && A.a === at && A.b >= A.a && A.b < B.length && unspace(quoteOf(B, A)) === want) return { a: A.a, ao: A.ao, b: A.b, bo: A.bo };
  // the text near the note's block, without spaces, each character remembering its block and place
  const lo = Math.max(0, at - 2), hi = Math.min(B.length - 1, at + 3 + Math.ceil(want.length / 400));
  let txt = ""; const blk = [], off = [];
  for (let k = lo; k <= hi; k++) { if (!markable(B[k])) continue; const x = plain(B[k].x || ""); for (let c = 0; c < x.length; c++) { const ch = x[c]; if (ch === " " || ch === "\n" || ch === "\t" || ch === " ") continue; txt += ch; blk.push(k); off.push(c); } }
  const pre = A ? unspace(A.pre).slice(-16) : "", suf = A ? unspace(A.suf).slice(0, 16) : "";
  const spot = (p, len) => ({ a: blk[p], ao: off[p], b: blk[p + len - 1], bo: off[p + len - 1] + 1 });
  let best = null, bestScore = -Infinity;
  for (let p = txt.indexOf(want); p >= 0; p = txt.indexOf(want, p + 1)) {
    let score = -1000 * Math.abs(blk[p] - at) - (A ? Math.abs(off[p] - A.ao) : 0);
    if (pre && txt.slice(Math.max(0, p - pre.length), p) === pre) score += 4000;
    if (suf && txt.slice(p + want.length, p + want.length + suf.length) === suf) score += 4000;
    if (score > bestScore) { bestScore = score; best = spot(p, want.length); }
  }
  if (best) return best;
  // only the start of the passage is still there: mark from it to the end of its paragraph, as before
  for (const cut of [60, 30, 15]) {
    if (cut >= want.length) continue;
    const p = txt.indexOf(want.slice(0, cut)); if (p < 0) continue;
    let e = p; while (e + 1 < txt.length && blk[e + 1] === blk[p] && e - p + 1 < want.length) e++;
    return spot(p, e - p + 1);
  }
  return null;
}
// Highlights by block: [note id, passage, from, to, first] (from and to in the block's characters; first: the passage starts here).
const PLACED = { B: null, m: new Map() };
function placed(id, n, B) {
  if (PLACED.B !== B) { PLACED.B = B; PLACED.m = new Map(); }
  const key = [n.at, n.passage, n.anchor ? [n.anchor.a, n.anchor.ao, n.anchor.b, n.anchor.bo].join(",") : ""].join("\u0006"), c = PLACED.m.get(id);
  if (c && c.key === key) return c.A;
  const A = placeNote(n, B); PLACED.m.set(id, { key, A }); return A;
}
function marksByBlock(tid) {
  const m = new Map(), B = R.tid === tid ? R.blocks : S.content.get(tid);
  const add = (k, e) => { if (!m.has(k)) m.set(k, []); m.get(k).push(e); };
  for (const [id, n] of S.notes) {
    if (n.textId !== tid || !Number.isInteger(n.at) || !n.passage) continue;
    const A = B && placed(id, n, B);
    if (!A) continue;
    for (let k = A.a; k <= A.b; k++) { if (!markable(B[k])) continue; add(k, [id, n.passage, k === A.a ? A.ao : 0, k === A.b ? A.bo : plain(B[k].x || "").length, k === A.a]); }
  }
  return m;
}
const sigOf = (l) => (l ? l.map(([id, p, f, t, first]) => { const n = S.notes.get(id) || {}; return [id, p, f, t, first ? 1 : 0, n.kind, n.gloss, n.conclusion, n.original, n.resolved ? 1 : 0].join("\u0006"); }).sort().join("|") : "");

function resetReader() {
  if (R.tid && R.blocks) SESS.set(R.tid, { visiting: R.visiting, home: R.home, trail: [...R.trail], landed: R.landed, landedAt: R.landedAt });
  if (R.flip) { cancelAnimationFrame(R.flip.raf); R.flip = null; for (const el of [$("#flip"), $("#undershade")]) el.classList.remove("on"); }
  const tw = $("#flipbook"); if (tw) { tw.innerHTML = ""; tw.dataset.key = ""; }
  $("#rnav").hidden = true; R.dragging = false; R.selCarry = null; drawCarry();
  R.visiting = false; R.home = null; R.trail = []; R.pagedSpot = null; R.win = null; FIND.on = false; FIND.hits = []; FIND.k = -1; paintFind(); R.termHits = null; R.termRanges = []; if (window.CSS && CSS.highlights) CSS.highlights.delete("term"); const tr = $("#rtrail"); if (tr) tr.hidden = true;
  R.sumPrev = null; R.tid = null; R.blocks = null; R.els = []; R.tops = []; R.sig = new Map(); R.saved = -1; R.sel = null; R.beat = 0; R.paceMs = 0; R.paceW = 0; $("#book").innerHTML = ""; $("#selbar").hidden = true; }

async function openReader(tid, at, opts) {
  if (S.screen === "reader" && R.blocks) { savePos(true); cloudSessionEnd(); } // from one book straight into another (a paired original)
  resetReader();
  S.screen = "reader"; S.textId = tid; render();
  window.scrollTo(0, 0);
  const t = S.texts.get(tid), book = $("#book");
  $("#rtitle").textContent = t?.title || ""; $("#rpg").textContent = "";
  applyFs();
  book.innerHTML = `<p class="rload">Loading the text…</p>`;
  let blocks;
  try { blocks = await loadContent(tid); }
  catch (e) { book.innerHTML = `<p class="rload">${esc(e instanceof UErr ? e.message : "Couldn't load this text. Check your connection and try again.")}</p>`; return; }
  if (S.screen !== "reader" || S.textId !== tid) return;
  if (!blocks) { book.innerHTML = `<p class="rload">This text isn't loaded yet. Go back and use Load file.</p>`; return; }
  R.tid = tid; R.blocks = blocks; wakeOn(); R.beat = Date.now(); R.paceMs = 0; R.paceW = 0;
  const lang = (t && t.lang) || guessLang(blocks); book.lang = lang; $("#flipbook").lang = lang;
  Object.assign(R, sectionIndex(blocks));
  const target = Number.isInteger(at) ? at : Number.isInteger(t?.pos) ? t.pos : 0;
  R.chunks = chunkStarts(blocks); R.turns = 0;
  renderBook(target);
  R.saved = Number.isInteger(t?.pos) ? t.pos : target; R.savedF = t?.posF || 0;
  const sess = opts && opts.resume ? SESS.get(tid) : null;
  if (sess) Object.assign(R, sess, { trail: [...sess.trail] });
  else if (Number.isInteger(at) && Number.isInteger(t?.pos) && t.pos > 0 && t.pos !== at) {
    // Opened at a passage from outside the reader: your place stays put, and is the first stop on the way back.
    Object.assign(R, { visiting: true, home: t.pos, trail: [{ i: t.pos, f: t.posF || 0 }], landed: at, landedAt: Date.now() });
  }
  if (opts && opts.find) findQ = opts.find;
  // Back from another screen: the exact spot. Continue reading: your saved spot. A passage: centred, so it can be seen.
  const place = () => (sess && opts.spot ? goToSpot(opts.spot) : Number.isInteger(at) ? goTo(target, true) : goToSpot({ i: target, f: t?.posF || 0 }));
  let placed = null;
  requestAnimationFrame(() => { layoutPages(); place(); placed = { spot: R.pagedSpot, y: window.scrollY }; R.landedY = readY(); updatePg(); drawTrail(); if (opts && opts.flash && Number.isInteger(at) && !sess) flash(at); });
  // continuing to read (not a jump, not coming back from another screen): the line you left yourself
  if (t && t.next && !Number.isInteger(at) && !sess) toast(`Next time: ${t.next}`, { label: "Done with it", run: () => { const now = S.texts.get(tid); if (!now) return; const rec = { ...now, updatedAt: Date.now() }; delete rec.next; put("texts", tid, rec).then(() => toast("Cleared.")).catch((e) => toast(failMsg(e))); } });
  // The book's fonts arriving change where the words fall. Not moved since opening (and soon after): place it again.
  // Moved (a page turned, a chapter chosen): stay on that spot, as after a change of screen size.
  const t0 = Date.now();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    R.dirty = true; if (R.tid !== tid || !placed) return;
    const still = isPaged() ? R.pagedSpot === placed.spot : Math.abs(window.scrollY - placed.y) < 2;
    if (still && Date.now() - t0 < 4000) place();
    else if (isPaged() && R.pagedSpot) { layoutPages(); goToSpot(R.pagedSpot); }
  });
}

function measure() { R.tops = R.els.map((e) => e.getBoundingClientRect().top + window.scrollY); R.dirty = false; }
function isPaged() { return RS.flow === "pages" && S.screen === "reader"; }
function pageStride() { return R.pageW || Math.max(1, $("#book").clientWidth); }
const currentPage = () => Math.round($("#book").scrollLeft / pageStride());
const lastPage = () => { const book = $("#book"); return Math.max(0, Math.round(book.scrollWidth / pageStride()) - 1); };
function setPage(p) { const book = $("#book"); book.scrollLeft = Math.max(0, Math.min(lastPage(), p)) * pageStride(); }
// The pages a paragraph occupies, first and last (a long paragraph runs over several). Null for an element with no box.
function screenPagesOf(i) {
  const el = R.els[i], rs = el ? el.getClientRects() : null;
  if (!rs || !rs.length) return null;
  const book = $("#book"), W = pageStride(), x0 = book.getBoundingClientRect().left - book.scrollLeft + 24;
  return [Math.max(0, Math.round((rs[0].left - x0) / W)), Math.max(0, Math.round((rs[rs.length - 1].left - x0) / W))];
}
const rectPage = (q) => { const book = $("#book"); return Math.max(0, Math.round((q.left - (book.getBoundingClientRect().left - book.scrollLeft + 24)) / pageStride())); };
// The page holding a spot: the line that far through the paragraph's text.
function spotPage(sp) {
  const el = R.els[sp.i], rs = el ? el.getClientRects() : [];
  if (!rs.length) return pageForBlock(sp.i);
  let total = 0; for (const q of rs) total += q.height;
  let at = (sp.f || 0) * total + 1, page = rectPage(rs[0]); // one pixel in, so a spot on the first line of a page finds that page
  for (const q of rs) { page = rectPage(q); if (at < q.height) break; at -= q.height; }
  return page;
}
function pageForBlock(i) { const p = screenPagesOf(Math.max(0, Math.min(i, R.els.length - 1))); return p ? p[0] : 0; }
// Where you are is the paragraph at the top of the page: the first one that is still running on this page.
// Paragraphs sit on pages in reading order, so it is found by halving: about 10 reads, whatever the length.
function pagedBlock() {
  const page = currentPage(), [a, b] = R.win || [0, R.els.length];
  const order = R.order || null, at = (k) => (order ? order[k] : a + k), len = order ? order.length : b - a;
  const lastOf = (k) => { for (let q = k; q < Math.min(len, k + 20); q++) { const p = screenPagesOf(at(q)); if (p) return p[1]; } return Infinity; };
  let lo = 0, hi = len - 1, ans = len - 1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (lastOf(mid) >= page) { ans = mid; hi = mid - 1; } else lo = mid + 1; }
  return at(Math.max(0, ans));
}
// Put the page back on its edge after anything moved it sideways (a selection running off the page, a rotation).
function snapPage() {
  if (!isPaged() || swipeStart) return;
  const sel = window.getSelection(); if (sel && !sel.isCollapsed) return;
  const book = $("#book"), W = pageStride(), p = Math.round(book.scrollLeft / W);
  if (Math.abs(book.scrollLeft - p * W) >= 1) book.scrollLeft = p * W;
}
const reducedMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
// One call, one page. The text jumps straight to the next page (so no half-scrolled columns are ever drawn),
// and the page box slides in a few pixels from the side the finger came from. Only transform and opacity animate.
// Moves the book one page, into the next or previous section when needed. False at either end of the book.
function stepPage(dir) {
  const cur = currentPage(), next = cur + dir, [a, b] = R.win;
  if (next >= 0 && next <= lastPage()) setPage(next);
  else if (dir > 0 && b < R.blocks.length) { renderBook(b); setPage(0); } // on into the next section
  else if (dir < 0 && a > 0) { renderBook(a - 1); setPage(lastPage()); } // back into the previous one
  else return false;
  R.turns = (R.turns || 0) + dir; pageSettled();
  return true;
}
function bounce(dir) { // first or last page of the book: a small give, then back
  const book = $("#book");
  if (!reducedMotion() && book.animate) book.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-dir * 14}px)` }, { transform: "translateX(0)" }], { duration: 220, easing: "ease-out" });
}
function turnPage(dir) {
  if (!isPaged() || !R.blocks) return;
  showBars(false);
  if (R.flip) doneFlip(R.flip.commit === true); // a turn still moving finishes at once, so quick turns each count
  const book = $("#book");
  if (R.turnAnim) { R.turnAnim.cancel(); R.turnAnim = null; }
  book.style.transform = "";
  if (flipMode()) { if (startFlip(dir)) settleFlip(true); else bounce(dir); return; }
  if (!stepPage(dir)) { bounce(dir); return; }
  if (RS.turn !== "none" && !reducedMotion() && book.animate) R.turnAnim = book.animate([{ transform: `translateX(${dir * 28}px)`, opacity: 0.5 }, { transform: "translateX(0)", opacity: 1 }], { duration: 200, easing: "cubic-bezier(.2,.8,.2,1)" });
}
/* ---------- page flip: the page swings over a spine on its left edge ---------- */
// Forward: the copy shows the page you were on and swings away to the left, while the book underneath is already on the next.
// Back: the copy shows the previous page and swings in from the left over the page you were on; the book follows once it lands.
const flipMode = () => isPaged() && RS.turn !== "slide" && RS.turn !== "none" && !reducedMotion();
function fillTwin(a) {
  const tw = $("#flipbook"), book = $("#book"), key = a + ":" + (R.ver || 0);
  tw.className = book.className; tw.style.cssText = book.style.cssText; tw.style.transform = "";
  if (tw.dataset.key !== key) {
    if (R.win && a === R.win[0]) tw.innerHTML = book.innerHTML;
    else {
      const [x, y] = chunkAt(a); tw.innerHTML = pagedHTML(x, y, marksByBlock(R.tid)).html;
      for (const j of chapterStarts(x, y)) { const el = tw.querySelector(`[data-i="${j}"]`); if (el) el.closest("#flipbook > *").classList.add("chap"); }
    }
    tw.dataset.key = key;
  }
  return tw;
}
function drawFlip(p) {
  if (!R.flip) return;
  R.flip.p = p;
  $("#flip").style.transform = `perspective(1700px) rotateY(${(-p * 100).toFixed(2)}deg)`;
  $("#flipshade").style.opacity = (p * 0.9).toFixed(3);
  $("#undershade").style.opacity = (Math.sin(Math.min(1, Math.max(0, p)) * Math.PI) * 0.85).toFixed(3);
}
function startFlip(dir) {
  if (R.flip) doneFlip(R.flip.commit === true);
  const book = $("#book"), [a, b] = R.win, cur = currentPage(), W = pageStride();
  let twinA = a, twinPage = cur;
  if (dir > 0) { if (cur >= lastPage() && b >= R.blocks.length) return false; }
  else if (cur > 0) twinPage = cur - 1;
  else if (a > 0) { twinA = chunkAt(a - 1)[0]; twinPage = -1; }
  else return false;
  const tw = fillTwin(twinA), r = book.getBoundingClientRect(), flip = $("#flip"), under = $("#undershade");
  for (const el of [flip, under]) Object.assign(el.style, { top: r.top + "px", width: r.width + "px", height: r.height + "px" });
  tw.scrollLeft = (twinPage < 0 ? Math.max(0, Math.round(tw.scrollWidth / W) - 1) : twinPage) * W;
  R.flip = { dir, p: dir > 0 ? 0 : 1, raf: 0 };
  if (dir > 0) stepPage(1);
  drawFlip(R.flip.p);
  flip.classList.add("on"); under.classList.add("on");
  return true;
}
// Carry the turn through (commit) or let the page fall back, from wherever the finger left it.
function settleFlip(commit) {
  const F = R.flip; if (!F) return;
  const to = (F.dir > 0) === commit ? 1 : 0, from = F.p, t0 = performance.now(), ms = 90 + 340 * Math.abs(to - from);
  F.commit = commit; cancelAnimationFrame(F.raf);
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  const step = (now) => {
    if (R.flip !== F) return;
    const k = Math.min(1, (now - t0) / ms); drawFlip(from + (to - from) * ease(k));
    if (k < 1) F.raf = requestAnimationFrame(step); else doneFlip(commit);
  };
  F.raf = requestAnimationFrame(step);
}
function doneFlip(commit) {
  const F = R.flip; if (!F) return;
  cancelAnimationFrame(F.raf); R.flip = null;
  if (F.dir > 0 && !commit) stepPage(-1); // fell back: the book returns to the page you were on
  if (F.dir < 0 && commit) stepPage(-1); // came over: the book moves to the previous page under it
  for (const el of [$("#flip"), $("#undershade")]) { el.classList.remove("on"); el.style.transform = ""; }
}
function pageSettled() { R.pagedSpot = currentSpot(); updatePg(); clearTimeout(posT); posT = setTimeout(settle, 600); }
// Scroll: the paragraph under the top of the screen. Paragraphs far off screen are left unlaid-out (content-visibility),
// so their measured positions are estimates; the one on screen is always real.
function scrollTopEl() {
  const book = $("#book"), r = book.getBoundingClientRect(), x = Math.max(1, Math.min(window.innerWidth - 2, r.left + r.width / 2)), y0 = barH() + 12;
  for (let dy = 0; dy < 300; dy += 10) {
    const el = document.elementFromPoint(x, y0 + dy), top = el && el.closest && el.closest("#book > [data-i]");
    if (top) return top;
  }
  return null;
}
function currentBlock() {
  if (!R.els.length) return 0;
  if (isPaged()) return pagedBlock();
  const el = !$("#reader").hidden && scrollTopEl(); if (el) return +el.dataset.i;
  if (R.dirty) measure();
  const y = window.scrollY + barH() + 12;
  let lo = 0, hi = R.tops.length - 1, ans = 0;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (R.tops[mid] <= y) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans;
}
function goTo(i, centre) {
  if (isPaged()) { i = Math.max(0, Math.min(i, R.blocks.length - 1)); ensureWindow(i); setPage(pageForBlock(i)); R.pagedSpot = { i, f: 0 }; updatePg(); return; }
  const el = R.els[Math.max(0, Math.min(i, R.els.length - 1))]; if (!el) return;
  const off = centre ? Math.max(barH() + 8, window.innerHeight * 0.3) : barH() + 8;
  scrollToEl(el, 0, off);
}
// A chapter read through to its end and the next one begun: ask for a few sentences on it, once a visit, when it has none.
// Reading through means the last place was within about a page of the chapter's end and this one just past it, so a jump
// from the middle of a chapter (Contents, the slider, Find) doesn't ask.
const SUM_ASKED = new Set();
function chapterEndCheck(i) {
  i = contentAt(i);
  const prev = R.sumPrev; R.sumPrev = i;
  if (RS.sum === "off" || prev == null || !R.chEnd || !R.cum || i <= prev) return;
  const x = R.secAt[prev]; if (!x || R.secAt[i] === x) return;
  const end = R.chEnd[prev];
  if (i < end || R.cum[end] - R.cum[prev] > 3000 || R.cum[i] - R.cum[end] > 3000) return;
  const tid = R.tid, t = S.texts.get(tid), sec = t && (t.sections || []).find((s) => s.id === x);
  if (!sec || (t.summaries || {})[x] || SUM_ASKED.has(`${tid} ${x}`)) return;
  SUM_ASKED.add(`${tid} ${x}`);
  toast(`End of “${sec.label}”. Sum it up in a few sentences?`, [{ label: "Write it", run: () => summarySheet(tid, x) },
    { label: "Don't ask", run: () => { RS.sum = "off"; saveRS(); toast("You won't be asked. Reading settings can turn it back on."); } }]);
}
function updatePg() {
  const i = currentBlock(), p = R.pageAt[i], left = immersive() ? pagesLeft(i) : "";
  chapterEndCheck(i);
  const other = p ? concLabel(S.texts.get(R.tid), p) : "";
  $("#rpg").textContent = p ? loc(p) : ""; $("#rfoot").textContent = [p ? loc(p) : "", other, left].filter(Boolean).join("  ·  ");
  updateMarkBtn(); if (!$("#rnav").hidden) syncNav();
}
// Swipe pages: how many screen pages are left in this chapter. Exact while the chapter ends in the section laid out;
// beyond it, estimated from how much text this section fits on a page.
// The first block at i that is text: a page marker or hidden running head just before a chapter title belongs to the page
// the chapter starts on, though it counts as the end of the chapter before.
const contentAt = (i) => { const B = R.blocks; while (i < B.length - 1 && betweenPages(B[i])) i++; return i; };
function pagesLeft(i) {
  i = contentAt(i);
  if (!R.chEnd || !R.win || !R.secAt[i]) return "";
  const end = R.chEnd[i], cur = currentPage(), last = lastPage(), [a, b] = R.win;
  let left;
  if (end <= b) { let k = end - 1; while (k > i && !screenPagesOf(k)) k--; const pp = screenPagesOf(k); left = (pp ? pp[1] : last) - cur; }
  else { const perPage = (R.cum[b] - R.cum[a]) / (last + 1 || 1); left = last - cur + Math.round((R.cum[end] - R.cum[b]) / (perPage || 1)); }
  return left <= 0 ? "last page of the chapter" : `${left} page${left === 1 ? "" : "s"} left in the chapter`;
}
// A spot is a paragraph and how far down it the top of the screen sits (0 to 1), so a long paragraph comes back at the same line.
function currentSpot() {
  if (isPaged()) { // the paragraph at the top of the page, and how much of its text lies on earlier pages
    const i = currentBlock(), el = R.els[i], rs = el ? el.getClientRects() : [], page = currentPage();
    let before = 0, total = 0;
    for (const q of rs) { total += q.height; if (rectPage(q) < page) before += q.height; }
    return { i, f: total ? Math.max(0, Math.min(0.999, Math.round((before / total) * 10000) / 10000)) : 0 };
  }
  const i = currentBlock(), el = R.els[i]; if (!el) return { i, f: 0 };
  const y = barH() + 12, h = el.offsetHeight || 1, top = el.getBoundingClientRect().top;
  return { i, f: Math.max(0, Math.min(0.999, Math.round(((y - top) / h) * 10000) / 10000)) };
}
function goToSpot(sp) {
  if (isPaged()) {
    const i = Math.max(0, Math.min(sp.i, R.els.length - 1)); ensureWindow(i);
    setPage(spotPage({ i, f: sp.f || 0 })); R.pagedSpot = { i, f: sp.f || 0 }; updatePg(); return;
  }
  const el = R.els[Math.max(0, Math.min(sp.i, R.els.length - 1))]; if (!el) return;
  scrollToEl(el, sp.f || 0, barH() + 12);
}
// Scroll so that the point f of the way down el sits off pixels below the top of the screen. The paragraphs around it are
// laid out as they come on screen and may turn out taller or shorter than estimated, so the aim is checked again once.
function scrollToEl(el, f, off) {
  const top = el.closest("#book > *") || el;
  top.style.contentVisibility = "visible"; // its own height must be real for f
  const go = () => window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY + f * el.offsetHeight - off));
  go(); requestAnimationFrame(() => { go(); top.style.contentVisibility = ""; });
}
/* ---------- reading pace: time in the reader and words read on, by day, kept on the book as t.days = { "2026-10-19": [seconds, words] } ----------
   Time counts between one turn or scroll and the next, a pause longer than PACE_GAP as PACE_GAP (the phone left lying open isn't reading),
   and stops while the app is hidden. Words count when your place moves on by up to PACE_JUMP words at once; jumps and visits don't count.
   PACE holds each book's days for this run of the app, so writes that overlap never lose time; a restore clears it. */
const PACE_GAP = 120000, PACE_JUMP = 3000, PACE = new Map();
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const paceDays = (tid) => { if (!PACE.has(tid)) PACE.set(tid, { ...((S.texts.get(tid) || {}).days || {}) }); return PACE.get(tid); };
function wordCum(B) { const c = [0]; for (let i = 0; i < B.length; i++) c.push(c[i] + (B[i].k === "pg" || isHidden(B[i]) ? 0 : (plain(B[i].x || "").match(/\S+/g) || []).length)); return c; }
function paceTick() {
  const now = Date.now();
  if (R.beat) R.paceMs = (R.paceMs || 0) + Math.min(Math.max(0, now - R.beat), PACE_GAP);
  R.beat = document.visibilityState === "hidden" ? 0 : now;
}
function paceRead(from, to) {
  if (!(from >= 0 && to > from)) return;
  if (R.wcFor !== R.blocks) { R.wc = wordCum(R.blocks); R.wcFor = R.blocks; }
  const w = R.wc[to] - R.wc[from]; if (w > 0 && w <= PACE_JUMP) R.paceW = (R.paceW || 0) + w;
}
function withPace(rec) {
  const s = Math.floor((R.paceMs || 0) / 1000), w = R.paceW || 0;
  if (!s && !w) return rec;
  R.paceMs -= s * 1000; R.paceW = 0;
  const days = paceDays(R.tid), k = dayKey(), d = days[k] || [0, 0];
  days[k] = [d[0] + s, d[1] + w];
  const keys = Object.keys(days); if (keys.length > DAYS_MAX) keys.sort().slice(0, keys.length - DAYS_MAX).forEach((x) => delete days[x]);
  return { ...rec, days: { ...days } };
}
// force: leaving the reader or hiding the app, when time read since the last move is written even if your place hasn't moved.
function savePos(force) {
  if (!R.blocks || !R.tid) return;
  paceTick();
  const t = S.texts.get(R.tid);
  const flush = () => { if (t && force && ((R.paceMs || 0) >= 1000 || R.paceW)) put("texts", R.tid, withPace(R.saved >= 0 ? { ...t, pos: R.saved, posF: R.savedF || 0 } : { ...t })).catch(() => {}); };
  if (R.visiting) return flush();
  const atEnd = isPaged() ? R.win[1] >= R.blocks.length && currentPage() >= lastPage() : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
  const sp = atEnd ? { i: R.blocks.length - 1, f: 0 } : currentSpot();
  if (sp.i === R.saved && Math.abs(sp.f - (R.savedF || 0)) < 0.005) return flush();
  paceRead(R.saved, sp.i);
  R.saved = sp.i; R.savedF = sp.f;
  if (t) put("texts", R.tid, withPace({ ...t, pos: sp.i, posF: sp.f, total: R.blocks.length, readAt: Date.now() })).catch(() => {});
}
/* jumps and the way back */
const pgLabel = (i) => (R.pageAt[i] ? loc(R.pageAt[i]).replace(/^(pp?\.) /, "$1\u00a0") : ""); // "p. 45" stays on one line
// How far through the book the screen is, in pixels of scroll; in swipe pages each page counts as a screen.
const readY = () => (isPaged() ? (R.turns || 0) * window.innerHeight : window.scrollY);
function landed(i) { R.landed = i; R.landedAt = Date.now(); requestAnimationFrame(() => { R.landedY = readY(); updatePg(); }); }
function jumpTo(i, centre = true, quiet = false) {
  if (!R.blocks) return;
  i = Math.max(0, Math.min(i, R.blocks.length - 1));
  const here = currentSpot(), last = R.trail[R.trail.length - 1];
  if (!R.visiting) { savePos(); R.visiting = true; R.home = R.saved >= 0 ? R.saved : here.i; }
  const same = last && last.i === here.i && Math.abs(last.f - here.f) < 0.05;
  if (here.i !== i && !same) { R.trail.push(here); if (R.trail.length > 30) R.trail.splice(1, 1); } // the first stop, your place, always stays
  goTo(i, centre); landed(i); if (!quiet) flash(i); drawTrail();
}
function trailBack() {
  if (!R.trail.length) return;
  const sp = R.trail.pop();
  goToSpot(sp); landed(sp.i); // the view comes back as it was, down to the line
  if (!R.trail.length && sp.i === R.home) { R.visiting = false; R.home = null; R.saved = sp.i; R.savedF = sp.f; } // back at your place: reading again
  drawTrail();
}
function readFromHere(auto) {
  const t = S.texts.get(R.tid), before = { home: R.home, trail: [...R.trail], pos: t && t.pos, posF: t && t.posF };
  R.visiting = false; R.home = null; R.trail = []; R.saved = -1;
  savePos(); drawTrail();
  const pg = pgLabel(currentBlock());
  toast(auto ? `You've read on from here, so your place is now ${pg || "here"}.` : `Your place is now ${pg || "here"}.`, Number.isInteger(before.pos) ? { label: "Undo", run: () => undoPlace(before) } : null);
}
// Puts your place back where it was and resumes the visit, trail and all.
function undoPlace(b) {
  const t = S.texts.get(R.tid); if (!t || !R.blocks || R.tid !== S.textId) return;
  Object.assign(R, { visiting: true, home: b.home ?? b.pos, trail: b.trail.length ? b.trail : [{ i: b.pos, f: b.posF || 0 }], saved: b.pos, savedF: b.posF || 0, landedAt: Date.now(), landedY: readY() });
  put("texts", R.tid, { ...t, pos: b.pos, posF: b.posF || 0 }).catch(() => {});
  drawTrail(); toast(`Your place is back at ${pgLabel(b.pos) || "where it was"}.`);
}
// While looking around, reading on well past where you landed, for a while, makes it your place.
function settle() {
  if (!R.visiting) { savePos(); return; }
  paceTick();
  if (Date.now() - R.landedAt >= 120000 && readY() - R.landedY >= 3 * window.innerHeight) readFromHere(true);
}
function drawTrail() {
  drawPin();
  const bar = $("#rtrail"); if (!bar) return;
  const show = S.screen === "reader" && !!R.blocks && (R.visiting || FIND.on) && $("#selbar").hidden;
  bar.hidden = !show; if (!show) return;
  const top = R.trail[R.trail.length - 1], pg = top ? pgLabel(top.i) : "";
  const home = R.trail.length === 1 && top.i === R.home;
  const find = FIND.on ? `<div class="findbar" role="group" aria-label="Find"><button class="btn" id="fprev" aria-label="Previous match">‹</button><span class="fcount">“${esc(FIND.q.trim().slice(0, 24))}” ${FIND.k + 1} of ${FIND.hits.length}</span><button class="btn" id="fnext" aria-label="Next match">›</button><button class="btn" id="fclose" aria-label="Stop finding">×</button></div>` : "";
  bar.innerHTML = find + (R.visiting ? `${R.trail.length ? `<button class="btn" id="rtback">← ${home ? `Your place${pg ? `, ${pg}` : ""}` : `Back${pg ? ` to ${pg}` : ""}`}</button>` : ""}<button class="btn" id="rthere">Read from here</button>` : "");
}
function setRS(change) {
  // In pages, the spot is kept from the last turn or jump: re-cutting the pages must not move it, however often the settings change.
  const sp = isPaged() && R.pagedSpot && R.blocks ? R.pagedSpot : currentSpot(), flow = RS.flow;
  Object.assign(RS, change); RS.fs = Math.max(14, Math.min(28, RS.fs)); applyFs(); saveRS(); R.dirty = true;
  if (RS.flow !== flow && R.blocks) { renderBook(sp.i); window.scrollTo(0, 0); }
  goToSpot(sp);
}
function readerSettings() {
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, label]) => `<button class="segb${RS[key] === v ? " on" : ""}" data-keep="1" data-rs="${key}" data-v="${v}">${label}</button>`).join("")}</div>`;
  openPanel(`<h2>Reading settings</h2>
    <div class="rs">
      <div class="rs-row"><span>Type size</span><div class="seg"><button class="segb" data-keep="1" data-rs="fs" data-v="-1" aria-label="Smaller type">A−</button><span class="rs-fs" id="rs-fs">${RS.fs}</span><button class="segb" data-keep="1" data-rs="fs" data-v="1" aria-label="Larger type">A+</button></div></div>
      <div class="rs-row"><span>Navigation</span>${seg("flow", [["scroll", "Scroll"], ["pages", "Swipe pages"]])}</div>
      <div class="rs-row"><span>Page turn</span>${seg("turn", [["flip", "Flip"], ["slide", "Slide"], ["none", "None"]])}</div>
      <div class="rs-row"><span>Text in pages</span>${seg("align", [["justify", "Justified"], ["left", "Ragged right"]])}</div>
      <div class="rs-row"><span>Toolbar in pages</span>${seg("bars", [["hide", "Tap to show"], ["show", "Always shown"]])}</div>
      <div class="rs-row"><span>Line spacing</span>${seg("lh", [["compact", "Compact"], ["normal", "Normal"], ["airy", "Airy"]])}</div>
      <div class="rs-row"><span>Text width</span>${seg("w", [["narrow", "Narrow"], ["medium", "Medium"], ["wide", "Wide"]])}</div>
      <div class="rs-row"><span>Page</span>${seg("tone", [["app", "Like the app"], ["paper", "Paper"], ["sepia", "Sepia"], ["night", "Night"]])}</div>
      <div class="rs-row"><span>Your notes</span>${seg("mn", [["show", "Show in the text"], ["hide", "Hide"]])}</div>
      <div class="rs-row"><span>Screen</span>${seg("awake", [["on", "Stays on while reading"], ["off", "Phone's setting"]])}</div>
      <div class="rs-row"><span>A chapter's end</span>${seg("sum", [["ask", "Ask for a summary"], ["off", "Don't ask"]])}</div>
      ${R.tid ? `<div class="rs-row"><span>Glossary terms in this book</span><div class="seg">${[["on", "Linked"], ["off", "Off"]].map(([v, label]) => `<button class="segb${(termsOn(R.tid) ? "on" : "off") === v ? " on" : ""}" data-keep="1" data-terms="${v}">${label}</button>`).join("")}</div></div>` : ""}
    </div>`, (b) => {
    if (b.dataset.terms) { setTermsOn(R.tid, b.dataset.terms === "on"); $("#sheetroot").querySelectorAll("[data-terms]").forEach((x) => x.classList.toggle("on", x === b)); return; }
    if (!b.dataset.rs) return;
    if (b.dataset.rs === "fs") setRS({ fs: RS.fs + +b.dataset.v });
    else setRS({ [b.dataset.rs]: b.dataset.v });
    if (b.dataset.rs === "awake") { if (RS.awake === "on") wakeOn(); else wakeOff(); }
    const root = $("#sheetroot");
    root.querySelectorAll(`[data-rs="${b.dataset.rs}"]`).forEach((x) => x.classList.toggle("on", b.dataset.rs !== "fs" && x.dataset.v === RS[b.dataset.rs]));
    const f = $("#rs-fs", root); if (f) f.textContent = RS.fs;
  });
}

/* bookmarks: a page you want to find again, without a note */
const bookmarksOf = (t) => (t && Array.isArray(t.bookmarks) ? t.bookmarks : []);
function bookmarkHere() {
  const i = currentBlock(), page = R.pageAt[i] || "";
  return bookmarksOf(S.texts.get(R.tid)).find((bm) => (page && bm.page === page) || Math.abs(bm.at - i) <= 2);
}
async function toggleBookmark() {
  const t = S.texts.get(R.tid); if (!t || !R.blocks) return;
  const i = currentBlock(), page = R.pageAt[i] || "", here = bookmarkHere();
  const list = here ? bookmarksOf(t).filter((bm) => bm !== here) : [...bookmarksOf(t), { at: i, page, createdAt: Date.now() }].sort((a, b) => a.at - b.at);
  try { await put("texts", R.tid, { ...t, bookmarks: list, updatedAt: Date.now() }); toast(here ? "Bookmark removed." : `Bookmarked${page ? " " + loc(page) : ""}.`); } catch (e) { toast(failMsg(e)); }
  updateMarkBtn();
}
function updateMarkBtn() { const btn = $("#rmark"); if (btn) btn.setAttribute("aria-pressed", bookmarkHere() ? "true" : "false"); }

/* the printed page: the PDF a book was made from, kept on this device (store "files", never backed up), shown a page at a
   time. A text's pdfLabels are its PDF pages' labels as the import read them, so a printed page number finds its PDF page. */
const mb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(n >= 10485760 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const PDFV = { tid: null, doc: null, stop: null };
function closePdf() { try { if (PDFV.doc) PDFV.doc.destroy(); } catch {} try { if (PDFV.stop) PDFV.stop(); } catch {} Object.assign(PDFV, { tid: null, doc: null, stop: null }); }
async function keepPdf(tid, file) {
  if (!idb) throw new UErr("This browser isn't letting the app save, so the PDF can't be kept.");
  await idbDo("files", (st) => st.put(file, tid)); if (PDFV.tid === tid) closePdf();
}
async function dropPdf(tid) { if (idb) await idbDo("files", (st) => st.delete(tid)); if (PDFV.tid === tid) closePdf(); }
async function pdfDoc(tid) {
  if (PDFV.tid === tid && PDFV.doc) return PDFV.doc;
  const file = idb ? await idbGet("files", tid) : null; if (!file) return null;
  await need("pdf", () => !!window.pdfjsLib); const lib = window.pdfjsLib;
  let wk = null, pw = null;
  try { wk = new Worker(URL.createObjectURL(new Blob([`importScripts(${JSON.stringify(LIBS.pdfw[0])});`], { type: "text/javascript" }))); pw = lib.PDFWorker.fromPort({ port: wk }); } catch { wk = null; pw = null; }
  if (!pw) { try { await need("pdfw", () => !!window.pdfjsWorker); } catch {} try { lib.GlobalWorkerOptions.workerSrc = LIBS.pdfw[0]; } catch {} }
  const stop = () => { try { if (pw) pw.destroy(); } catch {} try { if (wk) wk.terminate(); } catch {} };
  let doc;
  try { doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, ...(pw ? { worker: pw } : {}) }).promise; }
  catch (e) { stop(); throw e; }
  closePdf(); Object.assign(PDFV, { tid, doc, stop });
  return doc;
}
// The PDF page (from 0) holding block i: the page with its printed number, the nearest one to where it falls in order.
function pdfPageFor(t, i) {
  const labels = t.pdfLabels || [], B = R.blocks; let ord = -1;
  for (let k = 0; k <= i && k < B.length; k++) if (B[k].k === "pg") ord++;
  const lab = R.pageAt[i] || "", hits = [];
  if (lab) labels.forEach((l, p) => { if (l === lab) hits.push(p); });
  if (hits.length) return hits.reduce((a, p) => (Math.abs(p - ord) < Math.abs(a - ord) ? p : a));
  return Math.max(0, Math.min(Math.max(0, labels.length - 1), ord));
}
async function drawPdfPage(canvas, doc, p, width) {
  const page = await doc.getPage(p + 1), v1 = page.getViewport({ scale: 1 }), dpr = Math.min(3, window.devicePixelRatio || 1);
  const vp = page.getViewport({ scale: (width / v1.width) * dpr });
  canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
  canvas.style.width = `${width}px`; canvas.style.height = `${Math.floor(vp.height / dpr)}px`;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
}
// Draws the PDF page for block i into box; returns false when the PDF isn't kept.
async function printedInto(box, tid, i, opts = {}) {
  const t = S.texts.get(tid); if (!t) return false;
  box.innerHTML = `<p class="hint">Opening the PDF…</p>`;
  let doc; try { doc = await pdfDoc(tid); } catch { box.innerHTML = `<p class="hint bad">Couldn't open the kept PDF.</p>`; return true; }
  if (!doc) { box.innerHTML = `<p class="hint">The PDF isn't kept on this device. <button type="button" class="linkbtn" data-keep="1" id="pp-keep">Keep the original PDF</button></p>`; return false; }
  const p = Math.max(0, Math.min(doc.numPages - 1, opts.page ?? pdfPageFor(t, i)));
  const where = `${t.pdfLabels && t.pdfLabels[p] ? loc(t.pdfLabels[p]) + " · " : ""}page ${p + 1} of ${doc.numPages} in the PDF`;
  box.innerHTML = `<p class="hint ppwhere">${esc(where)}</p><div class="ppwrap"><canvas></canvas></div>`;
  const w = Math.max(200, Math.floor(box.clientWidth || 360) * (opts.zoom || 1));
  await drawPdfPage($("canvas", box), doc, p, w);
  box.dataset.page = p;
  return true;
}
function printedPagePanel(i = currentBlock()) {
  const tid = R.tid; if (!tid) return;
  let page = null, zoom = 1;
  openPanel(`<h2>Printed page</h2><div id="ppbox" class="ppbox"></div>
    <div class="ppbar"><button class="btn" data-keep="1" id="pp-prev" aria-label="Previous page">‹</button><button class="btn" data-keep="1" id="pp-zoom">Zoom in</button><button class="btn" data-keep="1" id="pp-next" aria-label="Next page">›</button></div>`,
  (b) => {
    const box = $("#ppbox"); if (!box) return;
    if (b.id === "pp-keep") { closeOverlay().then(() => keepPdfSheet(tid)); return; }
    const cur = +box.dataset.page || 0;
    if (b.id === "pp-prev") page = Math.max(0, cur - 1); else if (b.id === "pp-next") page = cur + 1; else if (b.id === "pp-zoom") { zoom = zoom === 1 ? 2 : 1; b.textContent = zoom === 1 ? "Zoom in" : "Fit the screen"; page = cur; } else return;
    printedInto(box, tid, i, { page, zoom });
  });
  printedInto($("#ppbox"), tid, i);
}
// Keep the PDF of a book already in the library: it is read once more so its pages can be matched to the book's.
function keepPdfSheet(tid) {
  const t = S.texts.get(tid); if (!t) return;
  let parsed = null;
  openSheet(`<h2>${t.pdfLabels ? "The kept PDF" : "Keep the original PDF"}</h2><p class="sub">${esc(t.title)}</p>
    <p class="hint">${t.pdfLabels ? "This book's PDF is kept on this device, for its printed pages. Choose another to replace it, or remove it." : "Choose the PDF this book was made from. It's read once more to match its pages to the book's, then kept on this device. Backups don't include it."}</p>
    <div class="field"><div class="drop" id="k-drop"><input id="k-file" type="file" accept="application/pdf,.pdf"><span class="drop-main" id="k-name">Tap to choose the PDF</span></div><p class="hint" id="k-prog"></p></div>
    ${t.pdfLabels ? `<button type="button" class="linkbtn" id="k-drop-pdf">Remove the kept PDF</button>` : ""}`,
  async () => {
    if (!parsed) return "Choose the PDF first.";
    const blocks = await loadContent(tid), have = (blocks || []).filter((b) => b.k === "pg").map((b) => b.x), got = parsed.blocks.filter((b) => b.k === "pg").map((b) => b.x);
    let same = 0; for (let k = 0; k < Math.min(have.length, got.length); k++) if (have[k] === got[k]) same++;
    // and its text: of up to 60 paragraphs across the book, most are found in the PDF read again
    const key = (b) => norm(b.x || "").slice(0, 40), words = new Set(parsed.blocks.filter((b) => b.k !== "pg").map(key));
    const mine = (blocks || []).filter((b) => b.k !== "pg" && norm(b.x || "").length >= 12), step = Math.max(1, Math.floor(mine.length / 60));
    let found = 0, tried = 0; for (let k = 0; k < mine.length; k += step) { tried++; if (words.has(key(mine[k]))) found++; }
    if ((have.length && same < Math.max(have.length, got.length) * 0.6) || (tried && found < tried * 0.5)) return "This PDF doesn't match this book. Choose the file the book was made from.";
    await keepPdf(tid, parsed.file);
    await put("texts", tid, { ...S.texts.get(tid), pdfLabels: parsed.labels, updatedAt: Date.now() });
    return () => toast(`PDF kept (${mb(parsed.file.size)}).`);
  },
  (root) => {
    const inp = $("#k-file", root), prog = $("#k-prog", root);
    inp.addEventListener("change", async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      $("#k-name", root).textContent = f.name; parsed = null;
      try { const r = await parseFile(f, (m) => { prog.textContent = m; }); if (r.kind !== "PDF") throw new UErr("Choose a PDF."); parsed = r; prog.textContent = `Ready: ${r.labels.length} pages, ${mb(f.size)}.`; }
      catch (e) { prog.textContent = e instanceof UErr ? e.message : "Couldn't read this PDF."; }
    });
    const rm = $("#k-drop-pdf", root);
    if (rm) rm.addEventListener("click", async () => { try { await dropPdf(tid); const cur = { ...S.texts.get(tid), updatedAt: Date.now() }; delete cur.pdfLabels; await put("texts", tid, cur); await closeOverlay(); toast("The kept PDF was removed."); } catch (e) { toast(failMsg(e)); } });
  });
}

/* notes to the text: a tapped note number shows its note. Footnotes are found near the number; endnotes at the back of the
   book, in the run of numbered notes that belongs to this chapter. */
const NOTE_START = /^\s*(?:(\d{1,3})(?:[.)]\s*|\s+)|([⁰¹²³⁴⁵⁶⁷⁸⁹]{1,3})\s*)(?=\S)/u;
const supNum = (m) => +[...m].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join("");
function noteRuns() {
  if (R.noteRuns && R.noteRunsOf === R.blocks) return R.noteRuns;
  const B = R.blocks, starts = [], runs = [];
  B.forEach((b, k) => {
    if (b.k === "pg" || b.k === "h" || b.k === "front" || isHidden(b) || isTitleRole(roleOf(b)) || b.stj) return;
    const m = NOTE_START.exec(plain(b.x || "")); if (!m) return;
    starts.push({ k, n: m[1] ? +m[1] : supNum(m[2]), fn: b.k === "fn" });
  });
  // endnotes: numbered paragraphs counting up from 1, a run for each chapter
  let run = null;
  for (const st of starts) {
    if (st.fn) continue;
    if (st.n === 1) { run = { at: st.k, notes: new Map([[1, st.k]]) }; runs.push(run); }
    else if (run && st.n > Math.max(...run.notes.keys()) && st.n <= Math.max(...run.notes.keys()) + 3) run.notes.set(st.n, st.k);
  }
  R.noteRuns = { starts, runs: runs.filter((r) => r.notes.size >= 2) }; R.noteRunsOf = B;
  return R.noteRuns;
}
// The note numbered n for a reference in block i: [best block, other candidates].
function findNote(i, n) {
  const B = R.blocks, { starts, runs } = noteRuns(), sup = /[⁰¹²³⁴⁵⁶⁷⁸⁹]/;
  const all = starts.filter((st) => st.n === n).map((st) => st.k);
  // a footnote: on this printed page or the next, just after the reference
  let pgs = 0;
  for (let k = i + 1; k < B.length && pgs < 3; k++) { if (B[k].k === "pg") pgs++; if (B[k].k === "fn" && all.includes(k)) return [k, all]; }
  for (let k = i - 1; k >= Math.max(0, i - 12); k--) if (B[k].k === "fn" && all.includes(k)) return [k, all];
  // an endnote: the chapters whose text has note numbers, in order, and the runs of notes after the text
  // (a chapter with footnotes keeps its notes on its own pages, so it isn't one of them)
  const withFn = new Set(); B.forEach((b, k) => { if (b.k === "fn") withFn.add(R.secAt[k] || ""); });
  const chapters = []; let lastRef = 0;
  B.forEach((b, k) => { const c = R.secAt[k] || ""; if (b.k !== "fn" && !withFn.has(c) && sup.test(b.x || "")) { if (chapters[chapters.length - 1] !== c) chapters.push(c); lastRef = k; } });
  const after = runs.filter((r) => r.at > i && r.notes.has(n));
  if (!after.length) return [all.find((k) => k > i) ?? all[0] ?? -1, all];
  // a run under a heading naming this chapter
  const names = new Map((S.texts.get(R.tid)?.sections || []).map((x) => [x.id, x.label])), label = norm(names.get(R.secAt[i]) || "");
  if (label.length >= 4) for (const r of after) for (let k = r.at - 1; k >= Math.max(0, r.at - 4); k--) { const t = norm(B[k].x || ""); if (t && (t.includes(label) || (t.length >= 4 && label.includes(t)))) return [r.notes.get(n), all]; }
  // a run under a heading numbering it ("Chapter 2", "2.", "II") as this chapter's place among chapters with notes
  const tail = runs.filter((r) => r.at > lastRef), m = chapters.indexOf(R.secAt[i] || "");
  const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15 };
  if (m >= 0) for (const r of after) for (let k = r.at - 1; k >= Math.max(0, r.at - 3); k--) {
    if (B[k].k === "pg") continue;
    if (!isTitleRole(roleOf(B[k]))) break; // only a heading names a run of notes
    const h = /^\s*(?:chapter|part|ch\.)?\s*(\d{1,2}|[ivx]{1,4})\b/i.exec(plain(B[k].x || "")); if (!h) break;
    if ((/\d/.test(h[1]) ? +h[1] : ROMAN[h[1].toLowerCase()]) === m + 1) return [r.notes.get(n), all];
    break;
  }
  // otherwise the same place in order: the chapter's place among chapters with notes, among the runs after the text
  if (tail.length === chapters.length && m >= 0 && tail[m].notes.has(n)) return [tail[m].notes.get(n), all];
  return [after[0].notes.get(n), all];
}
function notePanel(i, n) {
  if (!R.blocks) return;
  const B = R.blocks, [k, all] = findNote(i, n);
  const textAt = (j) => { let x = plain(B[j].x || ""); for (let q = j + 1; q < B.length && q < j + 4 && (B[q].k === "c" || (B[q].k === "pg" && B[q + 1] && B[q + 1].k === "c")); q++) if (B[q].k === "c") x += glueAfter(x) + plain(B[q].x || ""); return x; };
  const others = all.filter((j) => j !== k);
  openPanel(`<h2>Note ${n}</h2>
    ${k >= 0 ? `<p class="notetext">${fnRefs(esc(textAt(k)))}</p><p class="hint">${R.pageAt[k] ? esc(loc(R.pageAt[k])) : ""}${B[k].k === "fn" ? " · a footnote" : " · from the notes at the back"}</p>
      <div class="lk-acts"><button class="btn" data-goto="${k}">Go to the note</button></div>`
      : `<p class="hint">No note numbered ${n} was found in this book's text.</p>`}
    ${others.length ? `<details class="optfield"><summary>Not this one? ${others.length} other note${others.length === 1 ? "" : "s"} numbered ${n}</summary><div class="toc">${others.slice(0, 30).map((j) => `<button class="tocitem" data-goto="${j}"><span>${esc(textAt(j).slice(0, 110))}${textAt(j).length > 110 ? "…" : ""}</span><span class="tp">${R.pageAt[j] ? esc(loc(R.pageAt[j])) : ""}</span></button>`).join("")}</div></details>` : ""}`,
  (b) => { if (b.dataset.goto) jumpTo(+b.dataset.goto, true); });
}

/* find in this book: matches marked in the text and stepped through one at a time */
/* ---------- Glossary terms in the text (Reading settings → Glossary terms in this book, or a book's More menu; your own links from Look up) ----------
   In a book that has it on, each paragraph's first mention of a glossary term whose name is more than one word (Body
   without organs, Will to power, Desiring-production) is underlined through the CSS Highlight API, so the page's text and
   markup stay exactly as they are and highlights, selections and pages are untouched. A tap on one opens the term's
   definition; Open in the glossary leaves the reader, and Back returns to your place. Matching ignores accents and
   capitals, takes whole words (a plural counts), and runs across a paragraph's printed-page breaks, as Find does; a name
   two entries share links to neither. Which books have it on is kept in localStorage (mg-terms), outside the library. */
const TERMS_KEY = "mg-terms";
const termsList = () => { try { const l = JSON.parse(localStorage.getItem(TERMS_KEY) || "[]"); return Array.isArray(l) ? l : []; } catch { return []; } };
const termsOn = (tid) => !!tid && termsList().includes(tid);
function setTermsOn(tid, on) {
  const l = new Set(termsList()); if (on) l.add(tid); else l.delete(tid);
  try { localStorage.setItem(TERMS_KEY, JSON.stringify([...l])); } catch {}
  if (R.tid === tid) { R.termHits = null; paintTerms(); }
}
// The names the reader links: each term's own names (termNeedles), longest first. A one-word name (Genealogy, Conatus) links once
// a chapter, so a word the book uses throughout isn't underlined in every paragraph; a few that are also everyday words in another
// sense (READER_SKIP) never link by themselves.
const READER_SKIP = new Set(["accident", "aura", "expenditure", "abduction", "mode", "field", "sense", "reference", "understanding"]);
function readerTermNames() {
  const out = [];
  for (const g of allTerms()) for (const nd of termNeedles(g)) {
    const s = fold(nd.s).trim(), single = !/[\s-]/.test(s);
    if (s.length < 4 || (single && READER_SKIP.has(s))) continue;
    out.push({ s, id: g.id, single });
  }
  const owners = new Map(); for (const n of out) { if (!owners.has(n.s)) owners.set(n.s, new Set()); owners.get(n.s).add(n.id); }
  return out.filter((n) => owners.get(n.s).size === 1).sort((a, b) => b.s.length - a.s.length);
}
// Each paragraph's first mention of each term, or a chapter's for a one-word name: { id, pieces: [{ i, from, to }] }, in the blocks' own characters.
function termHits() {
  if (R.termHits && R.termHitsOf === R.blocks) return R.termHits;
  const names = readerTermNames(), word = /[\p{L}\p{N}]/u, hits = [];
  const inChapter = new Set();
  for (const run of findRuns()) {
    const taken = [], seen = new Set(), ft = run.ft, ch = (R.secAt && R.secAt[run.segs[0].i]) || "";
    for (const nm of names) {
      if (seen.has(nm.id) || (nm.single && inChapter.has(ch + "\u0006" + nm.id))) continue;
      for (let at = ft.indexOf(nm.s); at >= 0; at = ft.indexOf(nm.s, at + 1)) {
        let end = at + nm.s.length;
        if (ft.startsWith("es", end) && !word.test(ft[end + 2] || "")) end += 2; else if (ft[end] === "s" && !word.test(ft[end + 1] || "")) end += 1;
        if (word.test(ft[at - 1] || "") || word.test(ft[end] || "")) continue;
        if (taken.some(([a, z]) => at < z && end > a)) continue;
        taken.push([at, end]); seen.add(nm.id); inChapter.add(ch + "\u0006" + nm.id);
        const s0 = run.fm[at], e0 = run.fm[end - 1] + 1, pieces = [];
        for (const sg of run.segs) { const a = Math.max(s0, sg.at), z = Math.min(e0, sg.at + sg.len); if (a < z) pieces.push({ i: sg.i, from: a - sg.at + sg.base, to: z - sg.at + sg.base }); }
        if (pieces.length) hits.push({ id: nm.id, pieces });
        break;
      }
    }
  }
  R.termHits = hits; R.termHitsOf = R.blocks;
  return hits;
}
// Terms you linked yourself (Look up → Link to a glossary term), kept on the book as t.termMarks = [{ id, at, passage, anchor }]:
// placed as a note's passage is (placeNote), and shown whether or not the book links terms by itself.
const termMarksOf = (t) => (t && Array.isArray(t.termMarks) ? t.termMarks : []);
function markHits() {
  const B = R.blocks, have = new Set(allTerms().map((g) => g.id)), out = [];
  termMarksOf(S.texts.get(R.tid)).forEach((m, k) => {
    if (!have.has(m.id)) return; // its entry was deleted
    const A = placeNote(m, B); if (!A) return;
    const pieces = [];
    for (let i = A.a; i <= A.b; i++) if (markable(B[i])) pieces.push({ i, from: i === A.a ? A.ao : 0, to: i === A.b ? A.bo : plain(B[i].x || "").length });
    if (pieces.length) out.push({ id: m.id, mark: k, pieces });
  });
  return out;
}
// Underline the terms in the paragraphs on screen, and remember where each is for taps.
function paintTerms() {
  R.termRanges = [];
  const can = window.Highlight && window.CSS && CSS.highlights;
  const hits = R.blocks ? [...markHits(), ...(termsOn(R.tid) ? termHits() : [])] : [];
  if (!hits.length) { if (can) CSS.highlights.delete("term"); return; }
  for (const h of hits) for (const p of h.pieces) { const r = rangeFor(p.i, p.from, p.to); if (r) R.termRanges.push([r, h.id, h.mark]); }
  if (can) { const hl = new Highlight(...R.termRanges.map(([r]) => r)); hl.priority = -1; CSS.highlights.set("term", hl); }
}
// The term under a tap, if any: [term id, the index of your link or undefined].
function termAt(x, y) {
  for (const [r, id, mark] of R.termRanges || []) for (const q of r.getClientRects()) if (x >= q.left - 2 && x <= q.right + 2 && y >= q.top - 2 && y <= q.bottom + 2) return [id, mark];
  return null;
}
function termPanel(id, mark) {
  const g = allTerms().find((x) => x.id === id); if (!g) return;
  const m = Number.isInteger(mark) ? termMarksOf(S.texts.get(R.tid))[mark] : null;
  openPanel(`<h2>${esc(g.t)}</h2>${AREAS[g.a] ? `<p class="hint">${esc(AREAS[g.a])}</p>` : ""}<p class="tdef">${esc(g.d)}</p>
    ${m ? `<p class="hint">You linked “${esc(m.passage)}” to this entry.</p>` : ""}
    <div class="noteacts"><button class="btn primary" data-term="${esc(g.id)}">Open in the glossary</button>${m ? `<button class="btn ghost" data-unmark="${mark}">Unlink</button>` : ""}</div>`, (b) => {
    if (b.dataset.term) openTerm(b.dataset.term);
    else if (b.dataset.unmark) removeTermMark(+b.dataset.unmark);
  });
}
// Link the words of a selection to a glossary entry: choose the entry, searched by name or definition, the closest first.
function linkTermPanel(s) {
  if (!R.tid || !s) return;
  const all = allTerms(), first = lookupTerms(lkNorm(s.text)).map((r) => r.g.id);
  openPanel(`<h2>Link “${esc(s.text)}”</h2>
    <p class="hint">Choose the glossary entry these words stand for here. They are underlined in this book, and a tap opens the entry.</p>
    <input class="search" id="lt-q" type="search" placeholder="Search the glossary" aria-label="Search the glossary">
    <div class="links" id="lt-list"></div>`, (b) => { if (b.dataset.ltterm) addTermMark(s, b.dataset.ltterm); });
  const draw = () => {
    const q = fold($("#lt-q").value.trim());
    const list = q ? all.filter((g) => fold(g.t).includes(q) || fold(g.d).includes(q)) : [...first.map((id) => all.find((g) => g.id === id)).filter(Boolean), ...all.filter((g) => !first.includes(g.id))];
    $("#lt-list").innerHTML = list.slice(0, 40).map((g) => `<button class="lrow" data-ltterm="${esc(g.id)}"><b>${esc(g.t)}</b><span>${esc(g.d.length > 110 ? g.d.slice(0, 109) + "…" : g.d)}</span></button>`).join("") || `<p class="hint">No entry matches.</p>`;
  };
  $("#lt-q").addEventListener("input", draw); draw();
}
async function addTermMark(s, id) {
  const t = S.texts.get(R.tid); if (!t) return;
  const anchor = s.anchor && unspace(quoteOf(R.blocks, s.anchor)) === unspace(s.text) ? s.anchor : undefined;
  const m = { id, at: s.i, passage: s.text, ...(anchor ? { anchor } : {}), createdAt: Date.now() };
  try { await put("texts", R.tid, { ...t, termMarks: [...termMarksOf(t), m], updatedAt: Date.now() }); }
  catch (e) { toast(failMsg(e)); return; }
  paintTerms();
  const g = allTerms().find((x) => x.id === id);
  toast(`Linked to ${g ? g.t : "the glossary"}.`);
}
async function removeTermMark(k) {
  const t = S.texts.get(R.tid), list = termMarksOf(t); if (!t || !list[k]) return;
  const gone = list[k];
  const save = async (marks) => { const now = S.texts.get(R.tid); if (!now) return; await put("texts", R.tid, { ...now, termMarks: marks, updatedAt: Date.now() }); paintTerms(); };
  try { await save(list.filter((_, j) => j !== k)); } catch (e) { toast(failMsg(e)); return; }
  toast("Unlinked.", { label: "Undo", run: () => save([...termMarksOf(S.texts.get(R.tid)), gone]).catch((e) => toast(failMsg(e))) });
}
$("#book").addEventListener("click", (e) => {
  if (!R.termRanges || !R.termRanges.length || selecting()) return;
  if (e.target.closest && e.target.closest("mark[data-note], .mnote, a, button, [data-fn]")) return;
  const hit = termAt(e.clientX, e.clientY); if (!hit) return;
  e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault();
  termPanel(hit[0], hit[1]);
}, true);
let findQ = "";
const FIND = { q: "", hits: [], k: -1, on: false };
// A paragraph's text as shown: after a glued running head that's hidden.
const shownText = (b) => { const x = plain(b.x || ""); return b.st === "hide" && b.sth ? x.slice(b.sth) : x; };
// The continuation of paragraph i past a page break (footnotes, page markers and hidden running heads between), or -1.
function nextPart(B, i) {
  if (!isPara(B[i])) return -1;
  let q = i + 1, brk = false; while (q < B.length && (B[q].k === "fn" || betweenPages(B[q]))) { if (B[q].k !== "fn") brk = true; q++; }
  return brk && q < B.length && carriesOn(B[q]) ? q : -1;
}
// The book as Find reads it: a paragraph and its continuations past printed-page breaks are one run of text, so a phrase
// the printed page split is still found. Each run keeps where each block's text sits in it, and a folded copy (accents and
// capitals ignored) with a map back to the original characters.
// The runs of any book's blocks: [{ text, segs: [{ i, at, len, base }] }] (also what In your books searches).
function textRuns(B) {
  const n = B.length, used = new Uint8Array(n), runs = [];
  for (let i = 0; i < n; i++) {
    const b = B[i]; if (used[i] || b.k === "pg" || isHidden(b)) continue;
    const parts = [i]; used[i] = 1;
    for (let q = nextPart(B, i); q >= 0; q = nextPart(B, q)) { parts.push(q); used[q] = 1; }
    let text = ""; const segs = [];
    for (const k of parts) { if (text) text += glueAfter(text); const x = shownText(B[k]); segs.push({ i: k, at: text.length, len: x.length, base: B[k].st === "hide" && B[k].sth ? B[k].sth : 0 }); text += x; }
    runs.push({ text, segs });
  }
  return runs;
}
function findRuns() {
  if (R.findRuns && R.findRunsOf === R.blocks) return R.findRuns;
  const runs = [];
  for (const { text, segs } of textRuns(R.blocks)) {
    let ft = "", fm = [];
    for (let c = 0; c < text.length; c++) { const ch = text[c], f = ch.charCodeAt(0) < 128 ? ch.toLowerCase() : fold(ch); for (let z = 0; z < f.length; z++) fm.push(c); ft += f; }
    fm.push(text.length);
    runs.push({ text, segs, ft, fm });
  }
  R.findRuns = runs; R.findRunsOf = R.blocks;
  return runs;
}
// Every match of q: the block it starts in, and the stretch of each block it covers (in that block's characters).
function findHits(q) {
  const f = fold(q.trim()); if (f.length < 2 || !R.blocks) return [];
  const hits = [];
  for (const run of findRuns()) {
    for (let at = run.ft.indexOf(f); at >= 0 && hits.length < 1000; at = run.ft.indexOf(f, at + f.length)) {
      const s0 = run.fm[at], e0 = run.fm[at + f.length - 1] + 1, pieces = [];
      for (let k = 0; k < run.segs.length; k++) {
        const sg = run.segs[k], end = sg.at + sg.len; // the space joining two blocks belongs to neither
        const a = Math.max(s0, sg.at), z = Math.min(e0, end); if (a < z) pieces.push({ i: sg.i, from: a - sg.at + sg.base, to: z - sg.at + sg.base });
      }
      if (!pieces.length) continue;
      const a = Math.max(0, s0 - 50), z = Math.min(run.text.length, e0 + 70);
      hits.push({ i: pieces[0].i, pieces, snip: `${a ? "…" : ""}${esc(run.text.slice(a, s0))}<b>${esc(run.text.slice(s0, e0))}</b>${esc(run.text.slice(e0, z))}${z < run.text.length ? "…" : ""}` });
    }
  }
  return hits;
}
// A stretch of block i's text as a range on screen, counting characters the way a selection is measured (offsetIn).
function rangeFor(i, from, to) {
  const el = R.els[i]; if (!el || !el.isConnected) return null;
  const skip = (t) => { const p = t.parentElement; if (p.closest(".mnote, .pgm, .bhid")) return true; const j = p.closest(".bjoin"); return !!j && j !== el && el.contains(j); };
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (skip(t) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  let pos = +el.dataset.o || 0, started = false, t; const r = document.createRange();
  while ((t = w.nextNode())) {
    const L = t.data.length;
    if (!started && from < pos + L) { r.setStart(t, Math.max(0, from - pos)); started = true; }
    if (started && to <= pos + L) { r.setEnd(t, Math.max(0, to - pos)); return r; }
    pos += L;
  }
  return null;
}
function paintFind() {
  if (!window.Highlight || !window.CSS || !CSS.highlights) return;
  if (!FIND.on) { CSS.highlights.delete("find"); CSS.highlights.delete("find-now"); return; }
  const all = [], now = [];
  FIND.hits.forEach((h, k) => { for (const p of h.pieces) { const r = rangeFor(p.i, p.from, p.to); if (r) (k === FIND.k ? now : all).push(r); } });
  CSS.highlights.set("find", new Highlight(...all)); CSS.highlights.set("find-now", new Highlight(...now));
}
// Go to match k: its page in Swipe pages, a third of the way down the screen in Scroll.
function showHit(k, first) {
  const h = FIND.hits[k]; if (!h) return;
  FIND.k = k;
  if (first) jumpTo(h.i, true, true); else { goTo(h.i, true); landed(h.i); }
  paintFind();
  const aim = () => {
    const p = h.pieces[0], r = rangeFor(p.i, p.from, p.to), q = r && r.getClientRects()[0]; if (!q) return;
    if (isPaged()) { setPage(rectPage(q)); R.pagedSpot = currentSpot(); updatePg(); }
    else window.scrollBy(0, q.top - Math.max(barH() + 8, window.innerHeight * 0.3));
  };
  if (isPaged()) aim(); else requestAnimationFrame(aim); // in Scroll, after the paragraph has been placed (scrollToEl)
  drawTrail();
}
function stepFind(dir) { if (FIND.hits.length) showHit((FIND.k + dir + FIND.hits.length) % FIND.hits.length, false); }
function endFind() { FIND.on = false; FIND.k = -1; paintFind(); drawTrail(); }
function findPanel() {
  if (!R.blocks) return;
  openPanel(`<h2>Find in this book</h2>
    <input class="search" id="findq" type="search" placeholder="A word or phrase" value="${esc(findQ)}" autocomplete="off" aria-label="Find in this book">
    <p class="hint" id="findsum"></p>
    <div class="findres" id="findres"></div>`, (b) => {
    if (b.dataset.hit === undefined) return;
    FIND.on = true; showHit(+b.dataset.hit, true);
  });
  const root = $("#sheetroot"), inp = $("#findq", root), res = $("#findres", root), sum = $("#findsum", root);
  let tm;
  const run = () => {
    findQ = inp.value; const hits = findHits(findQ);
    FIND.q = findQ; FIND.hits = hits; FIND.k = -1;
    const pages = new Set(hits.map((h) => R.pageAt[h.i])).size;
    sum.textContent = findQ.trim().length < 2 ? "Type at least two letters." : hits.length ? `${hits.length}${hits.length >= 1000 ? "+" : ""} match${hits.length === 1 ? "" : "es"}${pages > 1 ? ` on ${pages} pages` : ""}. Tap one to go there; the arrows then step through the rest.` : "No matches.";
    res.innerHTML = hits.slice(0, 200).map((h, k) => `<button class="findhit" data-hit="${k}"><span class="fp">${R.pageAt[h.i] ? esc(loc(R.pageAt[h.i])) : ""}</span><span class="fs">${h.snip}</span></button>`).join("") + (hits.length > 200 ? `<p class="hint">Showing the first 200. The arrows reach them all.</p>` : "");
  };
  inp.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(run, 180); });
  run(); inp.focus(); inp.select();
}
function flash(i) { const el = R.els[i]; if (!el) return; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 2400); }

function refreshMarks() {
  if (!R.blocks || R.tid !== S.textId) return;
  const marks = marksByBlock(R.tid);
  const keys = new Set([...marks.keys(), ...R.sig.keys()]);
  for (const i of keys) {
    const s = sigOf(marks.get(i));
    if (s === (R.sig.get(i) || "") || !R.blocks[i] || !R.els[i]) continue;
    rerenderBlock(i, marks);
    if (s) R.sig.set(i, s); else R.sig.delete(i);
  }
}

// Contents, your notes and bookmarks, in one panel with a tab for each. The tab you used last opens next time.
function tocPanel() {
  if (!R.blocks) return;
  const tabs = [["contents", "Contents"], ["notes", "Your notes"], ["marks", "Bookmarks"]];
  const tab = R.tocTab || "contents";
  openPanel(`<div class="seg toctabs">${tabs.map(([v, l]) => `<button class="segb${v === tab ? " on" : ""}" data-keep="1" data-toctab="${v}">${l}</button>`).join("")}</div><div id="tocbody">${tocBody(tab)}</div>`,
  (b) => {
    if (b.dataset.toctab) { R.tocTab = b.dataset.toctab; $("#sheetroot").querySelectorAll("[data-toctab]").forEach((x) => x.classList.toggle("on", x === b)); $("#tocbody").innerHTML = tocBody(R.tocTab); return; }
    if (b.dataset.nscope) { R.noteScope = b.dataset.nscope; $("#tocbody").innerHTML = tocBody("notes"); return; }
    if (b.id === "toc-unhide") return showHidden();
    if (b.dataset.goto) jumpTo(+b.dataset.goto, false, !!b.dataset.quiet);
  });
}
function tocBody(tab) {
  const B = R.blocks, here = contentAt(currentBlock());
  if (tab === "marks") {
    const bms = bookmarksOf(S.texts.get(R.tid)).filter((bm) => bm.at < B.length);
    const snippet = (i) => { for (let k = i; k < Math.min(B.length, i + 4); k++) if (B[k].k !== "pg") { const x = plain(B[k].x || ""); return x.length > 70 ? x.slice(0, 70) + "…" : x; } return ""; };
    return bms.length ? `<div class="toc">${bms.map((bm) => `<button class="tocitem bm" data-goto="${bm.at}"><span>${esc(snippet(bm.at))}</span><span class="tp">${bm.page ? esc(loc(bm.page)) : ""}</span></button>`).join("")}</div>`
      : `<p class="empty">No bookmarks yet. The bookmark button in the toolbar keeps the page you're on.</p>`;
  }
  if (tab === "notes") {
    const sec = R.secAt[here] || "", scope = sec && R.noteScope !== "book" ? "chapter" : "book";
    const all = notesFor(R.tid).filter(([, n]) => Number.isInteger(n.at) && n.at < B.length).sort(([, a], [, b]) => a.at - b.at || (a.createdAt || 0) - (b.createdAt || 0));
    const list = scope === "chapter" ? all.filter(([, n]) => (R.secAt[n.at] || "") === sec) : all;
    const seg = sec ? `<div class="seg nscope">${[["chapter", "This chapter"], ["book", "Whole book"]].map(([v, l]) => `<button class="segb${v === scope ? " on" : ""}" data-keep="1" data-nscope="${v}">${l}</button>`).join("")}</div>` : "";
    const row = ([id, n]) => `<button class="tocitem nitem k-${esc(n.kind || "passage")}" data-goto="${n.at}" data-quiet=""><span><span class="nk">${esc(KINDS[n.kind] || "Passage")}${n.resolved ? ", resolved" : ""}${n.passage && !placed(id, n, B) ? `<em class="nlost"> · not found in the text</em>` : ""}</span>${esc(noteSnippet(n, 110))}</span><span class="tp">${R.pageAt[n.at] ? esc(loc(R.pageAt[n.at])) : n.page ? esc(loc(n.page)) : ""}</span></button>`;
    return seg + (list.length ? `<div class="toc">${list.map(row).join("")}</div>` : `<p class="empty">${scope === "chapter" ? "No notes in this chapter yet." : "No notes placed in this book yet."} Select words and choose Highlight or Add a note.</p>`);
  }
  const names = new Map((S.texts.get(R.tid)?.sections || []).map((x) => [x.id, x.label])), hidden = B.filter((b) => b.st === "hide").length;
  const items = B.map((b, i) => {
    if (b.stj || !isTitleRole(roleOf(b))) return "";
    const label = (roleOf(b) === "chapter" && names.get(b.s)) || titleText(B, i);
    return `<button class="tocitem l${titleLevel(b)}${i <= here && here < R.chEnd[i] && roleOf(b) === "chapter" ? " here" : ""}" data-goto="${i}"><span>${esc(label)}</span><span class="tp">${R.pageAt[i] ? esc(R.pageAt[i]) : ""}</span></button>`;
  }).join("");
  return `<div class="toc">${items || `<p class="empty">No headings were found in this text.</p>`}</div>
    <p class="hint">To mark where a chapter starts, select its title in the text and choose Edit.</p>
    ${hidden ? `<p class="hint">${hidden} running head${hidden === 1 ? " is" : "s are"} hidden. <button class="linkbtn" id="toc-unhide">Show ${hidden === 1 ? "it" : "them"} again</button></p>` : ""}`;
}

let selT;
document.addEventListener("selectionchange", () => { clearTimeout(selT); selT = setTimeout(checkSel, 140); });
function checkSel() {
  const bar = $("#selbar");
  if (S.screen !== "reader" || !R.blocks) { bar.hidden = true; return; }
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) { bar.hidden = true; drawTrail(); drawCarry(); return; }
  const r = sel.getRangeAt(0), book = $("#book");
  if (!book.contains(r.commonAncestorContainer)) { bar.hidden = true; drawTrail(); return; }
  const text = selectionText(r);
  if (text.length < 2) { bar.hidden = true; drawTrail(); return; }
  const idxOf = (node) => { const el = (node.nodeType === 1 ? node : node.parentElement)?.closest("[data-i]"); return el ? +el.dataset.i : null; };
  const i = idxOf(r.startContainer) ?? currentBlock(), j = idxOf(r.endContainer) ?? i;
  const a = R.pageAt[i] || "", b = R.pageAt[j] || "";
  const page = a && b && a !== b ? `${a}–${b}` : a;
  R.sel = { text, i, j, si: offsetIn(i, r.startContainer, r.startOffset), ej: offsetIn(j, r.endContainer, r.endOffset), page, sec: R.secAt[i] || "" };
  // a selection begun on an earlier page (Continue on next page) runs from where that one started
  const C = R.selCarry;
  if (C && (j > C.i || (j === C.i && R.sel.ej > C.si))) {
    const A = { a: C.i, ao: C.si, b: j, bo: R.sel.ej ?? plain(R.blocks[j].x || "").length };
    const pa = R.pageAt[C.i] || "", pb = R.pageAt[j] || "";
    Object.assign(R.sel, { i: C.i, si: C.si, text: quoteOf(R.blocks, A).replace(/\s+/g, " ").trim(), page: pa && pb && pa !== pb ? `${pa}–${pb}` : pa, sec: C.sec });
  }
  R.sel.anchor = selAnchor(R.sel);
  $("#selmore").hidden = !isPaged();
  $("#selsave").textContent = "Add a note";
  $("#sellook").hidden = !(R.sel.text.length <= 48 && R.sel.text.split(/\s+/).length <= 4);
  bar.hidden = false; drawTrail(); drawCarry();
}
function selAnchor(s) {
  if (!R.blocks || !Number.isInteger(s.si) || !Number.isInteger(s.ej) || !markable(R.blocks[s.i]) || !markable(R.blocks[s.j])) return null;
  let b = s.j, bo = s.ej;
  while (b > s.i && (!markable(R.blocks[b]) || bo === 0)) { b--; bo = plain(R.blocks[b].x || "").length; } // ends at the start of the next one
  const xa = plain(R.blocks[s.i].x || ""), xb = plain(R.blocks[b].x || "");
  return { a: s.i, ao: s.si, b, bo, pre: xa.slice(Math.max(0, s.si - 32), s.si), suf: xb.slice(bo, bo + 32) };
}
// Continue on next page: the passage starts here and is finished on the next page.
function carrySel() {
  const s = R.sel; if (!s || !Number.isInteger(s.si)) return;
  R.selCarry = { i: s.i, si: s.si, sec: s.sec, page: s.page };
  try { window.getSelection().removeAllRanges(); } catch {}
  $("#selbar").hidden = true; turnPage(1); drawCarry();
}
function drawCarry() {
  const el = $("#selcarry"); if (!el) return;
  const C = R.selCarry; el.hidden = !C || S.screen !== "reader" || !$("#selbar").hidden;
  if (C) el.innerHTML = `<span>Select where the passage ends. It starts on ${esc(pgLabel(C.i) || "the page before")}.</span><button class="btn" id="selcarryx">Cancel</button>`;
}
const endCarry = () => { R.selCarry = null; drawCarry(); };

/* ---------- the pinned passage (PIN) ---------- */
function savePin() { try { if (PIN) localStorage.setItem("mg-pin", JSON.stringify(PIN)); else localStorage.removeItem("mg-pin"); } catch {} }
// Pinning replaces whatever was pinned before; the toast can undo either.
function setPin(p) {
  const before = PIN; PIN = p; savePin(); drawPin();
  toast(!p ? "Unpinned." : before ? "Pinned. It replaces the passage pinned before." : "Pinned. It stays at the foot of the page while you read.", { label: "Undo", run: () => { PIN = before; savePin(); drawPin(); } });
}
function pinSel() {
  const s = R.sel; if (!s || !R.tid) return;
  $("#selbar").hidden = true; endCarry();
  try { window.getSelection().removeAllRanges(); } catch {}
  const t = S.texts.get(R.tid);
  setPin({ tid: R.tid, at: s.i, text: s.text, page: s.page || "", title: t ? t.title || "" : "", ...(s.anchor ? { anchor: s.anchor } : {}), open: true });
}
function pinNote(nid) {
  const n = S.notes.get(nid); if (!n) return;
  const t = S.texts.get(n.textId);
  setPin({ tid: n.textId, at: Number.isInteger(n.at) ? n.at : null, text: n.passage || n.gloss || n.conclusion || "", page: n.page || "", title: t ? t.title || "" : "", noteId: nid, ...(n.anchor ? { anchor: n.anchor } : {}), open: true });
}
// What the pin shows now, and anything that has changed since it was pinned.
function pinState(p) {
  const t = S.texts.get(p.tid), n = p.noteId ? S.notes.get(p.noteId) : null;
  const passage = n ? n.passage || "" : p.text, gloss = n ? n.gloss || n.conclusion || "" : "";
  const at = n && Number.isInteger(n.at) ? n.at : p.at, anchor = n ? n.anchor : p.anchor;
  let gone = "";
  if (!t) gone = "This book is no longer in your library. The words are kept as you pinned them.";
  else if (p.noteId && !n) gone = "Its note was deleted. The words are kept as you pinned them.";
  else if (passage && Number.isInteger(at) && R.tid === p.tid && R.blocks && !placeNote({ passage, at, anchor }, R.blocks)) gone = "These words have changed in the book since you pinned them.";
  return { t, n, passage, gloss, at, anchor, gone, title: t ? t.title : p.title, page: n ? n.page || "" : p.page };
}
function drawPin() {
  const el = $("#pin"); if (!el) return;
  const show = !!PIN && S.screen === "reader"; // the slider, when open, lies over it, so the pages keep their size
  el.hidden = !show; $("#reader").classList.toggle("pinned", show);
  if (show) {
    const p = PIN, s = pinState(p), where = [s.title, loc(s.page)].filter(Boolean).join(", ");
    const peek = (s.passage || s.gloss).replace(/\s+/g, " ").trim();
    const html = `<div class="pin-head"><button class="pin-tog" id="pin-tog" aria-expanded="${p.open ? "true" : "false"}"><span class="pin-lab">Pinned</span><span class="pin-src">${esc(where)}</span>${p.open ? "" : `<span class="pin-peek">${esc(peek)}</span>`}</button><button class="btn ghost ricon" id="pin-x" aria-label="Unpin">×</button></div>`
      + (p.open ? `<div class="pin-body" id="pin-body" tabindex="0">${s.passage ? `<blockquote class="pin-q">${esc(s.passage)}</blockquote>` : ""}${s.gloss ? `<p class="pin-g">${esc(s.gloss)}</p>` : ""}${s.gone ? `<p class="pin-gone">${esc(s.gone)}</p>` : ""}</div>
        <div class="pin-acts">${s.t && Number.isInteger(s.at) ? `<button class="btn" id="pin-go">Go to it</button>` : ""}<button class="btn ghost" id="pin-min">Collapse</button></div>` : "");
    if (el.dataset.html !== html) { el.dataset.html = html; el.innerHTML = html; } // redrawn only when it changes, so its scroll stays put
    el.classList.toggle("open", !!p.open);
  }
  pinSize();
}
// The pages are cut above the pin, so it never covers a line; changing its size keeps your place, as a resize does.
function pinSize() {
  const el = $("#pin"), h = el && !el.hidden ? Math.ceil(el.getBoundingClientRect().height) : 0;
  if (h === PINH) return;
  PINH = h; document.documentElement.style.setProperty("--pin-h", h + "px");
  if (isPaged() && R.blocks && R.pageW) { const sp = R.pagedSpot || currentSpot(); layoutPages(); goToSpot(sp); }
}
// Go to it: the words found again in their book (moved by an edit, or changed); your place and a way back are kept.
async function pinGo() {
  const p = PIN, s = p && pinState(p); if (!s || !s.t || !Number.isInteger(s.at)) return;
  let B = R.tid === p.tid && R.blocks ? R.blocks : null;
  if (!B) { try { B = await loadContent(p.tid); } catch { B = null; } }
  const A = B && s.passage ? placeNote({ passage: s.passage, at: s.at, anchor: s.anchor }, B) : null;
  const i = A ? A.a : s.at;
  PIN = { ...PIN, open: false }; savePin();
  const changed = B && s.passage && !A ? "These words have changed in the book since you pinned them. This is where they were." : "";
  if (S.screen === "reader" && R.tid === p.tid && R.blocks) { jumpTo(i); drawPin(); if (changed) toast(changed); return; }
  const from = S.screen === "reader" ? S.texts.get(R.tid) : null;
  go({ screen: "reader", textId: p.tid, at: i, flash: true });
  if (from) toast(`${changed ? changed + " " : ""}Back returns you to ${from.title || "the book you were reading"}.`, { label: "Back", run: () => back() });
  else if (changed) toast(changed);
}
$("#pin").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b || !PIN) return;
  if (b.id === "pin-tog") { PIN = { ...PIN, open: !PIN.open }; savePin(); drawPin(); }
  else if (b.id === "pin-min") { PIN = { ...PIN, open: false }; savePin(); drawPin(); }
  else if (b.id === "pin-x") setPin(null);
  else if (b.id === "pin-go") pinGo();
});
if (window.ResizeObserver) new ResizeObserver(() => pinSize()).observe($("#pin"));
// How far into block k's text (in characters, italics markers left out) a point of the selection is.
function offsetIn(k, node, off) {
  const el = R.els[k]; if (!el || !el.contains(node)) return null;
  const rg = document.createRange();
  try { rg.setStart(el, 0); rg.setEnd(node, off); } catch { return null; }
  const f = rg.cloneContents(); f.querySelectorAll(".mnote, .pgm, .bjoin, .bhid").forEach((x) => x.remove());
  return (+el.dataset.o || 0) + f.textContent.length;
}
