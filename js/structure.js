// Marginalia: marking a book's structure with Edit, and the reader's gestures and controls. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- marking the structure of a book: Edit → what is this? ---------- */
const ROLE_DONE = { chapter: "Marked as a chapter title.", heading: "Marked as a heading.", hide: "Running head hidden.", title: "Marked as a title page.", quote: "Marked as a block quote.", text: "Back to plain text." };
// Which blocks a selection covers for a role: whole blocks, or the start of one paragraph (sth). A string says why not.
function structureRange(s, role) {
  const B = R.blocks, txt = (k) => plain(B[k].x || "");
  let { i, j } = s, si = s.si ?? 0, ej = s.ej ?? txt(j).length;
  // a selection that only touches the next paragraph, or starts at the very end of the one before, leaves it out
  while (j > i && (B[j].k === "pg" || !txt(j).slice(0, ej).trim())) { j--; ej = txt(j).length; }
  while (i < j && (B[i].k === "pg" || !txt(i).slice(si).trim())) { i++; si = 0; }
  if (B[i].k === "pg") return "Select some words of the text.";
  if (role === "text" || role === "title" || role === "quote") return { from: i, to: j };
  const atStart = !txt(i).slice(0, si).trim(), atEnd = !txt(j).slice(ej).trim();
  if (!atStart) return role === "hide" ? "Select the running head from its first word." : "Select the title from its first word. Only the start of a paragraph can be made a title.";
  if (atEnd) return { from: i, to: j };
  if (i < j) return "The selection runs on into the text after it. Select the title only.";
  const sth = txt(i).slice(0, ej).trimEnd().length;
  return sth ? { from: i, to: i, sth } : "Select some words of the text.";
}
// The other running heads like the one selected: the same words, whatever the page number in them.
function lookalikes(range) {
  const B = R.blocks, head = range.sth ? plain(splitAt(B[range.from].x, range.sth)[0]) : B.slice(range.from, range.to + 1).filter((b) => b.k !== "pg").map((b) => plain(b.x)).join(" ");
  const num = (t) => /^\p{N}+$/u.test(t), toks = head.match(/\p{L}+|\p{N}+/gu) || [];
  while (toks.length && num(toks[0])) toks.shift(); // the page number, on either side
  while (toks.length && num(toks[toks.length - 1])) toks.pop();
  if (toks.join("").replace(/\p{N}/gu, "").length < 3 || head.length > 140) return [];
  const sep = "[^\\p{L}\\p{N}]*", pn = `(?:\\p{N}+${sep})?`, body = toks.map((t) => (num(t) ? "\\p{N}+" : t)).join(sep);
  const re = new RegExp(`^${sep}${pn}${body}${sep}${pn}${range.sth ? "" : "$"}`, "iu");
  const out = [];
  B.forEach((b, k) => {
    if ((k >= range.from && k <= range.to) || b.k === "pg" || b.k === "front" || b.stj || b.st === "hide" || b.st === "title") return;
    const x = plain(b.x || ""), m = re.exec(x);
    if (!m) return;
    if (!range.sth) out.push({ k });
    else { const n = m[0].trimEnd().length; if (x.slice(n).trim()) out.push({ k, sth: n }); }
  });
  return out;
}
// A title's further lines stay joined to it only while it is still a title.
function tidyStructure(B, set) {
  let ok = false;
  for (let k = 0; k < B.length; k++) {
    if (B[k].stj && !ok) set(k, (c) => { delete c.stj; });
    const c = B[k]; ok = c.stj ? true : isTitleLead(c);
  }
}
// Sections follow the chapter titles in reading order, keeping their names and ticks. Sections you typed that were
// never tied to a place in the text stay, after them.
function sectionsFor(t, oldBlocks, blocks, names) {
  const old = t.sections || [], byId = new Map(old.map((s) => [s.id, s])), tied = new Set(), out = [], seen = new Set();
  oldBlocks.forEach((b) => { if (b.s) tied.add(b.s); });
  blocks.forEach((b, k) => {
    if (b.stj || !b.s || roleOf(b) !== "chapter" || seen.has(b.s)) return;
    seen.add(b.s); const was = byId.get(b.s), label = names.get(b.s);
    out.push(was ? { ...was, ...(label ? { label } : {}) } : { id: b.s, label: label || titleText(blocks, k).slice(0, 90) || "Untitled", done: false });
  });
  for (const s of old) if (!seen.has(s.id) && !tied.has(s.id)) out.push(s);
  return out;
}
// Save a new arrangement of the book: its blocks, its sections, and the notes filed by where they are in the text.
async function commitStructure(tid, blocks, sections, notes) {
  const t = S.texts.get(tid); if (!t) throw new UErr("This text is no longer available.");
  const data = { ...t, sections, updatedAt: Date.now() };
  if (idb) await idbTx(["content", "texts", "notes"], (st) => {
    st("content").put(blocks, tid); st("texts").put(data, tid);
    for (const [id, n] of notes) st("notes").put(n, id);
  });
  S.content.set(tid, blocks); S.texts.set(tid, data); for (const [id, n] of notes) S.notes.set(id, n);
  if (R.tid === tid && R.blocks) {
    const spot = currentSpot();
    R.blocks = blocks; Object.assign(R, sectionIndex(blocks)); R.chunks = chunkStarts(blocks); R.pagedSpot = null;
    renderBook(spot.i);
    requestAnimationFrame(() => { if (R.tid !== tid) return; goToSpot(spot); updatePg(); drawTrail(); });
  }
}
// Notes filed under the section their passage was in move with it; notes you filed elsewhere stay, unless their
// section is gone.
function refile(tid, oldSec, newSec, sections) {
  const ids = new Set(sections.map((s) => s.id)), out = new Map(), n0 = R.blocks.length;
  for (const [id, n] of S.notes) {
    if (n.textId !== tid) continue;
    const at = Number.isInteger(n.at) && n.at >= 0 && n.at < n0 ? n.at : null, cur = n.sectionId || "";
    let to = cur;
    if (at !== null && cur === (oldSec[at] || "")) to = newSec[at] || "";
    else if (cur && !ids.has(cur)) to = at !== null ? newSec[at] || "" : "";
    if (to !== cur) out.set(id, { ...n, sectionId: to });
  }
  return out;
}
async function applyStructure(role, range, opts = {}) {
  const tid = R.tid, t = S.texts.get(tid), old = R.blocks;
  if (!t || !old) throw new UErr("This text is no longer open.");
  const next = old.slice(), prev = new Map(), names = new Map();
  const set = (k, fn) => { if (!prev.has(k)) prev.set(k, old[k]); const c = { ...next[k] }; fn(c); next[k] = c; };
  const reset = (c) => { const s = c.s; delete c.st; delete c.sth; delete c.stj; delete c.s; return s; };
  for (let k = range ? range.from : 0; range && k <= range.to; k++) {
    if (old[k].k === "pg") continue;
    set(k, (c) => {
      const sid = reset(c);
      if (role === "text") { if (c.k === "h" || c.k === "q") c.st = "text"; return; }
      if (isTitleRole(role) && k > range.from) { c.stj = true; return; }
      c.st = role;
      if (range.sth) c.sth = range.sth;
      if (role === "chapter") { c.s = sid || gid(); if (opts.label) names.set(c.s, opts.label); }
    });
  }
  for (const a of opts.also || []) set(a.k, (c) => { reset(c); c.st = "hide"; if (a.sth) c.sth = a.sth; });
  for (const k of opts.clear || []) set(k, (c) => { reset(c); });
  tidyStructure(next, set);
  const sections = sectionsFor(t, old, next, names), oldSec = R.secAt.slice();
  const notes = refile(tid, oldSec, sectionIndex(next).secAt, sections);
  const undo = { tid, prev, sections: t.sections || [], notes: new Map([...notes.keys()].map((id) => [id, S.notes.get(id)])) };
  await commitStructure(tid, next, sections, notes);
  return undo;
}
async function undoStructure(u) {
  if (R.tid !== u.tid || !R.blocks) { toast("Open the book again to undo."); return; }
  const next = R.blocks.slice(); for (const [k, b] of u.prev) next[k] = b;
  const notes = new Map([...u.notes].filter(([id]) => S.notes.has(id)));
  try { await commitStructure(u.tid, next, u.sections, notes); toast("Undone."); } catch (e) { toast(failMsg(e)); }
}
// Hidden lines can't be selected, so Contents brings them all back.
async function showHidden() {
  const ks = []; R.blocks.forEach((b, k) => { if (b.st === "hide") ks.push(k); });
  try { const u = await applyStructure("text", null, { clear: ks }); toast(`${ks.length} running head${ks.length === 1 ? "" : "s"} shown again.`, { label: "Undo", run: () => undoStructure(u) }); }
  catch (e) { toast(e instanceof UErr ? e.message : failMsg(e)); }
}
function structureDone(role, u, n) {
  const msg = role === "hide" && n > 1 ? `${n} running heads hidden.` : ROLE_DONE[role];
  toast(msg, { label: "Undo", run: () => undoStructure(u) });
}
async function markStructure(role, range, opts) {
  try { const u = await applyStructure(role, range, opts); structureDone(role, u, 1 + ((opts && opts.also) || []).length); }
  catch (e) { toast(e instanceof UErr ? e.message : failMsg(e)); }
}
// Edit: say what the selected words are, or correct them.
function structurePanel() {
  const s = R.sel, tid = R.tid; if (!s || !tid || !R.blocks) return;
  $("#selbar").hidden = true;
  try { window.getSelection().removeAllRanges(); } catch {}
  let lead = s.i; while (lead > 0 && R.blocks[lead].stj) lead--;
  const now = roleOf(R.blocks[lead]) || "text";
  const opt = (role, name, what) => `<button class="fixopt${now === role ? " on" : ""}" data-role="${role}"><b>${name}${now === role ? `<em>now</em>` : ""}</b><span>${what}</span></button>`;
  const clip = (x) => (x.length > 90 ? x.slice(0, 89) + "…" : x);
  openPanel(`<h2>Edit</h2><p class="sub">“${esc(clip(s.text))}”</p>
    <div class="label">These words are</div>
    <div class="fixopts">
      ${opt("chapter", "A chapter title", "Starts a section in Sections, which runs until the next chapter title. In Swipe pages it begins on a new page.")}
      ${opt("heading", "A heading", "A heading inside a chapter.")}
      ${opt("hide", "A running head", "The title repeated at the top of each printed page. Hidden.")}
      ${opt("title", "A title page", "Centred, on pages of its own in Swipe pages.")}
      ${opt("quote", "A block quote", "A quotation set off from the text, indented.")}
      ${opt("text", "Plain text", "Reading text. Takes off any of the above.")}
    </div>
    <div class="fixopts"><button class="fixopt" data-role="words"><b>Correct the words…</b><span>Edit the wording of the whole paragraph.</span></button></div>`,
  (b) => {
    const role = b.dataset.role; if (!role || R.tid !== tid) return;
    if (role === "words") return editSelectedParagraph();
    const range = structureRange(s, role);
    if (typeof range === "string") { toast(range); return; }
    if (role === "chapter") return chapterSheet(range);
    if (role === "hide") { const more = lookalikes(range); if (more.length) return hideSheet(range, more); }
    markStructure(role, range);
  });
}
function chapterSheet(range) {
  const B = R.blocks, b = B[range.from], tid = R.tid, t = S.texts.get(tid);
  const was = b.s && (t.sections || []).find((x) => x.id === b.s);
  const words = range.sth ? plain(splitAt(b.x, range.sth)[0]) : B.slice(range.from, range.to + 1).filter((x) => x.k !== "pg").map((x) => plain(x.x)).reduce((a, x) => (a ? a + glueAfter(a) + x : x), "");
  const name = (was && was.label) || words.replace(/\s+/g, " ").trim().slice(0, 90);
  let undo = null;
  openSheet(`<h2>Chapter title</h2>
    <div class="field"><label for="ch-name">Name in Sections</label><input id="ch-name" name="name" value="${esc(name)}" autocomplete="off"></div>
    <p class="hint">The chapter starts here and runs until the next chapter title.${range.to > range.from ? " The selected lines are shown as one title." : ""}${range.sth ? " The rest of the paragraph stays reading text." : ""}</p>`,
  async (fd) => {
    if (R.tid !== tid || R.blocks !== B) return "The text changed while this was open. Select the title again.";
    const label = String(fd.get("name") || "").replace(/\s+/g, " ").trim(); if (!label) return "Give the chapter a name.";
    undo = await applyStructure("chapter", range, { label });
    return () => structureDone("chapter", undo, 1);
  });
}
function hideSheet(range, more) {
  const B = R.blocks, tid = R.tid;
  const show = more.slice(0, 3).map(({ k, sth }) => { const x = plain(sth ? splitAt(B[k].x, sth)[0] : B[k].x).trim(), p = R.pageAt[k]; return `<li>${esc(x.length > 60 ? x.slice(0, 59) + "…" : x)}${p ? `<span class="tp"> ${esc(loc(p))}</span>` : ""}</li>`; }).join("");
  openSheet(`<h2>Running head</h2>
    <label class="chkrow"><input type="checkbox" name="all" checked> Also hide the ${more.length} other line${more.length === 1 ? "" : "s"} like it</label>
    <ul class="likelist">${show}${more.length > 3 ? `<li class="tp">and ${more.length - 3} more</li>` : ""}</ul>
    <p class="hint">Hidden lines stay in the book and in search. Contents can show them again.</p>`,
  async (fd) => {
    if (R.tid !== tid || R.blocks !== B) return "The text changed while this was open. Select the running head again.";
    const also = fd.get("all") ? more : [];
    const undo = await applyStructure("hide", range, { also });
    return () => structureDone("hide", undo, 1 + also.length);
  });
}
// Edit the whole paragraph containing the start of the selection, preserving block indices.
function editSelectedParagraph() {
  const s = R.sel, tid = R.tid;
  if (!s || !tid || !R.blocks) return;
  const i = s.i, original = R.blocks[i];
  if (!original || original.k === "pg") { toast("Select words in a paragraph to edit it."); return; }
  $("#selbar").hidden = true;
  try { window.getSelection().removeAllRanges(); } catch {}
  const initial = plain(original.x || "");
  openSheet(`<h2>Edit text</h2>
    <p class="hint">Edit the whole paragraph. Changes are saved to your local copy; the uploaded file isn't changed. Existing notes keep their original quotations.</p>
    <div class="field"><label for="edit-paragraph">Paragraph</label>
    <textarea id="edit-paragraph" name="paragraph" class="verbatim" rows="12">${esc(initial)}</textarea></div>
    <p class="hint">Imported italics in this paragraph become plain text when you save changes.</p>
    ${(S.texts.get(tid) || {}).source && S.texts.get(tid).source.kind === "PDF" ? `<details class="optfield" id="ed-pp"><summary>The printed page</summary><div class="ppbox" id="ed-ppbox"></div></details>` : ""}`,
    async (fd) => {
      if (R.tid !== tid || !R.blocks || R.blocks[i] !== original) return "The text changed while the editor was open. Reopen it to edit.";
      const value = String(fd.get("paragraph") || "").replace(/\r\n?/g, "\n").trim();
      if (!value) return "The paragraph cannot be empty.";
      if (value === initial) return;
      const next = R.blocks.slice();
      next[i] = { ...original, x: value };
      const t = S.texts.get(tid);
      if (!t) return "This text is no longer available.";
      const metadata = { ...t, updatedAt: Date.now() };
      const spot = currentSpot();
      // One transaction keeps text content and its metadata consistent for backups.
      if (idb) await idbTx(["content", "texts"], (st) => {
        st("content").put(next, tid);
        st("texts").put(metadata, tid);
      });
      S.content.set(tid, next);
      S.texts.set(tid, metadata);
      R.blocks = next;
      const marks = marksByBlock(tid), el = R.els[i];
      if (el) rerenderBlock(i, marks);
      R.dirty = true;
      requestAnimationFrame(() => { if (R.tid !== tid) return; goToSpot(spot); updatePg(); drawTrail(); });
      return () => toast("Paragraph updated.");
    },
    (root) => {
      const d = $("#ed-pp", root), box = $("#ed-ppbox", root);
      if (d) {
        d.addEventListener("toggle", () => { if (d.open && !d.dataset.done) { d.dataset.done = "1"; printedInto(box, tid, i); } });
        box.addEventListener("click", (e) => { if (e.target.id === "pp-keep") closeOverlay().then(() => keepPdfSheet(tid)); });
      }
      const ta = $("#edit-paragraph", root); if (ta) ta.focus();
    });
}
function saveSel() {
  const s = R.sel; if (!s) return;
  $("#selbar").hidden = true;
  try { window.getSelection().removeAllRanges(); } catch {}
  endCarry();
  noteSheet(null, { passage: s.text, page: s.page, sectionId: s.sec, at: s.i, kind: "passage", ...(s.anchor ? { anchor: s.anchor } : {}) });
}
["mousedown", "pointerdown"].forEach((ev) => ["#selsave", "#selhl", "#sellook", "#seledit", "#selmore", "#selpin"].forEach((id) => $(id).addEventListener(ev, (e) => e.preventDefault())));
// The selected words, leaving out any of your notes shown in the margin.
function selectionText(r) {
  const frag = r.cloneContents();
  frag.querySelectorAll(".mnote, .pgm, .bhid").forEach((x) => x.remove());
  const blocks = [...frag.childNodes].some((x) => x.nodeType === 1 && /^(P|H2|DIV)$/.test(x.tagName));
  return (blocks ? [...frag.childNodes].map((x) => x.textContent).join(" ") : frag.textContent).replace(/\s+/g, " ").trim();
}
// One tap: save the selection as a passage, no sheet. Tap the highlight later to add a note.
async function quickHighlight() {
  const s = R.sel; if (!s || !R.tid) return;
  $("#selbar").hidden = true; endCarry();
  try { window.getSelection().removeAllRanges(); } catch {}
  const id = gid(), note = { textId: R.tid, kind: "passage", passage: s.text, page: s.page, sectionId: s.sec, at: s.i, gloss: "", createdAt: Date.now(), updatedAt: Date.now() };
  if (s.anchor) note.anchor = s.anchor;
  try {
    await put("notes", id, note);
    const t = S.texts.get(R.tid); if (t) put("texts", R.tid, { ...t, activeAt: Date.now() }).catch(() => {});
    // the toast offers the kinds you'd mark straight away, and Undo; tap the highlight later for the rest
    const kind = (k, label) => ({ label, run: async () => { const n = S.notes.get(id); if (!n) return; try { await put("notes", id, { ...n, kind: k, updatedAt: Date.now() }); toast(`Marked as ${label.toLowerCase()}.`, { label: "Undo", run: () => { const m = S.notes.get(id); if (m) put("notes", id, { ...m, kind: "passage", updatedAt: Date.now() }).catch((e) => toast(failMsg(e))); } }); } catch (e) { toast(failMsg(e)); } } });
    toast("Highlighted.", [kind("question", "Question"), kind("objection", "Objection"), { label: "Undo", run: () => del("notes", id).then(() => toast("Highlight removed.")).catch((e) => toast(failMsg(e))) }]);
  } catch (e) { toast(failMsg(e)); }
}

let rafP = 0, posT = 0;
window.addEventListener("scroll", () => {
  if (S.screen !== "reader" || !R.blocks) return;
  if (!rafP) rafP = requestAnimationFrame(() => { rafP = 0; updatePg(); });
  clearTimeout(posT); posT = setTimeout(settle, 1500);
}, { passive: true });
let resizeT;
window.addEventListener("resize", () => {
  R.dirty = true;
  if (!isPaged() || !R.blocks) return;
  if (R.flip) doneFlip(R.flip.commit === true);
  const sp = R.pagedSpot || currentSpot(); // taken before the new size changes the pages
  clearTimeout(resizeT); resizeT = setTimeout(() => { if (!isPaged()) return; layoutPages(); goToSpot(sp); }, 150);
});
let snapT;
$("#book").addEventListener("scroll", () => {
  if (!isPaged() || !R.blocks) return;
  if (!rafP) rafP = requestAnimationFrame(() => { rafP = 0; updatePg(); });
  clearTimeout(snapT); snapT = setTimeout(snapPage, 160);
  clearTimeout(posT); posT = setTimeout(settle, 900);
}, { passive: true });
document.addEventListener("selectionchange", () => { const s = window.getSelection(); if (isPaged() && s && s.isCollapsed) { clearTimeout(snapT); snapT = setTimeout(snapPage, 160); } });
// Swipes: the page follows the finger a little (damped, so it never shows a neighbouring page),
// then turns once the swipe is long enough, or settles back. A touch held still first is a selection, never a swipe.
let swipeStart = null;
const selecting = () => { const s = window.getSelection(); return !!(s && !s.isCollapsed); };
$("#book").addEventListener("touchstart", (e) => {
  if (!isPaged() || e.touches.length !== 1) { swipeStart = null; return; }
  const now = performance.now();
  if (R.flip) doneFlip(R.flip.commit === true); // a turn still moving finishes as the next touch begins
  swipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: now, horizontal: false, off: false, px: e.touches[0].clientX, pt: now, v: 0, flip: 0 };
}, { passive: true });
$("#book").addEventListener("touchmove", (e) => {
  if (!swipeStart || swipeStart.off || !isPaged()) return;
  if (e.touches.length !== 1 || selecting()) { swipeStart.off = true; $("#book").style.transform = ""; if (R.flip) settleFlip(false); return; }
  const dx = e.touches[0].clientX - swipeStart.x, dy = e.touches[0].clientY - swipeStart.y, now = performance.now();
  if (now > swipeStart.pt) { swipeStart.v = (e.touches[0].clientX - swipeStart.px) / (now - swipeStart.pt); swipeStart.px = e.touches[0].clientX; swipeStart.pt = now; } // finger speed, px per ms
  if (!swipeStart.horizontal) {
    if (Math.abs(dx) < 12) return;
    if (performance.now() - swipeStart.t > 450 || Math.abs(dx) < Math.abs(dy) * 1.5) { swipeStart.off = true; return; } // a long press, or a vertical move
    swipeStart.horizontal = true;
  }
  if (e.cancelable) e.preventDefault();
  if (reducedMotion() || RS.turn === "none") return;
  if (flipMode() && swipeStart.flip !== "edge") {
    if (!swipeStart.flip) swipeStart.flip = startFlip(dx < 0 ? 1 : -1) ? (dx < 0 ? 1 : -1) : "edge";
    if (swipeStart.flip !== "edge") {
      // How far the page has turned follows the finger across most of the screen; moving back past the start leaves it flat.
      const q = Math.max(0, Math.min(1, (-swipeStart.flip * dx) / (pageStride() * 0.85)));
      drawFlip(swipeStart.flip > 0 ? q : 1 - q);
      return;
    }
  }
  const edge = (dx > 0 && currentPage() === 0) || (dx < 0 && currentPage() === lastPage()) || swipeStart.flip === "edge";
  const off = Math.max(-44, Math.min(44, dx * (edge ? 0.12 : 0.3)));
  if (R.turnAnim) { R.turnAnim.cancel(); R.turnAnim = null; }
  $("#book").style.transform = `translateX(${off}px)`;
}, { passive: false });
function endSwipe(e, cancelled) {
  const s = swipeStart; swipeStart = null;
  const book = $("#book"), was = book.style.transform;
  book.style.transform = "";
  if (!s || !s.horizontal || s.off || !isPaged()) { if (R.flip) settleFlip(false); snapPage(); return; }
  const t = !cancelled && e.changedTouches && e.changedTouches[0];
  const dx = t ? t.clientX - s.x : 0, dy = t ? t.clientY - s.y : 0;
  // A long swipe, or a short flick still moving fast when the finger lifts, turns one page.
  const far = Math.abs(dx) >= Math.max(70, window.innerWidth * 0.16), flick = Math.abs(dx) >= 40 && Math.abs(s.v) >= 0.25 && Math.sign(s.v) === Math.sign(dx);
  R.lastSwipe = { dx: Math.round(dx), dy: Math.round(dy), v: Math.round(s.v * 100) / 100, far, flick };
  if (R.flip && s.flip && s.flip !== "edge") { settleFlip(!!t && (far || flick) && Math.sign(dx) === -s.flip && Math.abs(dx) > Math.abs(dy) * 1.5 && !selecting()); return; }
  if (t && (far || flick) && Math.abs(dx) > Math.abs(dy) * 1.5 && !selecting()) turnPage(dx < 0 ? 1 : -1);
  else if (was && !reducedMotion() && book.animate) book.animate([{ transform: was }, { transform: "translateX(0)" }], { duration: 160, easing: "ease-out" });
}
$("#book").addEventListener("touchend", (e) => endSwipe(e, false), { passive: true });
$("#book").addEventListener("touchcancel", (e) => endSwipe(e, true), { passive: true });
document.addEventListener("visibilitychange", () => {
  if (S.screen !== "reader") return;
  if (document.visibilityState === "hidden") savePos(true); else { paceTick(); wakeOn(); } // the phone lets go of the screen when the app is hidden
});
["pointerdown", "keydown", "wheel"].forEach((ev) => document.addEventListener(ev, () => { if (S.screen === "reader") wakeOn(); }, { passive: true }));
$("#rnav-r").addEventListener("input", (e) => { if (!R.blocks) return; R.dragging = true; const i = navBlock(+e.target.value); $("#rnav-where").textContent = navLabel(i); $("#rnav-pct").textContent = `${Math.round(e.target.value / 10)}%`; });
$("#rnav-r").addEventListener("change", (e) => { if (!R.blocks) return; R.dragging = false; jumpTo(navBlock(+e.target.value), false, true); syncNav(); });
$("#rnav-pg").addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || !R.blocks) return;
  e.preventDefault(); const t = S.texts.get(R.tid), v = e.target.value.trim(), other = t && t.conc && v.match(/^([^\s\d]+)\s*(\S+)$/);
  // "M 34" or "Minuit 34": the other edition's page, through the pairs
  const want = other && fold(t.conc.label).startsWith(fold(other[1])) ? (concPage(t, other[2], true) || {}).p : v;
  const i = blockForPage(want);
  if (i < 0) { toast(other ? `That ${t.conc.label} page can't be placed in this edition yet.` : "That page isn't in this book's page numbers."); return; }
  e.target.value = ""; e.target.blur(); jumpTo(i, false, true); syncNav();
});
// Swipe pages: a tap near the right edge turns forward, near the left edge back; in the middle it shows or hides the
// toolbar. A tap that ends a selection, or lands on a highlight or a note, does only that.
let downSel = false;
$("#book").addEventListener("pointerdown", () => { downSel = selecting(); }, true);
$("#book").addEventListener("click", (e) => {
  if (!isPaged() || !R.blocks || downSel || selecting()) return;
  if (e.target.closest && e.target.closest("mark[data-note], .mnote, a, button, [data-fn]")) return;
  const x = e.clientX / window.innerWidth;
  if (x < 0.28) turnPage(-1); else if (x > 0.72) turnPage(1); else if (immersive()) showBars(!$("#reader").classList.contains("bars-on"));
});
